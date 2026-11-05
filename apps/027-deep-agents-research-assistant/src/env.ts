import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { z } from 'zod';

config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().trim().min(1),
  OPENAI_BASE_URL: z.union([z.url(), z.literal('')]).optional(),
  OPENAI_MODEL: z.string().optional(),
  BOCHA_API_KEY: z.string().trim().optional(),
  RECURSION_LIMIT: z.preprocess((value) => Number(value) || 300, z.number()),
  LANGCHAIN_API_KEY: z.string().optional(),
  LANGCHAIN_PROJECT: z.string().optional(),
  LANGCHAIN_TRACING_V2: z.enum(['true', 'false']).optional(),
});

export type ENV = z.infer<typeof EnvSchema>;

const result = EnvSchema.safeParse(process.env);
if (!result.success) {
  const error = new Error(
    `Invalid environment configuration (.env):\n${result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n')}`,
  );
  error.stack = '';
  throw error;
}

export const env = result.data;

// 主 Agent 原有的默认值；演示入口仍使用 SDK 自身的默认配置。
export const researchModel = env.OPENAI_MODEL?.trim() || 'gpt-4o';
export const researchBaseURL = env.OPENAI_BASE_URL?.trim() || undefined;
