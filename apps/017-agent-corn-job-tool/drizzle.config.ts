import { defineConfig } from 'drizzle-kit';
import { env } from './src/env';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for Drizzle Kit');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/*.schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
