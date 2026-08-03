import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { AiService } from './ai.service';

export class AiController {
  readonly routes = new Hono();

  constructor(private readonly aiService: AiService) {
    this.routes.get('/chat', async (c) => c.json(await this.chat(c.req.query('query') ?? '')));
    this.routes.get('/chat/stream', (c) => {
      const query = c.req.query('query') ?? '';
      return streamSSE(c, async (stream) => {
        for await (const chunk of this.chatStream(query)) {
          await stream.writeSSE({ data: chunk });
        }
      });
    });
  }

  async chat(query: string) {
    const answer = await this.aiService.runChain(query);
    return { answer };
  }

  chatStream(query: string): AsyncIterable<string> {
    return this.aiService.runChainStream(query);
  }
}
