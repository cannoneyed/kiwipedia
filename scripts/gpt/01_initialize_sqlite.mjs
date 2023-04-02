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

await db.exec('DROP TABLE synth_articles');
await db.exec(
  'CREATE TABLE synth_articles (title TEXT, page_id TEXT, url TEXT, json TEXT)',
);
console.log('🔥 Created table synth_articles');
