import type { AIMessageChunk, BaseMessage, MessageContent } from '@langchain/core/messages';
import { HumanMessage, ToolMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableBranch, RunnableLambda, RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import chalk from 'chalk';
import { env } from '../env';
import { model } from '../model';

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    'amap-maps-streamableHTTP': {
      url: 'https://mcp.amap.com/mcp?key=' + env.AMAP_MCP_KEY,
    },
    'chrome-devtools': {
      command: 'npx',
      args: ['-y', 'chrome-devtools-mcp@latest'],
    },
  },
});

const tools = await mcpClient.getTools();
const modelWithTools = model.bindTools(tools);

const prompt = ChatPromptTemplate.fromMessages([
  ['system', '你是一个可以调用 MCP 工具的智能助手。'],
  new MessagesPlaceholder('messages'),
]);

const llmChain = prompt.pipe(modelWithTools);

// 1. 定义处理工具调用的逻辑 (封装为 Runnable)
const toolExecutor = new RunnableLambda<{ response: AIMessageChunk; tools: DynamicStructuredTool[] }, ToolMessage[]>({
  func: async (input: { response: AIMessageChunk; tools: DynamicStructuredTool[] }) => {
    const { response, tools } = input;
    const toolResults: ToolMessage[] = [];

    for (const toolCall of response.tool_calls ?? []) {
      const foundTool = tools.find((t: DynamicStructuredTool) => t.name === toolCall.name);
      if (!foundTool) continue;

      const toolResult = await foundTool.invoke(toolCall.args);

      // 兼容不同返回格式的字符串化
      const contentStr = typeof toolResult === 'string' ? toolResult : toolResult?.text || JSON.stringify(toolResult);

      toolResults.push(
        new ToolMessage({
          content: contentStr,
          tool_call_id: toolCall.id as string,
        }),
      );
    }

    return toolResults;
  },
});

// 2. 对结果的处理
const agentStepChain = RunnableSequence.from([
  // step1: 将 LLM 输出挂到 state.response 上
  RunnablePassthrough.assign({
    response: llmChain,
  }),
  // step2: 使用 RunnableBranch 根据是否有 tool_calls 走不同分支
  RunnableBranch.from([
    // 分支1：没有 tool_calls，认为本轮已经完成
    [
      (state: {
        messages: BaseMessage[];
        response: AIMessageChunk;
        done: boolean;
        final: MessageContent | null;
        tools: DynamicStructuredTool[];
      }) => !state.response?.tool_calls || state.response.tool_calls.length === 0,
      new RunnableLambda<
        {
          messages: BaseMessage[];
          response: AIMessageChunk;
          done: boolean;
          final: MessageContent | null;
          tools: DynamicStructuredTool[];
        },
        {
          messages: BaseMessage[];
          response: AIMessageChunk;
          done: boolean;
          final: MessageContent | null;
          tools: DynamicStructuredTool[];
        }
      >({
        func: async (state: {
          messages: BaseMessage[];
          response: AIMessageChunk;
          done: boolean;
          final: MessageContent | null;
          tools: DynamicStructuredTool[];
        }) => {
          const { messages, response } = state;
          const newMessages = [...messages, response];
          return {
            ...state,
            messages: newMessages,
            done: true,
            final: response.content,
          };
        },
      }),
    ],
    // 默认分支：有 tool_calls，调用工具并把 ToolMessage 写回 messages
    RunnableSequence.from([
      new RunnableLambda<
        {
          messages: BaseMessage[];
          response: AIMessageChunk;
          done: boolean;
          final: MessageContent | null;
          tools: DynamicStructuredTool[];
        },
        {
          messages: BaseMessage[];
          response: AIMessageChunk;
          done: boolean;
          final: MessageContent | null;
          tools: DynamicStructuredTool[];
        }
      >({
        func: async (state: {
          messages: BaseMessage[];
          response: AIMessageChunk;
          done: boolean;
          final: MessageContent | null;
          tools: DynamicStructuredTool[];
        }) => {
          const { messages, response } = state;
          const newMessages = [...messages, response];

          console.log(chalk.bgBlue(`🔍 检测到 ${response.tool_calls!.length} 个工具调用`));
          console.log(chalk.bgBlue(`🔍 工具调用: ${response.tool_calls!.map((t) => t.name).join(', ')}`));

          return {
            ...state,
            messages: newMessages,
          };
        },
      }),
      // 调用工具执行器，得到 toolMessages
      RunnablePassthrough.assign({
        toolMessages: toolExecutor,
      }),
      new RunnableLambda<
        {
          messages: BaseMessage[];
          response: AIMessageChunk;
          done: boolean;
          final: MessageContent | null;
          tools: DynamicStructuredTool[];
          toolMessages: ToolMessage[];
        },
        {
          messages: BaseMessage[];
          response: AIMessageChunk;
          done: boolean;
          final: MessageContent | null;
          tools: DynamicStructuredTool[];
          toolMessages: ToolMessage[];
        }
      >({
        func: async (state: {
          messages: BaseMessage[];
          response: AIMessageChunk;
          done: boolean;
          final: MessageContent | null;
          tools: DynamicStructuredTool[];
          toolMessages: ToolMessage[];
        }) => {
          const { messages, toolMessages } = state;
          return {
            ...state,
            messages: [...messages, ...(toolMessages ?? [])],
            done: false,
          };
        },
      }),
    ]),
  ]),
]);

async function runAgentWithTools(query: string, maxIterations = 30) {
  let state: {
    messages: BaseMessage[];
    done: boolean;
    final: MessageContent | null;
    tools: DynamicStructuredTool[];
    response?: AIMessageChunk;
    toolMessages?: ToolMessage[];
  } = {
    messages: [new HumanMessage(query)],
    done: false,
    final: null,
    tools,
  };

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen(`⏳ 正在等待 AI 思考...`));

    // 每一轮都通过一个完整的 Runnable chain（LLM + 工具调用处理）
    state = await agentStepChain.invoke(state);

    if (state.done) {
      console.log(`\n✨ AI 最终回复:\n${state.final}\n`);
      return state.final;
    }
  }

  return state.messages[state.messages.length - 1]?.content || '';
}

await runAgentWithTools(
  '北京南站附近的酒店，最近的 3 个酒店，拿到酒店图片，打开浏览器，展示每个酒店的图片，每个 tab 一个 url 展示，并且在把那个页面标题改为酒店名',
);

// await mcpClient.close();
