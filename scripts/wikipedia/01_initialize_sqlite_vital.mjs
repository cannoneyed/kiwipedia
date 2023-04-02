import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

// open the database
const filename = path.resolve(process.cwd(), '.db/database.db');
const db = await open({
  filename,
  driver: sqlite3.Database,
});

await db.exec(
  'CREATE TABLE vital_articles (title TEXT, url TEXT, level INTEGER, category TEXT, pageviews INTEGER DEFAULT 0)',
);
console.log('🔥 Created table vital_articles');
