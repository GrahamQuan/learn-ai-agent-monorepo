import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';
import { ZodError, z } from 'zod';

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env');
config({ path: envPath });

const EnvSchema = z.object({
  AI_SDK_KEY: z.string(),
  AI_SDK_BASE_URL: z.url(),
  MODEL_NAME: z.string(),
  EMBEDDINGS_MODEL_NAME: z.string(),
  // 用于身份验证，实现链路上报
  LANGCHAIN_API_KEY: z.string().optional(),
  // 指定 LangSmith 中的项目，追踪结果会归类到该项目下
  LANGCHAIN_PROJECT: z.string().optional(),
  // 设置为 true 时开启 LangSmith 追踪功能
  LANGCHAIN_TRACING_V2: z.enum(['true', 'false']).optional(),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('127.0.0.1'),
});

export type EnvSchema = z.infer<typeof EnvSchema>;

try {
  EnvSchema.parse(process.env);
} catch (error: unknown) {
  if (error instanceof ZodError) {
    let message = 'Missing required values in .env:\n';
    for (const issue of error.issues) {
      message += `${String(issue.path[0])}: ${issue.message}\n`;
    }
    const e = new Error(message);
    e.stack = '';
    throw e;
  }
  console.error({ error });
}

export type ENV = z.infer<typeof EnvSchema>;
export const env: ENV = EnvSchema.parse(process.env);
