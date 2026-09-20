import { config } from 'dotenv';
import { z } from 'zod';

config();

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_BASE_URL: z.url().default('https://dashscope.aliyuncs.com/compatible-mode/v1'),
  LLM_MODEL_NAME: z.string().min(1).default('qwen-turbo'),
  NEO4J_URL: z.url().default('bolt://localhost:7687'),
  NEO4J_USERNAME: z.string().min(1).default('neo4j'),
  NEO4J_PASSWORD: z.string().min(1).default('12345678'),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
  let message = 'Missing or invalid values in .env:\n';
  for (const issue of result.error.issues) {
    message += `${String(issue.path[0])}: ${issue.message}\n`;
  }
  const error = new Error(message);
  error.stack = '';
  throw error;
}

export type ENV = z.infer<typeof EnvSchema>;
export const env: ENV = result.data;
