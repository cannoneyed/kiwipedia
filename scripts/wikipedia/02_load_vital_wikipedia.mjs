// Script to load the top 10,000 vital level 4 article titles from Wikipedia
import wiki from 'wikijs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { getPageViews, getFinalUrlPiece } from './utils.mjs';

const filename = path.resolve(process.cwd(), '.db/database.db');
const db = await open({
  filename,
  driver: sqlite3.Database,
});

async function getArticleEntry(title) {
  const result = await db.get(
    'SELECT title FROM vital_articles WHERE title=?',
    [title],
  );
  return result;
}

function getCategory(url) {
  return getFinalUrlPiece(url);
}

async function loadLevel4() {
  let count = 0;

  const data = await wiki().page('Wikipedia:Vital_articles/Level/4');
  const tables = await data.tables();
  const rows = tables[0].filter((row) =>
    row.sublist.includes('Wikipedia:Vital articles/Level/4'),
  );

  for (const row of rows) {
    const data = await wiki().page(row.sublist);
    const links = await data.links();

    for (const link of links) {
      const result = await getArticleEntry(link);
      if (!result) {
        const category = getFinalUrlPiece(row.sublist);
        const page = await wiki().page(link);
        const pageId = getFinalUrlPiece(page.canonicalurl);
        const pageViews = await getPageViews(pageId);
        const insertData = {
          ':title': link,
          ':url': page.canonicalurl,
          ':level': 4,
          ':category': category,
          ':pageviews': pageViews,
        };
        const insertResult = await db.run(
          'INSERT INTO vital_articles(title, url, level, category, pageviews) VALUES (:title, :url, :level, :category, :pageviews)',
          insertData,
        );
      }
      count += 1;
      console.log('🔥', count, link);
    }
  }
}

loadLevel4();
