import { system } from './system.mjs';
import {
  generateStableDiffusionPrompt,
  generateCaptionForPrompt,
  generateCaptionForSection,
} from './generate_image.mjs';

await system.initialize();

const pageId = 'Vikings';

const collection = system.db.collection('wikis');
const page = await collection.findOne({
  pageId,
});

console.log('🔥 generating images for', page.title);
// console.log(page);

async function generateSectionImages() {
  for (let i = 0; i < page.sections.length; i++) {
    await generateSectionImage(i);
    return;
  }
}

await generateSummaryImage();
await generateSectionImage(8);
await generateSectionImage(9);

system.close();
