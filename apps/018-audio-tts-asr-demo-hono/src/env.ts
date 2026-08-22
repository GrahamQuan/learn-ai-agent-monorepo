import { config } from 'dotenv';
import { z } from 'zod';

config();

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string(),
  OPENAI_BASE_URL: z.url(),
  MODEL_NAME: z.string(),
  SECRET_ID: z.string(),
  SECRET_KEY: z.string(),
  APP_ID: z.coerce.number(),
  TTS_VOICE_TYPE: z.coerce.number().default(502006),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('127.0.0.1'),
});

export type ENV = z.infer<typeof EnvSchema>;
export const env: ENV = EnvSchema.parse(process.env);
