import { serve } from '@hono/node-server';
import { app } from './app';
import { env } from './env';

serve(
  {
    fetch: app.fetch,
    hostname: env.HOST,
    port: env.PORT,
  },
  (info) => {
    console.log(`Hono API listening on http://${env.HOST}:${info.port}`);
  },
);
