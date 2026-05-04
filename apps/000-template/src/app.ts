import { Hono } from 'hono';

export const app = new Hono();

app.get('/', (c) =>
  c.json({
    name: 'learn-ai-agent',
    message: 'AI agent learning roadmap coming soon.',
  }),
);

app.get('/health', (c) =>
  c.json({
    status: 'ok',
  }),
);

export type AppType = typeof app;
