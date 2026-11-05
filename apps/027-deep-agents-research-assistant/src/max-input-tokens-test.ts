import { ChatOpenAI } from '@langchain/openai';
import { env } from './env.js';

const model = new ChatOpenAI({
  model: env.OPENAI_MODEL,
  apiKey: env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: env.OPENAI_BASE_URL,
  },
});

console.log(model.profile.maxInputTokens);

Object.defineProperty(model, 'profile', {
  get: () => ({ maxInputTokens: 1_024 }),
});

console.log(model.profile.maxInputTokens);
