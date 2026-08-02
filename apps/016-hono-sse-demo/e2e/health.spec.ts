import { expect, test } from '@playwright/test';

test('e2e health test', async ({ request }) => {
  const response = await request.get('http://127.0.0.1:3000/health');

  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toEqual({ status: 'ok' });
});
