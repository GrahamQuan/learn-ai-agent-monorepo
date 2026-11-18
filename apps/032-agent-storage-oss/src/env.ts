import { config } from 'dotenv';
import { z } from 'zod';

config();

const EnvSchema = z.object({
  oss: z.object({
    OSS_REGION: z.string().optional(),
    OSS_ACCESS_KEY_ID: z.string().min(1),
    OSS_ACCESS_KEY_SECRET: z.string().min(1),
    OSS_BUCKET: z.string().optional(),
  }),
  minio: z.object({
    MINIO_ACCESS_KEY: z.string().min(1),
    MINIO_SECRET_KEY: z.string().min(1),
  }),
  s3: z.object({
    S3_ENDPOINT: z.url().optional(),
    // 保留源示例配置；当前上传脚本未使用独立端口变量。
    S3_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
  }),
});

function parseEnv<T extends z.ZodType>(schema: T): z.output<T> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const message = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
    const error = new Error(`Invalid environment values in .env:\n${message}`);
    error.stack = '';
    throw error;
  }
  return result.data;
}

export type ENV = z.infer<typeof EnvSchema>;

// 仅在入口访问对应服务时校验，避免要求其他服务的凭据。
export const env: ENV = {
  get oss() {
    return parseEnv(EnvSchema.shape.oss);
  },
  get minio() {
    return parseEnv(EnvSchema.shape.minio);
  },
  get s3() {
    return parseEnv(EnvSchema.shape.s3);
  },
};
