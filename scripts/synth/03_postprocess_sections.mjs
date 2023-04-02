import { MongoClient, ServerApiVersion } from 'mongodb';
import wiki from 'wikijs';
import path from 'path';
import { Configuration, OpenAIApi } from 'openai';
import { getFinalUrlPiece } from '../wikipedia/utils.mjs';
import * as dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

await client.connect();
console.log('Connected successfully to db');

const db = client.db('kiwipedia');
const collection = db.collection('wikis');

const pages = await collection.find({}).toArray();

const BULLETS = ['-', '*'];
function startsWithBulletPoint(title) {
  // Check to see if the title starts with " - " or " * ", which we do by
  // splitting at the character and ensuring that the first split element is
  // empty.
  const removed = removeBulletPoint(title);
  return removed !== title;
}

function removeBulletPoint(title) {
  // Check to see if the title starts with " - " or " * ", which we do by
  // splitting at the character and ensuring that the first split element is
  // empty.
  for (const bullet of BULLETS) {
    const prefix = ` ${bullet} `;
    const pieces = title.split(prefix).map((x) => x.trim());
    if (pieces[0] === '') {
      return pieces.slice(1).join();
    }
  }
  return title;
}

for (const page of pages) {
  const mainSections = [];

  let currentSection = null;
  let currentSubsections = [];
  let isInSubsection = false;

  for (let i = 0; i < page.sections.length; i++) {
    const section = page.sections[i];
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

  // Handle the case where the final section ends on a subsection

  // If the mainSections is different (indicating we've moved subsections into
  // the section object), then we need to update the page.
  if (mainSections.length !== page.sections.length) {
    page.sections = mainSections;
    await collection.replaceOne({ _id: page._id }, page);
  }
}

client.close();
