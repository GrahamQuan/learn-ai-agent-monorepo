import { describe, expect, it } from 'vitest';
import { app } from '../src/backend/main';

describe('AppController (e2e)', () => {
  it('/api (GET)', async () => {
    const response = await app.request('/api');

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Hello World!');
  });

  it('/api/ai/chat (POST) rejects an invalid body', async () => {
    const response = await app.request('/api/ai/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Invalid JSON');
  });
});
