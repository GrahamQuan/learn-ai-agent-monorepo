import { config } from 'dotenv';
import { z } from 'zod';

config();

const EnvSchema = z.object({
  DATABASE_URL: z.url().refine((value) => /^postgres(ql)?:\/\//.test(value), {
    message: 'Expected a PostgreSQL connection URL',
  }),
  PORT: z.coerce.number().int().min(0).max(65535).default(3005),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.url().optional(),
  EMBEDDING_MODEL: z.preprocess((value) => value || 'text-embedding-v3', z.string()),
});

export type ENV = z.infer<typeof EnvSchema>;

const result = EnvSchema.safeParse(process.env);
if (!result.success) {
  console.error('Invalid environment variables:');
  console.error(z.prettifyError(result.error));
  throw new Error('Environment validation failed');
}

export const env = result.data;
