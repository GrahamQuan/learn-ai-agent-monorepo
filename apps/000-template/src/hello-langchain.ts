import { ChatOpenAI } from "@langchain/openai";
import { env } from "./env";

const model = new ChatOpenAI({
  modelName: env.MODEL_NAME,
  apiKey: env.AI_SDK_KEY,
  configuration: {
    baseURL: env.AI_SDK_BASE_URL,
  },
});

const response = await model.invoke(`
  Introduce yourself.
  return with 2 languages: English and Simplified Chinese.
`);
console.log(response.content);
