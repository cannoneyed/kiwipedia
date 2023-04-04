// Script to load the most popular 1000 articles per month from 2016 on
import wiki from 'wikijs';
import path from 'path';
import { ConcurrentPromiseQueue } from 'concurrent-promise-queue';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { system } from './system.mjs';
import { generateContent } from './generate_content.mjs';

await system.initialize();

const filename = path.resolve(process.cwd(), '.db/database.db');
const db = await open({
  filename,
  driver: sqlite3.Database,
});

async function getArticlesSortedByPageViews(nItems = 100) {
  const results = await db.all(
    'SELECT * FROM vital_articles ORDER BY pageviews DESC LIMIT ?',
    [nItems],
  );
  return results;
}

async function getSynthedArticle(title) {
  const collection = system.db.collection('wikis');
  const result = await collection.findOne({ title });
  return result;
}

async function generatePopular() {
  const results = await getArticlesSortedByPageViews(10000);

  const queue = new ConcurrentPromiseQueue({
    maxNumberOfConcurrentPromises: 8,
  });
  const allPromises = [];

  for (const result of results) {
    const promise = queue.addPromise(async () => {
      try {
        console.log('🌵 checking', result.title);
        const existing = await getSynthedArticle(result.title);
        if (existing) return;
        console.log('🌵 generating', result.title);
        await generateContent(result.title);
      } catch (e) {
        console.error('ERROR', e);
      }
    });
    allPromises.push(promise);
  }

  await Promise.all(allPromises);

  console.log('✨ done!');
}

generatePopular();
