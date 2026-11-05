import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConversationsModule } from './conversations/conversations.module';
import { db } from './db';

export class AppModule {
  readonly app = new Hono();
  constructor(em: typeof db = db) {
    const appController = new AppController(new AppService());
    const conversationsModule = new ConversationsModule(em);
    this.app.route('/', appController.routes);
    this.app.route('/conversations', conversationsModule.controller.routes);
    this.app.notFound((c) =>
      c.json(
        {
          message: `Cannot ${c.req.method} ${c.req.path}`,
          error: 'Not Found',
          statusCode: 404,
        },
        404,
      ),
    );
    this.app.onError((error, c) => {
      if (error instanceof HTTPException) {
        return c.json(
          {
            message: error.message,
            error: error.status === 404 ? 'Not Found' : 'Bad Request',
            statusCode: error.status,
          },
          error.status,
        );
      }
      console.error(error);
      return c.json({ statusCode: 500, message: 'Internal server error' }, 500);
    });
  }
}
