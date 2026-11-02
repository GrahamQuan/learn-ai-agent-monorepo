import { config } from 'dotenv';
import { z } from 'zod';

config();

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_BASE_URL: z.url().optional(),
  MODEL_NAME: z.string().min(1).optional(),
  LANGCHAIN_API_KEY: z.string().optional(),
  LANGCHAIN_PROJECT: z.string().optional(),
  LANGCHAIN_TRACING_V2: z.enum(['true', 'false']).optional(),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
  const message = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
  const error = new Error(`Invalid environment variables in .env:\n${message}`);
  error.stack = '';
  throw error;
}

export type ENV = z.infer<typeof EnvSchema>;
export const env = result.data;
