// Script to load the most popular 1000 articles per month from 2016 on
import wiki from 'wikijs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { generateContent } from './generate_content.mjs';

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
  const result = await db.get('SELECT * FROM synth_articles WHERE title=?', [
    title,
  ]);
  return result;
}

async function generatePopular() {
  const results = await getArticlesSortedByPageViews(20);

  for (const result of results) {
    const existing = await getSynthedArticle(result.title);
    if (existing) continue;
    console.log('🌵 generating', result.title);
    await generateContent(result.title);
  }
  console.log('✨ done!');
}

generatePopular();
