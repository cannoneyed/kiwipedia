import { MongoClient, ServerApiVersion } from 'mongodb';
import wiki from 'wikijs';
import path from 'path';
import { Configuration, OpenAIApi } from 'openai';
import { getFinalUrlPiece } from '../wikipedia/utils.mjs';
import * as dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

await client.connect();
console.log('Connected successfully to db');

const db = client.db('kiwipedia');
const collection = db.collection('wikis');

const configuration = new Configuration({
  organization: process.env.OPENAI_ORG,
  apiKey: process.env.OPENAI_API_KEY,
});
const openAI = new OpenAIApi(configuration);

async function generateOneSentence(title, summary) {
  const blurb = summary.split('\n')[0];
  const promptText = `Here's the summary paragraph from the wikipedia article on "${title}":

"${blurb}"

Please write a short, unquoted, one-sentence description of "${title}", based on the summary above:`;
  const text = await getCompletion(promptText);
  return text.trim();
}

const SPECIAL_SECTIONS = [
  'Notes',
  'References',
  'External links',
  'See also',
  'Further reading',
];

function includesSpecialSection(line) {
  return SPECIAL_SECTIONS.some((x) =>
    line.toUpperCase().includes(x.toUpperCase()),
  );
}

async function getCompletion(promptText) {
  const response = await openAI.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful bot in charge of constructing a new version of wikipedia from scratch.',
      },
      { role: 'user', content: promptText },
    ],
    max_tokens: 1000,
    temperature: 1,
    user: 'kiwipedia-dev',
    n: 1,
  });
  return response.data.choices[0].message.content;
}

function getPrefix(title, oneSentence) {
  return `Here's the one-sentence description of the article for "${title}" in the english version of Wikipedia:

  "${oneSentence}"
`;
}

const BULLETS = ['-', '*'];
function startsWithBulletPoint(title) {
  // Check to see if the title starts with " - " or " * ", which we do by
  // splitting at the character and ensuring that the first split element is
  // empty.
  const removed = removeBulletPoint(title);
  return removed !== title;
}

function removeBulletPoint(title) {
  // Check to see if the title starts with " - " or " * ", which we do by
  // splitting at the character and ensuring that the first split element is
  // empty.
  for (const bullet of BULLETS) {
    const prefix = ` ${bullet} `;
    const pieces = title.split(prefix).map((x) => x.trim());
    if (pieces[0] === '') {
      return pieces.slice(1).join();
    }
  }
  return title;
}

function postprocessSections(sectionTitles) {
  const sections = sectionTitles.map((title) => ({ title, text: '' }));
  const mainSections = [];

  // Parse out subsections starting with a bullet point and add them to the
  // parent section.
  let currentSection = null;
  let currentSubsections = [];
  let isInSubsection = false;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const isSubsection = startsWithBulletPoint(section.title);
    section.title = removeBulletPoint(section.title);

    if (isSubsection) {
      currentSubsections.push(section);
      isInSubsection = true;
    } else {
      if (currentSection) {
        currentSection.subsections = currentSubsections;
      }
      currentSection = section;
      currentSubsections = [];
      mainSections.push(section);
      isInSubsection = false;
    }
  }

  // Handle the final section
  if (isInSubsection) {
    currentSection.subsections = currentSubsections;
  }

  return sections;
}

async function generateSections(title, oneSentence) {
  const promptText = `${getPrefix(title, oneSentence)}
Please write the list of sections, in a numbered bullet point list, of the article for "${title}" in the english version of Wikipedia:`;
  const text = await getCompletion(promptText);
  const sectionTitles = text
    .split('\n')
    .filter((line) => {
      if (line.trim().length === 0) return false;
      if (includesSpecialSection(line)) return false;
      return true;
    })
    .map((x) => {
      // Remove the numbered bullet points
      x = x.replace(/^\d+\.\s+/, '');
      // Remove the trailing period
      if (x.endsWith('.')) x = x.slice(0, x.length - 1);
      return x;
    });

  return postprocessSections(sectionTitles);
}

async function generateSummary(title, oneSentence) {
  const promptText = `${getPrefix(title, oneSentence)}
Please write the summary of the article for "${title}" in the english version of Wikipedia, in a paragraph or two:`;
  const text = await getCompletion(promptText);
  return text.trim();
}

function removeTitle(title, text) {
  // Oftentimes, the title of the section is repeated in the first sentence.
  const lines = text.split('\n');
  if (
    lines.length &&
    lines[0].toUpperCase().includes(title.toUpperCase()) &&
    lines[0].length - title.length < 3
  ) {
    lines.shift();
  }
  return lines.join('\n').trim();
}

async function generateSectionText(title, sectionTitle, oneSentence) {
  const promptText = `${getPrefix(title, oneSentence)}
Please write the text for the section "${sectionTitle}" of the article for "${title}" in the english version of Wikipedia. Writing should be in great detail and cover multiple paragraphs.`;
  const text = await getCompletion(promptText);

  return removeTitle(sectionTitle, text);
}

export async function generateContent(title) {
  const page = await wiki().page(title);
  const url = page.canonicalurl;
  const pageId = getFinalUrlPiece(url);
  const wikiSummary = await page.summary();

  const oneSentence = await generateOneSentence(title, wikiSummary);
  console.log('🔥 generated one sentence');
  const summary = await generateSummary(title, oneSentence);
  console.log('🔥 generated summary');
  const sections = await generateSections(title, oneSentence);
  console.log('🔥 generated sections');

  const data = {
    title,
    pageId,
    oneSentence,
    summary,
    sections: [],
  };
  for (const section of sections) {
    section.text = await generateSectionText(title, section.title, oneSentence);
    const subsections = section.subsections || [];
    for (const subsection of subsections) {
      subsection.text = await generateSectionText(
        title,
        subsection.title,
        oneSentence,
      );
    }
    console.log('🔥 generated', section.title);
    data.sections.push(section);
  }

  page.sections = mainSections;
  await collection.replaceOne({ pageId: data.pageId }, data);

  console.log('🌵 synthesized', title);
}

generateContent('Cactus');
