import wiki from 'wikijs';
import { getFinalUrlPiece } from '../wikipedia/utils.mjs';
import { system } from './system.mjs';
import {
  generateStableDiffusionPrompt,
  generateCaptionForSection,
} from './generate_image.mjs';

async function generateOneSentence(title, summary) {
  const blurb = summary.split('\n')[0];
  const promptText = `Here's the summary paragraph from the wikipedia article on "${title}":

"${blurb}"

Please write a short, unquoted, one-sentence description of "${title}", based on the summary above:`;
  const text = await system.getCompletion(promptText);
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

function getPrefix(title, oneSentence) {
  return `Here's the one-sentence description of the article for "${title}" in the english version of Wikipedia:

  "${oneSentence}"
`;
}

function startsWithBulletPoint(title) {
  // Check to see if the title starts with " - " or " * " or 'a.', which we do
  // by splitting at the character and ensuring that the first split element is
  // empty.
  const removed = removeBulletPoint(title);
  return removed !== title;
}

function removeBulletPoint(title) {
  // Check to see if the title starts with " - " or " * ", which we do by
  // splitting at the character and ensuring that the first split element is
  // empty.
  const regex = /\w\. | - | \* /;
  const pieces = title.split(regex);
  if (pieces[0].trim() === '') {
    return pieces.slice(1).join();
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
  const text = await system.getCompletion(promptText);
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
      // Remove decimal bullet points
      x = x.replace(/^\d+\.\d+\s+/, '');
      // Remove the trailing period
      if (x.endsWith('.')) x = x.slice(0, x.length - 1);
      return x;
    });

  return postprocessSections(sectionTitles);
}

async function generateSummary(title, oneSentence) {
  const promptText = `${getPrefix(title, oneSentence)}
Please write the summary of the article for "${title}" in the english version of Wikipedia, in a paragraph or two:`;
  const text = await system.getCompletion(promptText);
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
  const text = await system.getCompletion(promptText);

  return removeTitle(sectionTitle, text);
}

async function generateImage(title, sectionTitle, sectionText) {
  console.log('🔥 generating image for', title);
  const caption = await generateCaptionForSection(
    title,
    sectionTitle,
    sectionText,
  );
  const stableDiffusionPrompt = await generateStableDiffusionPrompt(
    title,
    caption,
  );
  try {
    const genUrl = await system.generateImage(stableDiffusionPrompt);
    const pieces = genUrl.split('/');
    const hash = pieces[pieces.length - 2];
    await system.downloadImage(genUrl, `/tmp/${hash}.png`);
    await system.postProcessImage(`/tmp/${hash}.png`);
    const imageUrl = await system.uploadImage(
      `/tmp/${hash}.jpeg`,
      `${hash}.jpeg`,
    );
    return { url: imageUrl, prompt: stableDiffusionPrompt, caption };
  } catch (e) {
    console.error(e);
  }
}

export async function generateContent(title) {
  console.log('🌵 generating', title);
  const collection = system.db.collection('wikis');

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
  console.log(sections);

  const data = {
    title,
    pageId,
    oneSentence,
    summary,
    sections,
  };

  const sectionGenerators = [];

  for (const section of data.sections) {
    const sectionGenerator = () =>
      generateSectionText(title, section.title, oneSentence).then((text) => {
        console.log('🔥 generated section', section.title);
        section.text = text;
      });
    sectionGenerators.push(sectionGenerator);
    const subsections = section.subsections || [];
    for (const subsection of subsections) {
      const subsectionGenerator = () =>
        generateSectionText(title, subsection.title, oneSentence).then(
          (text) => {
            console.log(
              '🔥 generated subsection',
              section.title,
              subsection.title,
            );
            subsection.text = text;
          },
        );
      sectionGenerators.push(subsectionGenerator);
    }
  }

  // Simple parallel limiting, 3 at a time
  while (sectionGenerators.length) {
    await Promise.all(sectionGenerators.splice(0, 3).map((fn) => fn()));
  }

  // Add image
  data.mainImage = await generateImage(title, 'summary', data.summary);

  await collection.replaceOne({ title }, data, { upsert: true });

  console.log('🌵 synthesized', title);
}
