import { Hono } from 'hono';
import type { AppService } from './app.service';

export class AppController {
  readonly routes = new Hono();

  constructor(private readonly appService: AppService) {
    this.routes.get('/', (c) => c.text(this.getHello()));
  }

  getHello(): string {
    return this.appService.getHello();
  }
}
