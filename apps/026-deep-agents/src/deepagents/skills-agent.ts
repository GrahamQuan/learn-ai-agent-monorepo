import { existsSync, mkdirSync } from 'node:fs';
import { ChatOpenAI } from '@langchain/openai';
import type { SkillMetadata } from 'deepagents';
import { createFilesystemMiddleware, createSkillsMiddleware, LocalShellBackend } from 'deepagents';
import type { AIMessageChunk } from 'langchain';
import { createAgent, HumanMessage } from 'langchain';
import { env } from '../env.js';

const skills = '/.agents/skills/';
const output = 'src/deepagents/output/deepagents-skills-flow.excalidraw';

if (!existsSync('.agents/skills/excalidraw-diagram-generator/SKILL.md')) {
  throw new Error(
    '未找到 excalidraw-diagram-generator，请先: npx skills add github/awesome-copilot --skill excalidraw-diagram-generator -y',
  );
}

mkdirSync('src/deepagents/output', { recursive: true });

const model = new ChatOpenAI({
  model: env.MODEL_NAME,
  apiKey: env.OPENAI_API_KEY,
  configuration: { baseURL: env.OPENAI_BASE_URL },
  temperature: 0,
  streaming: true,
});

const backend = await LocalShellBackend.create({
  rootDir: '.',
  virtualMode: true,
  inheritEnv: true,
});

const agent = createAgent({
  model,
  tools: [],
  systemPrompt: '按 skills 库完成任务，需要时 read_file 对应 SKILL.md。中文回答。',
  middleware: [createSkillsMiddleware({ backend, sources: [skills] }), createFilesystemMiddleware({ backend })],
});

const prompt = [
  '画一张流程图，描述本项目的 skills-agent 工作流：',
  '用户 Prompt → createAgent → createSkillsMiddleware → createFilesystemMiddleware → 模型回复。',
  `保存为 ${output}。要求：`,
  '- 顶部大标题 + 副标题',
  '- 每个主节点 numbered（①②…）且框内 2～3 行中文说明',
  '- 右侧一列「说明：…」补充细节',
  '- 箭头上标注阶段名（如 invoke、wrapModelCall）',
  '- 底部图例（颜色含义 + 如何运行 demo）',
].join('\n');

console.log('用户:', prompt);

function chunkText(chunk: AIMessageChunk | undefined): string {
  if (!chunk?.content) return '';
  if (typeof chunk.content === 'string') return chunk.content;
  if (Array.isArray(chunk.content)) {
    return chunk.content.map((p) => (typeof p === 'string' ? p : ((p as { text?: string })?.text ?? ''))).join('');
  }
  return '';
}

const stream = await agent.streamEvents({ messages: [new HumanMessage(prompt)] }, { recursionLimit: 100 });

let skillsMetadata: SkillMetadata[] | undefined;
console.log('\n--- 流式输出 ---\n');

try {
  for await (const event of stream) {
    if (event.event === 'on_chat_model_stream') {
      const text = chunkText(event.data?.chunk);
      if (text) process.stdout.write(text);
    }
    if (event.event === 'on_tool_start') {
      const name = event.name?.split('/').pop() ?? event.name;
      process.stdout.write(`\n\n→ ${name}\n\n`);
    }
    if (event.event === 'on_chain_end' && event.data?.output?.skillsMetadata) {
      skillsMetadata = event.data.output.skillsMetadata;
    }
  }
} catch (e) {
  console.error('\n\n[错误]', (e as Error & { cause?: Error }).cause?.message ?? (e as Error).message);
  throw e;
}

console.log('\n');
console.log(
  'skills:',
  skillsMetadata?.map((s) => s.name),
);
if (existsSync(output)) {
  console.log('图表:', output);
  console.log('打开: https://excalidraw.com → Open → 选择该文件');
} else {
  console.log('未生成:', output);
}

await backend.close();
