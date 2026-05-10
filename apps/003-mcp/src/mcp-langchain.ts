import { BaseMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { ChatOpenAI } from '@langchain/openai';
import chalk from 'chalk';
import { env } from './env';
import { tryCatch } from './utils/try-catch';

const model = new ChatOpenAI({
  modelName: env.MODEL_NAME,
  apiKey: env.AI_SDK_KEY,
  configuration: {
    baseURL: env.AI_SDK_BASE_URL,
  },
});

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    'my-mcp-server': {
      command: 'bun',
      args: ['/Users/a6677/Documents/personal-projects/learn-ai-agent-monorepo/apps/003-mcp/src/mcp-demo-server.ts'],
    },
  },
});

const tools = await mcpClient.getTools();
const modelWithTools = model.bindTools(tools);

let resourceContent = '';

async function runAgentWithTools(query: string, maxIterations = 30) {
  const messages: BaseMessage[] = [new SystemMessage(resourceContent), new HumanMessage(query)];

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen(`⏳ 正在等待 AI 思考...`));
    const [error, response] = await tryCatch(modelWithTools.invoke(messages));
    if (error) {
      console.error(`\n❌ 错误: ${error.message}\n `);
      return error.message;
    }
    messages.push(response);

    // 检查是否有工具调用
    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log(`\n✨ AI 最终回复:\n${response.content}\n`);
      return response.content;
    }

    console.log(chalk.bgBlue(`🔍 检测到 ${response.tool_calls.length} 个工具调用`));
    console.log(chalk.bgBlue(`🔍 工具调用: ${response.tool_calls.map((t) => t.name).join(', ')}`));
    // 执行工具调用
    for (const toolCall of response.tool_calls) {
      const foundTool = tools.find((t) => t.name === toolCall.name);
      if (foundTool) {
        const toolResult = await foundTool.invoke(toolCall.args);
        messages.push(
          new ToolMessage({
            content: toolResult,
            tool_call_id: toolCall.id!,
          }),
        );
      }
    }
  }

  return messages[messages.length - 1]?.content;
}

/* =============================== */

// 检查用户信息
async function _checkUserInfo() {
  await runAgentWithTools('查一下用户 002 的信息');
}

// 检查静态内容
async function checkStaticContent() {
  // 1. 添加静态内容
  const res = await mcpClient.listResources();
  for (const [serverName, resources] of Object.entries(res)) {
    for (const resource of resources) {
      const content = await mcpClient.readResource(serverName, resource.uri);
      resourceContent += content[0]?.text || '';
    }
  }
  // 2. 运行 Agent
  await runAgentWithTools('MCP Server 的使用指南是什么');
}

async function main() {
  try {
    // await checkUserInfo();
    await checkStaticContent();
  } finally {
    await mcpClient.close();
  }
}

main();
