import { MongoClient, ServerApiVersion } from 'mongodb';
import wiki from 'wikijs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Configuration, OpenAIApi } from 'openai';
import { getFinalUrlPiece } from '../wikipedia/utils.mjs';
import * as dotenv from 'dotenv';
dotenv.config();

const filename = path.resolve(process.cwd(), '.db/database.db');
const sqliteDb = await open({
  filename,
  driver: sqlite3.Database,
});

const uri = `mongodb+srv://adminUser:${process.env.MONGO_DB_PASSWORD}@kiwipedia.x4jxthc.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const dbName = 'kiwipedia';

await client.connect();

console.log('Connected successfully to server');
const db = client.db('kiwipedia');
const collection = db.collection('wikis');

const pages = await sqliteDb.all('SELECT * FROM synth_articles');
console.log('🌵', pages.length);
for (const item of pages) {
  const json = JSON.parse(item.json);
  const toInsert = {
    title: item.title,
    pageId: item.page_id,
    oneSentence: json.oneSentence.trim(),
    summary: json.summary.trim(),
    sections: json.sections.map((section) => {
      return { text: section.text.trim(), title: section.section };
    }),
  };
  const results = await collection.find({ title: item.title }).toArray();
  if (results.length === 0) {
    await collection.insertOne(toInsert);
    console.log(toInsert.title);
  }
}

client.close();
console.log('CLOSED!');
