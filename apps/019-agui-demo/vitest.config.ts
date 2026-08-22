import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    env: {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/agui_demo',
      OPENAI_API_KEY: 'test-openai-key',
      OPENAI_BASE_URL: 'https://example.com/v1',
      MODEL_NAME: 'test-model',
      BOCHA_API_KEY: 'test-bocha-key',
      MAIL_HOST: 'smtp.example.com',
      MAIL_PORT: '587',
      MAIL_SECURE: 'false',
      MAIL_USER: 'user@example.com',
      MAIL_PASS: 'test-password',
      MAIL_FROM: 'No Reply <user@example.com>',
    },
  },
});
