import { Hono } from 'hono';
import { AppService } from './app.service';

export class AppController {
  readonly routes = new Hono();

  constructor(private readonly appService: AppService) {
    this.routes.get('/', (context) => context.text(this.getHello()));
  }

  getHello(): string {
    return this.appService.getHello();
  }
}
