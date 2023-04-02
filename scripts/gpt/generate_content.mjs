import wiki from 'wikijs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Configuration, OpenAIApi } from 'openai';
import { getFinalUrlPiece } from '../wikipedia/utils.mjs';
import * as dotenv from 'dotenv';
dotenv.config();

const filename = path.resolve(process.cwd(), '.db/database.db');
const db = await open({
  filename,
  driver: sqlite3.Database,
});

const configuration = new Configuration({
  organization: process.env.OPENAI_ORG,
  apiKey: process.env.OPENAI_API_KEY,
});
const openAI = new OpenAIApi(configuration);

async function generateOneSentence(summary) {
  const blurb = summary.split('\n')[0];
  const promptText = `Here's the summary paragraph from the wikipedia article on "${title}":

"${blurb}"

The following is a short, unquoted, one-sentence description of "${title}", based on the summary above:`;
  const text = await getCompletion(promptText);
  return text.trim();
}

const SPECIAL_SECTIONS = ['Notes', 'References', 'External links', 'See also'];

function includesSpecialSection(line) {
  return SPECIAL_SECTIONS.some((x) =>
    line.toUpperCase().includes(x.toUpperCase()),
  );
}

async function getCompletion(promptText) {
  const response = await openAI.createCompletion({
    model: 'text-davinci-003',
    prompt: promptText,
    max_tokens: 1000,
    temperature: 1,
    user: 'kiwipedia-dev',
    n: 1,
  });
  return response.data.choices[0].text;
}

function getPrefix(title, oneSentence) {
  return `Here's the one-sentence description of the article for "${title}" in the english version of Wikipedia:

  ${oneSentence}
`;
}

export async function generateSections(title, oneSentence) {
  const promptText = `${getPrefix(title, oneSentence)}
The following is the list of sections, in a numbered bullet point list, of the article for "${title}" in the english version of Wikipedia:`;
  const text = await getCompletion(promptText);
  const sections = text
    .split('\n')
    .filter((line) => {
      if (line.length === 0) return false;
      if (includesSpecialSection(line)) return false;
      return true;
    })
    .map((x) => {
      // Remove the numbered bullet points
      return x.replace(/^\d+\.\s+/, '');
    });

  return sections;
}

export async function generateSummary(title, oneSentence) {
  const promptText = `${getPrefix(title, oneSentence)}
The following is the summary of the article for "${title}" in the english version of Wikipedia:`;
  const text = await getCompletion(promptText);
  return text.trim();
}

export async function generateSectionText(title, section, oneSentence) {
  const promptText = `${getPrefix(title, oneSentence)}
The following is the text for the section "${section}" of the article for "${title}" in the english version of Wikipedia:`;
  const text = await getCompletion(promptText);
  return text.trim();
}

const title = "Alice's Adventures in Wonderland";
const page = await wiki().page(title);
const url = page.canonicalurl;
const pageId = getFinalUrlPiece(url);
const wikiSummary = await page.summary();

const oneSentence = await generateOneSentence(wikiSummary);
console.log('🔥 generated one sentence', oneSentence);
const summary = await generateSummary(title, oneSentence);
console.log('🔥 generated summary', summary);
const sections = await generateSections(title, oneSentence);
console.log('🔥 generated sections', sections);

const jsonObj = {
  title,
  oneSentence,
  summary,
  sections: [],
};
for (const section of sections) {
  const text = await generateSectionText(title, section, oneSentence);
  console.log('🔥 generated', section);
  jsonObj.sections.push({ section, text });
}

const insertData = {
  ':title': title,
  ':page_id': pageId,
  ':url': url,
  ':json': JSON.stringify(jsonObj),
};

const insertResult = await db.run(
  'INSERT INTO synth_articles(title, page_id, url, json) VALUES (:title, :page_id, :url, :json)',
  insertData,
);

console.log('🌵 synthesized', title);
