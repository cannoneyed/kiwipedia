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

async function generateAndSaveImage(stableDiffusionPrompt) {
  const genUrl = await system.generateImage(stableDiffusionPrompt);
  const pieces = genUrl.split('/');
  const hash = pieces[pieces.length - 2];
  await system.downloadImage(genUrl, `/tmp/${hash}.png`);
  console.log('🔥 generated image', genUrl);
  await system.postProcessImage(`/tmp/${hash}.png`);
  const imageUrl = await system.uploadImage(
    `/tmp/${hash}.jpeg`,
    `${hash}.jpeg`,
  );
  return imageUrl;
}

async function generateForSection(pageTitle, sectionTitle, sectionText) {
  const caption = await generateCaptionForSection(
    pageTitle,
    sectionTitle,
    sectionText,
  );
  const stableDiffusionPrompt = await generateStableDiffusionPrompt(
    pageTitle,
    caption,
  );
  const imageUrl = await generateAndSaveImage(stableDiffusionPrompt);
  return { caption, imageUrl };
}

async function generateSummaryImage() {
  // Generate the summary section image.
  const pageTitle = page.title;
  const sectionTitle = 'Summary';
  const sectionText = page.summary;
  console.log(`🔥 generating summary image...`);
  const { imageUrl, caption } = await generateForSection(
    pageTitle,
    sectionTitle,
    sectionText,
  );
  console.log('caption:', caption);
  try {
    await collection.updateOne(
      { pageId: page.pageId },
      {
        $set: {
          mainImage: { url: imageUrl, caption },
        },
      },
    );
    console.log('🔥 updated summary image');
  } catch (e) {
    console.error(e);
  }
}

async function generateSectionImage(sectionIndex) {
  // Generate the image for a section.
  const pageTitle = page.title;
  const sectionTitle = page.sections[sectionIndex].title;
  const sectionText = page.sections[sectionIndex].text;
  console.log(`🔥 generating section ${sectionTitle}...`);
  const { imageUrl, caption } = await generateForSection(
    pageTitle,
    sectionTitle,
    sectionText,
  );
  console.log('caption:', caption);
  try {
    await collection.updateOne(
      { pageId: page.pageId },
      {
        $set: {
          [`sections.${sectionIndex}.image`]: { url: imageUrl, caption },
        },
      },
    );
    console.log(`🔥 updated section ${sectionTitle}`);
  } catch (e) {
    console.error(e);
  }
}

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
