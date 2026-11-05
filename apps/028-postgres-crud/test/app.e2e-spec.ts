import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/env', () => ({
  env: { DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test', PORT: 3005 },
}));

import { AppModule } from '../src/app.module';
import { ConversationsService } from '../src/conversations/conversations.service';
import { pool } from '../src/db';

describe('AppController (e2e)', () => {
  let app: AppModule['app'];

  beforeEach(() => {
    vi.restoreAllMocks();
    app = new AppModule().app;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('/ (GET)', async () => {
    const response = await app.request('/');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Hello World!');
  });

  it('preserves user and message routes and serializes dates', async () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const findByUser = vi
      .spyOn(ConversationsService.prototype, 'findConversationsByUserId')
      .mockResolvedValue({ id: 2, name: 'User', createdAt, conversations: [] });
    const findMessages = vi.spyOn(ConversationsService.prototype, 'findMessagesByConversationId').mockResolvedValue({
      id: 3,
      userId: 2,
      title: null,
      createdAt,
      messages: [],
    });
    const users = await app.request('/conversations/users/2');
    expect(users.status).toBe(200);
    expect((await users.json()).createdAt).toBe(createdAt.toISOString());
    expect(findByUser).toHaveBeenCalledWith(2);
    const messages = await app.request('/conversations/3/messages');
    expect(messages.status).toBe(200);
    expect((await messages.json()).messages).toEqual([]);
    expect(findMessages).toHaveBeenCalledWith(3);
  });

  it.each([
    [{ query: 'hello', limit: 3 }, '?limit=7', 3],
    [{ query: 'hello' }, '?limit=7', 7],
    [{ query: 'hello' }, '', 5],
  ])('preserves search limit precedence and POST status', async (body, query, limit) => {
    const search = vi.spyOn(ConversationsService.prototype, 'searchSimilarMessages').mockResolvedValue([]);
    const response = await app.request('/conversations/2/search' + query, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual([]);
    expect(search).toHaveBeenCalledWith(2, 'hello', limit);
  });

  it.each([
    '/conversations/users/nope',
    '/conversations/1.2/messages',
  ])('preserves integer validation: %s', async (path) => {
    const response = await app.request(path);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: 'Validation failed (numeric string is expected)',
      error: 'Bad Request',
      statusCode: 400,
    });
  });

  it('validates query limit even when the body provides one', async () => {
    const response = await app.request('/conversations/2/search?limit=bad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'hello', limit: 3 }),
    });
    expect(response.status).toBe(400);
  });
});
