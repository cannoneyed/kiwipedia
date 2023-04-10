import { system } from './system.mjs';
import {
  generateStableDiffusionPrompt,
  generateCaptionForPrompt,
} from './generate_image.mjs';

await system.initialize();

const collection = system.db.collection('wikis');
const pages = await collection.find({}).toArray();

for (const page of pages.slice(1)) {
  console.log('🔥 generating image for', page.title);
  const stableDiffusionPrompt = await generateStableDiffusionPrompt(page.title);
  const caption = await generateCaptionForPrompt(
    page.title,
    stableDiffusionPrompt,
  );
  try {
    const genUrl = await system.generateImage(stableDiffusionPrompt);
    const pieces = genUrl.split('/');
    const hash = pieces[pieces.length - 2];
    await system.downloadImage(genUrl, `/tmp/${hash}.png`);
    await system.postProcessImage(`/tmp/${hash}.png`);
    const imageUrl = await system.uploadImage(
      `/tmp/${hash}.jpeg`,
      `${hash}.jpeg`,
    );
    await collection.updateOne(
      { title: page.title },
      {
        $set: {
          imageUrl: null,
          mainImage: { url: imageUrl, prompt: stableDiffusionPrompt, caption },
        },
      },
    );
    console.log('🔥 updated image');
  } catch (e) {
    console.error(e);
  }
}

system.close();
