import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

describe('AppController (e2e)', () => {
  const app = new Hono();
  const appController = new AppController(new AppService());
  app.route('/', appController.routes);

  it('/ (GET)', async () => {
    const response = await app.request('/');

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Hello World!');
  });
});
