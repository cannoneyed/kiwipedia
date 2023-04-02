import { MongoClient, ServerApiVersion } from 'mongodb';
import Replicate from 'replicate';
import wiki from 'wikijs';
import path from 'path';
import { Configuration, OpenAIApi } from 'openai';
import { getFinalUrlPiece } from '../wikipedia/utils.mjs';
import * as dotenv from 'dotenv';
dotenv.config();

class System {
  isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    // Initialize MongoDB
    // =========================================================================
    const uri = process.env.MONGODB_URI;
    this.mongoClient = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: ServerApiVersion.v1,
    });

    await this.mongoClient.connect();
    this.db = this.mongoClient.db('kiwipedia');

    // Initialize OpenAI
    // =========================================================================
    const configuration = new Configuration({
      organization: process.env.OPENAI_ORG,
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openAI = new OpenAIApi(configuration);

    // Initialize Replicate
    // =========================================================================
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log('🌵 System initialized');
  }

  async getCompletion(promptText) {
    const response = await this.openAI.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful bot in charge of constructing a new version of wikipedia from scratch.',
        },
        { role: 'user', content: promptText },
      ],
      max_tokens: 1000,
      temperature: 1,
      user: 'kiwipedia-dev',
      n: 1,
    });
    return response.data.choices[0].message.content;
  }

  async generateImage(prompt) {
    const output = await this.replicate.run(
      'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
      {
        input: {
          prompt,
        },
      },
    );
    const imageUrl = output[0];
    return imageUrl;
  }

  close() {
    this.mongoClient.close();
  }
}

export const system = new System();
