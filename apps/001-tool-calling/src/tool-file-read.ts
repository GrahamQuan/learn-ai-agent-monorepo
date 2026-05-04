import fs from 'node:fs/promises';
import { BaseMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { env } from './env';

const model = new ChatOpenAI({
  modelName: env.MODEL_NAME,
  apiKey: env.AI_SDK_KEY,
  temperature: 0, // 0 for deterministic output
  configuration: {
    baseURL: env.AI_SDK_BASE_URL,
  },
});

const readFileTool = tool(
  async ({ filePath }) => {
    const content = await fs.readFile(filePath, 'utf-8');
    console.log(`  [工具调用] read_file("${filePath}") - 成功读取 ${content.length} 字节`);
    return `文件内容:\n${content}`;
  },
  {
    name: 'read_file',
    description:
      '用此工具来读取文件内容。当用户要求读取文件、查看代码、分析文件内容时，调用此工具。输入文件路径（可以是相对路径或绝对路径）。',
    schema: z.object({
      filePath: z.string().describe('要读取的文件路径'),
    }),
  },
);

const tools = [readFileTool];

const modelWithTools = model.bindTools(tools);
const systemMessage = new SystemMessage(`
  你是一个代码助手，可以使用工具读取文件并解释代码。

  工作流程：
  1. 用户要求读取文件时，立即调用 read_file 工具
  2. 等待工具返回文件内容
  3. 基于文件内容进行分析和解释
  
  可用工具：
  - read_file: 读取文件内容（使用此工具来获取文件内容）
`);

const humanMessage = new HumanMessage('请读取 src/tool-file-read.ts 文件内容并解释代码');

/* 
  messages 可以是 SystemMessage、HumanMessage、AIMessage、ToolMessage
  
  SystemMessage：设置 AI 是谁，可以干什么，有什么能力，以及一些回答、行为的规范等
  HumanMessage：用户输入的信息
  AIMessage：AI 的回复信息
  ToolMessage：调用工具的结果返回
*/
const messages: BaseMessage[] = [systemMessage, humanMessage];

let response = await modelWithTools.invoke(messages);

// 检查 response 返回值
// console.log(response);
/* 
AIMessage {
  "id": "chatcmpl-b38246ae-8cae-9413-8a62-f63626b711ff",
  "content": "好的，请稍等，我将读取 `src/tool-file-read.ts` 文件的内容并为您解释代码。",
  "additional_kwargs": {
    "tool_calls": [
      {
        "function": "[Object]",
        "id": "call_d48c3618b5c8440eafdc43",
        "index": 0,
        "type": "function"
      }
    ]
  },
  "response_metadata": {
    "tokenUsage": {
      "promptTokens": 343,
      "completionTokens": 44,
      "totalTokens": 387
    },
    "finish_reason": "tool_calls",
    "model_provider": "openai",
    "model_name": "qwen-coder-turbo"
  },
  "tool_calls": [
    {
      "name": "read_file",
      "args": {
        "filePath": "src/tool-file-read.ts"
      },
      "type": "tool_call",
      "id": "call_d48c3618b5c8440eafdc43"
    }
  ],
  "invalid_tool_calls": [],
  "usage_metadata": {
    "output_tokens": 44,
    "input_tokens": 343,
    "total_tokens": 387,
    "input_token_details": {},
    "output_token_details": {}
  }
}
*/

// 聊天记录
messages.push(response);

// 如果 response 返回值有 tool_calls，则继续调用工具
while (response.tool_calls && response.tool_calls.length > 0) {
  console.log(`\n[检测到 ${response.tool_calls.length} 个工具调用]`);

  // 执行所有工具调用
  const toolResults: string[] = await Promise.all(
    response.tool_calls.map(async (toolCall) => {
      const tool = tools.find((t) => t.name === toolCall.name); // 查找工具
      if (!tool) {
        return `错误: 找不到工具 ${toolCall.name}`;
      }

      console.log(`  [执行工具] ${toolCall.name}(${JSON.stringify(toolCall.args)})`);
      try {
        const result = await tool.invoke(toolCall); // 调用工具
        return typeof result === 'string' ? result : JSON.stringify(result);
      } catch (error) {
        return `错误: ${error instanceof Error ? error.message : String(error)}`;
      }
    }),
  );

  // 将工具结果添加到消息历史
  response.tool_calls.forEach((toolCall, index) => {
    if (!toolCall.id) return;

    messages.push(
      new ToolMessage({
        content: toolResults[index],
        tool_call_id: toolCall.id,
      }),
    );
  });

  // 再次调用模型，传入工具结果
  response = await modelWithTools.invoke(messages);
}

console.log('\n[最终回复]');
console.log(response.content);
