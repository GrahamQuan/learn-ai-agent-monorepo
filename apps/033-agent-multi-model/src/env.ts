import { config } from 'dotenv';
import { z } from 'zod';

config();

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_BASE_URL: z.url().optional(),
  OSS_ACCESS_KEY_ID: z.string().min(1),
  OSS_ACCESS_KEY_SECRET: z.string().min(1),
});

export type ENV = z.infer<typeof EnvSchema>;

// 按实际使用的字段校验，模型示例与 OSS 示例无需配置彼此的凭据。
function readEnv<K extends keyof ENV>(key: K): ENV[K] {
  const result = EnvSchema.shape[key].safeParse(process.env[key]);
  if (!result.success) {
    const error = new Error(
      `Invalid value in .env:\n${key}: ${result.error.issues.map((issue) => issue.message).join(', ')}`,
    );
    error.stack = '';
    throw error;
  }
  return result.data as ENV[K];
}

export const env = {
  get OPENAI_API_KEY() {
    return readEnv('OPENAI_API_KEY');
  },
  get OPENAI_BASE_URL() {
    return readEnv('OPENAI_BASE_URL');
  },
  get OSS_ACCESS_KEY_ID() {
    return readEnv('OSS_ACCESS_KEY_ID');
  },
  get OSS_ACCESS_KEY_SECRET() {
    return readEnv('OSS_ACCESS_KEY_SECRET');
  },
};
