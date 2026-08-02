import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import type { Runnable } from '@langchain/core/runnables';
import type { ChatOpenAI } from '@langchain/openai';

export interface AiServiceLike {
  runChain(query: string): Promise<string>;
  streamChain(query: string): AsyncGenerator<string>;
}

export class AiService implements AiServiceLike {
  private readonly chain: Runnable<{ query: string }, string>;

  constructor(model: ChatOpenAI) {
    const prompt = PromptTemplate.fromTemplate('请回答以下问题：\n\n{query}');
    this.chain = prompt.pipe(model).pipe(new StringOutputParser());
  }

  async runChain(query: string): Promise<string> {
    return this.chain.invoke({ query });
  }

  async *streamChain(query: string): AsyncGenerator<string> {
    const stream = await this.chain.stream({ query });

    for await (const chunk of stream) {
      yield chunk;
    }
  }
}
