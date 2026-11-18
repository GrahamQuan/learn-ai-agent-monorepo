import { config } from 'dotenv';
import { z } from 'zod';

config();

const EnvSchema = z.object({
  // 不同入口使用不同服务，凭证由使用它的入口检查。
  MEM0_API_KEY: z.string().optional(),
  MEM0_LOCAL_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.url().default('https://api.openai.com/v1'),
  MODEL_NAME: z.string().min(1).default('gpt-3.5-turbo'),
  LANGCHAIN_API_KEY: z.string().optional(),
  LANGCHAIN_PROJECT: z.string().min(1).default('default'),
  LANGCHAIN_TRACING_V2: z.enum(['true', 'false']).optional(),
  REDIS_HOST: z.string().min(1).default('localhost'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_DB: z.coerce.number().int().nonnegative().default(0),
  MEMORY_TTL_SECONDS: z.coerce.number().int().positive().default(1800),
  MEMORY_KEY_PREFIX: z.string().min(1).default('agent:short_memory'),
  MEM0_USER_ID: z.string().min(1).default('demo_user_001'),
  MEM0_TOP_K: z.coerce.number().int().positive().default(5),
});

export type ENV = z.infer<typeof EnvSchema>;

const result = EnvSchema.safeParse(process.env);
if (!result.success) {
  console.error('Invalid environment variables:');
  console.error(z.prettifyError(result.error));
  throw new Error('Environment validation failed');
}

export const env = result.data;
