import wiki from 'wikijs';
import path from 'path';
import { ConcurrentPromiseQueue } from 'concurrent-promise-queue';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { system } from './system.mjs';
import { generateContent } from './generate_content.mjs';

await system.initialize();
const collection = system.db.collection('wikis');
const pages = await collection.find({}, { limit: 10 }).toArray();

async function generateSectionLinks(section, pageTitle) {
  const sectionTitle = section.title;
  const sectionText = section.text;

  const promptText = `The following is the text for the ${sectionTitle} section of the ${pageTitle} article on Wikipedia:

${sectionText}

Please list all words that should have links added to them, in a bulleted list. For example:

* [word1]
* [word2]
*`;
  const response = await system.getCompletion(promptText);
  console.log('🥝', response);
}

async function generatePageLinks(page) {
  const queue = new ConcurrentPromiseQueue({
    maxNumberOfConcurrentPromises: 8,
  });
  const allPromises = [];

  for (const section of page.sections.slice(0, 1)) {
    const promise = queue.addPromise(async () => {
      try {
        await generateSectionLinks(section, page.title);
      } catch (e) {
        console.error('ERROR', e);
      }
    });
    allPromises.push(promise);
  }

  await Promise.all(allPromises);
}

async function generateLinks() {
  const queue = new ConcurrentPromiseQueue({
    maxNumberOfConcurrentPromises: 8,
  });
  const allPromises = [];

  for (const page of pages.slice(0, 1)) {
    const promise = queue.addPromise(async () => {
      try {
        await generatePageLinks(page);
      } catch (e) {
        console.error('ERROR', e);
      }
    });
    allPromises.push(promise);
  }

  await Promise.all(allPromises);
}

await generateLinks();
