import { createUIMessageStreamResponse, type UIMessage } from 'ai';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { AiService } from './ai.service';

export class AiController {
  readonly routes = new Hono();

  constructor(private readonly aiService: AiService) {
    this.routes.post('/chat', async (context) => {
      let body: { messages?: UIMessage[] };

      try {
        body = await context.req.json<{ messages?: UIMessage[] }>();
      } catch {
        throw new HTTPException(400, { message: 'Invalid JSON' });
      }

      return this.postChat(body);
    });
  }

  /**
    本地测试：
    curl -N -sS -X POST 'http://localhost:3000/api/ai/chat' \
      -H 'Content-Type: application/json' \
      -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"北京今天的天气"}]}]}'
   */
  async postChat(body: { messages?: UIMessage[] }): Promise<Response> {
    if (!body?.messages || !Array.isArray(body.messages)) {
      throw new HTTPException(400, { message: 'Invalid JSON' });
    }

    const stream = await this.aiService.stream(body.messages);
    return createUIMessageStreamResponse({ stream });
  }
}
