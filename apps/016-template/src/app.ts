import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createAiRoutes, type GetAiService } from './ai/ai.routes';
import { createBookRoutes } from './book/book.routes';

export type AppOptions = {
  getAiService?: GetAiService;
};

export function createApp(options: AppOptions = {}) {
  const app = new Hono();
  const publicDirectory = relative(process.cwd(), fileURLToPath(new URL('../public', import.meta.url)));

  app.use('*', cors());
  app.use('/sse-test.html', serveStatic({ root: publicDirectory }));

  app.get('/', (c) => c.text('Hello World!'));
  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.route('/book', createBookRoutes());
  app.route('/ai', createAiRoutes(options.getAiService));

  return app;
}

export const app = createApp();
export type AppType = typeof app;
