import { ChatOpenAI } from '@langchain/openai';
import { env, openAiConfig, type ENV } from '../env';

export class LlmService {
  constructor(private readonly configService: ENV = env) {}

  getModel() {
    return new ChatOpenAI({
      model: this.configService.MODEL_NAME,
      apiKey: openAiConfig.apiKey,
      configuration: { baseURL: openAiConfig.baseURL },
    });
  }
}
