import { Hono } from 'hono';
import { AppService } from './app.service';

export class AppController {
  readonly routes = new Hono();

  constructor(private readonly appService: AppService) {
    this.routes.get('/', (c) => c.text(this.getHello()));
    this.routes.get('/health', (c) => c.json({ status: 'ok' }));
  }

  getHello(): string {
    return this.appService.getHello();
  }
}
