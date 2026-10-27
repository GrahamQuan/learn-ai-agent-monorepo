import { env } from "./env.js";
import type { Document } from "@langchain/core/documents";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Milvus } from "@langchain/community/vectorstores/milvus";

const embeddings = new OpenAIEmbeddings({
  apiKey: env.OPENAI_API_KEY,
  configuration: { baseURL: env.OPENAI_BASE_URL },
  model: env.EMBEDDING_MODEL,
});

const llm = new ChatOpenAI({
  apiKey: env.OPENAI_API_KEY,
  configuration: { baseURL: env.OPENAI_BASE_URL },
  model: env.MODEL_NAME,
  temperature: 0,
});

const vectorStore = await Milvus.fromExistingCollection(embeddings, {
  collectionName: env.MILVUS_COLLECTION,
  url: env.MILVUS_URI,
});

const retriever = vectorStore.asRetriever({ k: 4 });

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "你是客服助手。仅根据下面「上下文」回答；上下文没有的信息请明确说不知道，不要编造。\n\n上下文：\n{context}",
  ],
  ["human", "{question}"],
]);

const chain = RunnableSequence.from([prompt, llm, new StringOutputParser()]);

const GraphState = Annotation.Root({
  question: Annotation<string>,
  context: Annotation<Document[]>,
  answer: Annotation<string>,
});

async function retrieve(state: typeof GraphState.State) {
  const docs = await retriever.invoke(state.question);
  return { context: docs };
}

async function generate(state: typeof GraphState.State) {
  const contextText = state.context.map((d) => d.pageContent).join("\n\n");
  const answer = await chain.invoke({
    context: contextText,
    question: state.question,
  });
  return { answer };
}

const workflow = new StateGraph(GraphState)
  .addNode("retrieve", retrieve)
  .addNode("generate", generate)
  .addEdge(START, "retrieve")
  .addEdge("retrieve", "generate")
  .addEdge("generate", END);

export const ragApp = workflow.compile();

export async function ask(question: string) {
  const result = await ragApp.invoke({ question });
  return {
    answer: result.answer,
    context: result.context ?? [],
  };
}
