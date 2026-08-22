import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import type { StructuredToolInterface } from '@langchain/core/tools';
import type { ChatOpenAI } from '@langchain/openai';
import type { UIMessage } from 'ai';
import { type AIMessageChunk, createAgent } from 'langchain';

export class AiService {
  private readonly agent: ReturnType<typeof createAgent>;

  constructor(
    private readonly webSearchTool: StructuredToolInterface,
    private readonly sendMailTool: StructuredToolInterface,
    model: ChatOpenAI,
  ) {
    this.agent = createAgent({
      model,
      tools: [this.webSearchTool, this.sendMailTool],
      systemPrompt:
        '你是 AI 助手，需要最新信息、事实核查或联网信息时，请使用 web_search 工具搜索后再作答。发送邮件用 send_mail 工具',
    });
  }

  async stream(messages: UIMessage[]) {
    const lcMessages = await toBaseMessages(messages);
    const lgStream = await this.agent.stream(
      { messages: lcMessages },
      {
        streamMode: ['messages', 'values'],
        recursionLimit: 30,
      },
    );

    return toUIMessageStream(lgStream as AsyncIterable<AIMessageChunk>);
  }
}
