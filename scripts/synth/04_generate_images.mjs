import { system } from './system.mjs';
import {
  generateStableDiffusionPrompt,
  generateCaption,
} from './generate_image.mjs';

await system.initialize();

const collection = system.db.collection('wikis');
const pages = await collection.find({}).toArray();

for (const page of pages) {
  if (page.mainImage) continue;
  console.log('🔥 generating image for', page.title);
  const stableDiffusionPrompt = await generateStableDiffusionPrompt(page.title);
  const caption = await generateCaption(page.title, stableDiffusionPrompt);
  try {
    const imageUrl = await system.generateImage(stableDiffusionPrompt);
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
