import fs from 'fs';
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

async function getArticleEntry(title) {
  const result = await db.get('SELECT * FROM synth_articles WHERE title=?', [
    title,
  ]);
  return result;
}

const title = "Alice's Adventures in Wonderland";

const result = await getArticleEntry(title);
console.log(result);
