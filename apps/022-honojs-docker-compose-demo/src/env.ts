import { config } from 'dotenv';
import { z } from 'zod';

config();

const EnvSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment variables:');
  console.error(z.prettifyError(result.error));
  throw new Error('Environment validation failed');
}

export const env = result.data;
