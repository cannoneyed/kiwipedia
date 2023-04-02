// Script to load the most popular 1000 articles per month from 2016 on
import wiki from 'wikijs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { getPageViews } from './utils.mjs';

const filename = path.resolve(process.cwd(), '.db/database.db');
const db = await open({
  filename,
  driver: sqlite3.Database,
});

async function getArticleEntry(pageId) {
  const result = await db.get(
    'SELECT title FROM popular_articles WHERE page_id=?',
    [pageId],
  );
  return result;
}

function getFinalUrlPiece(url) {
  const urlPieces = url.split('/');
  return urlPieces[urlPieces.length - 1];
}

function getCategory(url) {
  return getFinalUrlPiece(url);
}

const ARTICLES_FILTERS = [':', 'Main_Page'];

async function loadPopularForMonthYear(year, month) {
  const BASE_URL = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikisource/all-access`;
  month = month.toString().padStart(2, '0');
  const url = `${BASE_URL}/${year}/${month}/all-days`;
  const response = await fetch(url);
  const json = await response.json();
  const articles = json.items[0].articles
    .filter((entry) => {
      return !ARTICLES_FILTERS.some((f) => entry.article.includes(f));
    })
    .map((entry) => entry.article);
  return articles;
}

async function loadPopular() {
  let count = 0;

  for (let year = 2016; year <= 2023; year++) {
    for (let month = 1; month <= 12; month++) {
      const pageIds = await loadPopularForMonthYear(year, month);
      for (const pageId of pageIds) {
        const result = await getArticleEntry(pageId);
        if (!result) {
          try {
            const page = await wiki().page(pageId);
            const pageViews = await getPageViews(pageId);
            const insertData = {
              ':title': page.title,
              ':page_id': pageId,
              ':url': page.canonicalurl,
              ':pageviews': pageViews,
            };
            const insertResult = await db.run(
              'INSERT INTO popular_articles(title, page_id, url, pageviews) VALUES (:title, :page_id, :url, :pageviews)',
              insertData,
            );
            console.log('inserted 🔥', year, month, pageId, pageViews);
          } catch (e) {
            // pass
          }
        }
      }
    }
  }
}

loadPopular();
