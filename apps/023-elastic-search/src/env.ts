import { config } from 'dotenv';
import { ZodError, z } from 'zod';

config();

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_BASE_URL: z.url().default('https://dashscope.aliyuncs.com/compatible-mode/v1'),
  LLM_MODEL_NAME: z.string().min(1).default('qwen-turbo'),
  EMBEDDINGS_MODEL_NAME: z.string().min(1).default('text-embedding-v3'),
  RERANK_MODEL: z.string().min(1).default('qwen3-rerank'),
  RERANK_URL: z.url().default('https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank'),
});

export type EnvSchema = z.infer<typeof EnvSchema>;

try {
  EnvSchema.parse(process.env);
} catch (error: unknown) {
  if (error instanceof ZodError) {
    let message = 'Missing or invalid values in .env:\n';
    for (const issue of error.issues) {
      message += `${String(issue.path[0])}: ${issue.message}\n`;
    }
    const e = new Error(message);
    e.stack = '';
    throw e;
  }
  throw error;
}

export type ENV = z.infer<typeof EnvSchema>;
export const env: ENV = EnvSchema.parse(process.env);
