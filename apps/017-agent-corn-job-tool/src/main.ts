import { serve } from '@hono/node-server';
import { AppModule } from './app.module';
import { env } from './env';

async function bootstrap() {
  const appModule = new AppModule();
  await appModule.onApplicationBootstrap();

  const server = serve(
    {
      fetch: appModule.app.fetch,
      hostname: env.HOST,
      port: env.PORT,
    },
    (info) => console.log(`Hono API listening on http://${env.HOST}:${info.port}`),
  );

  async function shutdown() {
    server.close();
    await appModule.close();
    process.exit(0);
  }

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

void bootstrap();
