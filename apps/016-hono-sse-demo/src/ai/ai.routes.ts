import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { AiServiceLike } from './ai.service';

export type GetAiService = () => Promise<AiServiceLike>;

const getDefaultAiService: GetAiService = async () => {
  const [{ AiService }, { model }] = await Promise.all([import('./ai.service'), import('../model')]);

  return new AiService(model);
};

function readQuery(query: string | undefined): string | undefined {
  const normalizedQuery = query?.trim();
  return normalizedQuery ? normalizedQuery : undefined;
}

export function createAiRoutes(getAiService = getDefaultAiService) {
  const routes = new Hono();
  let servicePromise: Promise<AiServiceLike> | undefined;
  const resolveService = () => {
    servicePromise ??= getAiService();
    return servicePromise;
  };

  routes.get('/chat', async (c) => {
    const query = readQuery(c.req.query('query'));

    if (!query) {
      return c.json({ error: 'query is required' }, 400);
    }

    const service = await resolveService();
    const answer = await service.runChain(query);
    return c.json({ answer });
  });

  routes.get('/chat/stream', (c) => {
    const query = readQuery(c.req.query('query'));

    if (!query) {
      return c.json({ error: 'query is required' }, 400);
    }

    return streamSSE(c, async (stream) => {
      const service = await resolveService();

      for await (const chunk of service.streamChain(query)) {
        await stream.writeSSE({ data: chunk });
      }

      await stream.writeSSE({ event: 'done', data: 'done' });
    });
  });

  return routes;
}
