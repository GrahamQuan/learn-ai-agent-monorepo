import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { env } from './env';

export const VECTOR_DIM = 1024;

function createModel(temperature: number = 0) {
  return new ChatOpenAI({
    modelName: env.MODEL_NAME,
    apiKey: env.AI_SDK_KEY,
    temperature,
    configuration: {
      baseURL: env.AI_SDK_BASE_URL,
    },
  });
}

export const model = createModel();

export const modelWithTemperature = createModel(0.7);

export const embeddings = new OpenAIEmbeddings({
  apiKey: env.AI_SDK_KEY,
  model: env.EMBEDDINGS_MODEL_NAME,
  configuration: {
    baseURL: env.AI_SDK_BASE_URL,
  },
  dimensions: VECTOR_DIM,
});
