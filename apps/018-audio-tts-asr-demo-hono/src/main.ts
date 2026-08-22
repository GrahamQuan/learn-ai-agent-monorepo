import { serve } from '@hono/node-server';
import { createServer, type Server } from 'node:http';
import { WebSocketServer } from 'ws';
import { AppModule } from './app.module';
import { env } from './env';

async function bootstrap() {
  const appModule = new AppModule();
  const ttsRelayService = appModule.speechModule.ttsRelayService;
  const server = serve(
    {
      fetch: appModule.app.fetch,
      createServer,
      hostname: env.HOST,
      port: env.PORT,
    },
    (info) => console.log(`Hono API listening on http://${env.HOST}:${info.port}`),
  ) as Server;

  const ttsWss = new WebSocketServer({
    server,
    path: '/speech/tts/ws',
  });

  ttsWss.on('connection', (socket, request) => {
    const reqUrl = new URL(request.url ?? '', 'http://localhost');
    const wantedSessionId = reqUrl.searchParams.get('sessionId') ?? undefined;
    const sessionId = ttsRelayService.registerClient(socket, wantedSessionId);

    socket.on('close', () => {
      ttsRelayService.unregisterClient(sessionId);
    });
  });

  async function shutdown() {
    ttsWss.close();
    appModule.close();
    server.close();
  }

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

void bootstrap();
