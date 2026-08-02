import { describe, expect, it } from 'vitest';
import type { AiServiceLike } from '../src/ai/ai.service';
import { createApp } from '../src/app';

const fakeAiService: AiServiceLike = {
  runChain: async (query) => `answer: ${query}`,
  streamChain: async function* (query) {
    yield 'answer: ';
    yield query;
  },
};

const app = createApp({ getAiService: async () => fakeAiService });

describe('Hono app', () => {
  it('keeps the Nest root response', async () => {
    const response = await app.request('/');

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('Hello World!');
  });

  it('returns the in-memory books', async () => {
    const response = await app.request('/book');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { id: 1, title: 'Book 1' },
      { id: 2, title: 'Book 2' },
      { id: 3, title: 'Book 3' },
    ]);
  });

  it('serves the SSE test page', async () => {
    const response = await app.request('/sse-test.html');

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('SSE 流式接口测试');
  });

  it('runs the chat endpoint', async () => {
    const response = await app.request('/ai/chat?query=LangChain');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ answer: 'answer: LangChain' });
  });

  it('validates the chat query', async () => {
    const response = await app.request('/ai/chat');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'query is required' });
  });

  it('streams the chat response and finishes with a done event', async () => {
    const response = await app.request('/ai/chat/stream?query=LangChain', {
      headers: { Origin: 'http://127.0.0.1:3000' },
    });
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(body).toContain('data: answer:');
    expect(body).toContain('data: LangChain');
    expect(body).toContain('event: done');
  });
});
