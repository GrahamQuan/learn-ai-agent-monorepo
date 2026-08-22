import type { EventEmitter } from 'node:events';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { AI_TTS_STREAM_EVENT, type AiTtsStreamEvent } from '../common/stream-events';
import { AiService } from './ai.service';

export class AiController {
  readonly routes = new Hono();

  constructor(
    private readonly aiService: AiService,
    private readonly eventEmitter: EventEmitter,
  ) {
    this.routes.get('/chat/stream', (c) => {
      const query = c.req.query('query') ?? '';
      const ttsSessionId = c.req.query('ttsSessionId');
      return streamSSE(c, async (stream) => {
        for await (const event of this.chatStream(query, ttsSessionId)) {
          await stream.writeSSE(event);
        }
      });
    });
  }

  async *chatStream(
    query: string,
    ttsSessionId?: string,
  ): AsyncGenerator<{ data: string }> {
    const sessionId = ttsSessionId?.trim();
    if (sessionId) {
      const startEvent: AiTtsStreamEvent = { type: 'start', sessionId, query };
      this.eventEmitter.emit(AI_TTS_STREAM_EVENT, startEvent);
    }

    for await (const chunk of this.aiService.streamChain(query, sessionId)) {
      yield { data: chunk };
    }
  }
}
