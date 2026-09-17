import type { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: Hono;
  let appModule: AppModule;

  beforeEach(() => {
    appModule = new AppModule();
    app = appModule.app;
  });

  afterEach(async () => {
    await appModule.close();
  });

  it('/ (GET)', async () => {
    const response = await app.request('/');

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Hello World!');
  });
});
