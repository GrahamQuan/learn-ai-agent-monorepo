import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

export class AppModule {
  readonly app = new Hono().basePath('/api');
  readonly appController: AppController;
  readonly aiModule: AiModule;

  constructor() {
    const appService = new AppService();
    this.appController = new AppController(appService);
    this.aiModule = new AiModule();

    this.app.use('*', cors({ origin: '*', credentials: true }));
    this.app.route('/', this.appController.routes);
    this.app.route('/ai', this.aiModule.aiController.routes);
  }
}
