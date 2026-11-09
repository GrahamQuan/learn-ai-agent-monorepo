import { config } from 'dotenv';
import { z } from 'zod';

config();

const EnvSchema = z.object({
  OPENAI_BASE_URL: z.url().optional(),
  MODEL_NAME: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  LANGCHAIN_API_KEY: z.string().optional(),
  LANGCHAIN_PROJECT: z.string().optional(),
  LANGCHAIN_TRACING_V2: z.enum(['true', 'false']).optional(),
  REDIS_URL: z.url().regex(/^rediss?:\/\//, 'Use a redis:// or rediss:// connection URL'),
  MEMORY_TTL_SECONDS: z.coerce.number().int().positive().default(1800),
  MEMORY_KEY_PREFIX: z.string().default('agent:short_memory'),
  MEMORY_SESSION_ID: z.string().default('demo_user_001'),
});

const result = EnvSchema.safeParse(process.env);
if (!result.success) {
  const message = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  const error = new Error(`Invalid environment values in .env:\n${message}`);
  error.stack = '';
  throw error;
}

export type ENV = z.infer<typeof EnvSchema>;
export const env = result.data;
