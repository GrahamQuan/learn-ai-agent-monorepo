import { config } from "dotenv";
import { z } from "zod";

config();

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_BASE_URL: z.url().default("https://dashscope.aliyuncs.com/compatible-mode/v1"),
  MODEL_NAME: z.string().min(1).default("qwen-plus"),
  EMBEDDING_MODEL: z.string().min(1).default("text-embedding-v3"),
  MILVUS_URI: z.url().default("http://localhost:19530"),
  MILVUS_COLLECTION: z.string().min(1).default("rag_docs"),
  LANGCHAIN_API_KEY: z.string().min(1),
  LANGCHAIN_PROJECT: z.string().min(1).default("default"),
  LANGCHAIN_TRACING_V2: z.enum(["true", "false"]).optional(),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
  let message = "Missing or invalid values in .env:\n";
  for (const issue of result.error.issues) {
    message += `${String(issue.path[0])}: ${issue.message}\n`;
  }
  const error = new Error(message);
  error.stack = "";
  throw error;
}

export type ENV = z.infer<typeof EnvSchema>;
export const env: ENV = result.data;
