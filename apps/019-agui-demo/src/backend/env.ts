import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.url(),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_BASE_URL: z.url(),
  MODEL_NAME: z.string().min(1),
  BOCHA_API_KEY: z.string().min(1),
  MAIL_HOST: z.string().min(1),
  MAIL_PORT: z.coerce.number().int().positive(),
  MAIL_SECURE: z.stringbool(),
  MAIL_USER: z.string().min(1),
  MAIL_PASS: z.string().min(1),
  MAIL_FROM: z.string().min(1),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment variables:');
  console.error(z.prettifyError(result.error));
  throw new Error('Environment validation failed');
}

export type ENV = z.infer<typeof EnvSchema>;
export const env: ENV = result.data;
