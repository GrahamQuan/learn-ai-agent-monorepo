import { serve } from '@hono/node-server';
import { app } from './app';
import { env } from './env';

const port = env.PORT;
const hostname = env.HOST;

serve(
  {
    fetch: app.fetch,
    hostname,
    port,
  },
  (info) => {
    console.log(`Hono API listening on http://${hostname}:${info.port}`);
  },
);
