import { config } from 'dotenv';
import { ZodError, z } from 'zod';

config();

const EnvSchema = z.object({
  AUDIO_SECRET_ID: z.string(),
  AUDIO_SECRET_KEY: z.string(),
  AUDIO_APP_ID: z.coerce.number(),
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
