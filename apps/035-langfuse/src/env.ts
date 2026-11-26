import { config } from 'dotenv';
import { ZodError, z } from 'zod';

config();

const EnvSchema = z.object({
  LANGFUSE_PUBLIC_KEY: z.string().min(1),
  LANGFUSE_SECRET_KEY: z.string().min(1),
  LANGFUSE_BASE_URL: z.url().optional(),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_BASE_URL: z.url().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  LANGCHAIN_CALLBACKS_BACKGROUND: z.enum(['true', 'false']).optional(),
  LANGFUSE_DATASET_NAME: z.string().default('deepagents-eval'),
});

export type ENV = z.infer<typeof EnvSchema>;

export const env = (() => {
  try {
    return EnvSchema.parse(process.env);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      let message = 'Missing or invalid values in .env:\n';
      for (const issue of error.issues) {
        message += `${String(issue.path[0])}: ${issue.message}\n`;
      }
      const validationError = new Error(message);
      validationError.stack = '';
      throw validationError;
    }
    throw error;
  }
})();

// OpenAI / LangChain SDK 仍直接读取 dotenv 已加载的环境变量；保留其自动配置行为。
