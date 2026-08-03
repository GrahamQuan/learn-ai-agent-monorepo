import { config } from 'dotenv';
import { z } from 'zod';

config();

const EnvSchema = z.object({
  AI_SDK_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_SDK_BASE_URL: z.url().optional(),
  OPENAI_BASE_URL: z.url().optional(),
  MODEL_NAME: z.string(),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('127.0.0.1'),
  DATABASE_URL: z.string().min(1),
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().default(587),
  MAIL_SECURE: z.stringbool().default(false),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  BOCHA_API_KEY: z.string().optional(),
});

export type ENV = z.infer<typeof EnvSchema>;
export const env: ENV = EnvSchema.parse(process.env);

export const openAiConfig = {
  apiKey: env.OPENAI_API_KEY ?? env.AI_SDK_KEY,
  baseURL: env.OPENAI_BASE_URL ?? env.AI_SDK_BASE_URL,
};
