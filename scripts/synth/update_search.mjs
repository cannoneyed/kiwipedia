// for the default version
import algoliasearch from 'algoliasearch';
import { system } from './system.mjs';

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_API_KEY,
);
const algoliaIndex = client.initIndex('kiwipedia');

await system.initialize();
const collection = system.db.collection('wikis');
const pages = await collection.find({}).toArray();

const records = pages.map((page) => {
  return {
    title: page.title,
    pageId: page.pageId,
    objectID: page.pageId,
  };
});

algoliaIndex.saveObjects(records);
