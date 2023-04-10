import wiki from 'wikijs';
import path from 'path';
import { ConcurrentPromiseQueue } from 'concurrent-promise-queue';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { system } from './system.mjs';
import { generateContent } from './generate_content.mjs';
import {
  generateStableDiffusionPrompt,
  generateCaptionForSection,
} from './generate_image.mjs';

await system.initialize();
const collection = system.db.collection('wikis');
const pages = await collection.find({}).toArray();

/// =================

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

export async function generateSummaryImage(page) {
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

export async function generateSectionImage(page, sectionIndex) {
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

async function generatePageImages(page) {
  const queue = new ConcurrentPromiseQueue({
    maxNumberOfConcurrentPromises: 8,
  });
  const allPromises = [];

  // Generate the summary image
  const promise = queue.addPromise(async () => {
    try {
      console.log('🌵 generating summary image for', page.title);
      await generateSummaryImage(page);
    } catch (e) {
      console.error('ERROR', e);
    }
  });
  allPromises.push(promise);

  // Generate for 50% of sections
  for (let i = 0; i < page.sections.length; i++) {
    const section = page.sections[i];
    if (Math.random() < 0.5) continue;

    const promise = queue.addPromise(async () => {
      try {
        console.log(
          '🌵 generating section image for',
          page.title,
          ':',
          section.title,
        );
        await generateSectionImage(page, i);
      } catch (e) {
        console.error('ERROR', e);
      }
    });
    allPromises.push(promise);
  }

  await Promise.all(allPromises);
}

async function generateImages() {
  for (const page of pages) {
    // Only generate images for those articles that don't have multiple images
    let nImages = 0;
    for (const section of page.sections) {
      if (section.image) {
        nImages += 1;
      }
    }

    if (nImages >= 1) {
      console.log('Skipping', page.title);
      continue;
    }

    await generatePageImages(page);
  }
}

await generateImages();
