import type { ChatOpenAI } from '@langchain/openai';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

export class AiModule {
  constructor(
    readonly chatModel: ChatOpenAI,
    readonly aiService: AiService,
    readonly aiController: AiController,
  ) {}
}
