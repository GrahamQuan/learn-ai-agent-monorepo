import { serve } from '@hono/node-server';
import { AppModule } from './app.module';
import { env } from './env';

async function bootstrap(): Promise<void> {
  const { app } = new AppModule();
  serve({ fetch: app.fetch, port: env.PORT }, ({ port }) => {
    console.log(`running on port ${port}`);
  });
}
bootstrap();
