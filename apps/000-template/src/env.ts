import { config } from "dotenv";
import { ZodError, z } from "zod";

config();

const EnvSchema = z.object({
  AI_SDK_KEY: z.string(),
  AI_SDK_BASE_URL: z.url(),
  MODEL_NAME: z.string(),
});

export type EnvSchema = z.infer<typeof EnvSchema>;

try {
  EnvSchema.parse(process.env);
} catch (error: unknown) {
  if (error instanceof ZodError) {
    let message = "Missing required values in .env:\n";
    for (const issue of error.issues) {
      message += `${String(issue.path[0])}: ${issue.message}\n`;
    }
    const e = new Error(message);
    e.stack = "";
    throw e;
  }
  console.error({ error });
}

export type ENV = z.infer<typeof EnvSchema>;
export const env = EnvSchema.parse(process.env);
