import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import readline from 'node:readline/promises';
import { awaitAllCallbacks } from '@langchain/core/callbacks/promises';
import type { AIMessage, BaseMessage, ToolMessage } from '@langchain/core/messages';
import { HumanMessage } from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';
import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain';
import { Client } from 'langsmith';

import { createIntelligenceDeskAgent, projectDir } from './agent.js';
import { env } from './env.js';

const recursionLimit = env.RECURSION_LIMIT;
const runId = randomUUID();
const traceClient = env.LANGCHAIN_TRACING_V2 === 'true' ? new Client({ timeout_ms: 15_000 }) : undefined;
const tracer = traceClient ? new LangChainTracer({ client: traceClient }) : undefined;
let runStarted = false;

const FILE_TOOLS = new Set(['write_file', 'edit_file', 'read_file', 'ls', 'glob', 'grep']);

const EVAL_TOOL = 'eval';
const PREVIEW_LEN = 100;
const RESULT_PREVIEW_LEN = 120;

function printBanner() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║              深度调研助手              ║');
  console.log('╚══════════════════════════════════════════╝\n');
}

async function readQuery() {
  const fromArgs = process.argv.slice(2).join(' ').trim();
  if (fromArgs) return fromArgs;

  const rl = readline.createInterface({ input, output });
  try {
    return (await rl.question('请输入调研主题: ')).trim();
  } finally {
    rl.close();
  }
}

function stepLabel(namespace: string[], node: string) {
  if (namespace.length === 0) return `[主 Agent] ${node}`;
  const id = namespace[0]?.replace(/^tools:/, 'subagent:') ?? namespace[0];
  return `[${id}] ${node}`;
}

function displayPath(p: string) {
  return p.startsWith('/workspace/') ? p.slice(1) : p.replace(/^\/+/, '');
}

function pathFromArgs(name: string, args: ReturnType<typeof parseArgs>) {
  if (!args || typeof args !== 'object') return null;
  if (name === 'write_file' || name === 'edit_file' || name === 'read_file') {
    return typeof args.file_path === 'string' ? args.file_path : null;
  }
  if (name === 'ls') return typeof args.path === 'string' ? args.path : null;
  if (name === 'glob' || name === 'grep') {
    const dir = typeof args.path === 'string' ? args.path : '/';
    const pattern = typeof args.pattern === 'string' ? args.pattern : '';
    return pattern ? `${pattern} @ ${dir}` : dir;
  }
  return null;
}

function parseArgs(args: unknown): Record<string, unknown> | string | null | undefined {
  if (typeof args === 'string') {
    try {
      return JSON.parse(args);
    } catch {
      return args;
    }
  }
  return args as Record<string, unknown> | null | undefined;
}

function previewText(text: unknown, maxLen: number) {
  const oneLine = String(text).replace(/\s+/g, ' ').trim();
  if (!oneLine) return '(empty)';
  return oneLine.length <= maxLen ? oneLine : `${oneLine.slice(0, maxLen - 1)}…`;
}

function trackEvalCalls(
  data: { messages?: (BaseMessage & Partial<Pick<AIMessage, 'tool_calls'>>)[] },
  pendingEval: Map<string, string>,
) {
  for (const msg of data?.messages ?? []) {
    for (const tc of msg.tool_calls ?? []) {
      if (!tc.id || tc.name !== EVAL_TOOL) continue;
      const args = parseArgs(tc.args);
      const code = args && typeof args === 'object' && typeof args.code === 'string' ? args.code : '';
      pendingEval.set(tc.id, code);
      console.log(`  🧮 eval: ${previewText(code, PREVIEW_LEN)}`);
    }
  }
}

function trackFileCalls(
  data: Parameters<typeof trackEvalCalls>[0],
  pending: Map<string, { name: string; path: string }>,
) {
  for (const msg of data?.messages ?? []) {
    for (const tc of msg.tool_calls ?? []) {
      if (!tc.id || !tc.name || !FILE_TOOLS.has(tc.name)) continue;
      const p = pathFromArgs(tc.name, parseArgs(tc.args));
      if (p) pending.set(tc.id, { name: tc.name, path: p });
    }
  }
}

function logToolResults(
  data: { messages?: (BaseMessage & Partial<Pick<ToolMessage, 'tool_call_id'>>)[] },
  pending: Map<string, { name: string; path: string }>,
  pendingEval: Map<string, string>,
) {
  for (const msg of data?.messages ?? []) {
    if (msg.type !== 'tool') continue;

    if (msg.name === 'task') {
      const preview = String(msg.content).slice(0, 120).replace(/\n/g, ' ');
      console.log(`  task done: ${preview}...`);
      continue;
    }

    if (msg.name === EVAL_TOOL) {
      console.log(`  🧮 eval → ${previewText(msg.content, RESULT_PREVIEW_LEN)}`);
      if (msg.tool_call_id) pendingEval.delete(msg.tool_call_id);
      continue;
    }

    if (!msg.name || !FILE_TOOLS.has(msg.name)) continue;

    const op = msg.tool_call_id ? pending.get(msg.tool_call_id) : undefined;
    const filePath = op?.path ?? String(msg.content).match(/['`](\/[^'`]+)['`]/)?.[1] ?? null;

    console.log(filePath ? `  ${msg.name}: ${displayPath(filePath)}` : `  ${msg.name}`);
    if (msg.tool_call_id) pending.delete(msg.tool_call_id);
  }
}

async function run(query: string) {
  console.log(`query: ${query}`);
  console.log(`recursionLimit: ${recursionLimit}\n`);
  console.log('─'.repeat(50));

  const agent = createIntelligenceDeskAgent();
  const pending = new Map<string, { name: string; path: string }>();
  const pendingEval = new Map<string, string>();

  console.log(tracer ? `LangSmith: ${tracer.projectName} · run ${runId}` : 'LangSmith: 未启用追踪');
  runStarted = true;
  const traceConfig: RunnableConfig = {
    runId,
    runName: 'deep-research-assistant',
    callbacks: tracer ? [tracer] : undefined,
  };

  for await (const [namespace, chunk] of await agent.stream(
    { messages: [new HumanMessage(query)] },
    {
      streamMode: 'updates',
      subgraphs: true,
      recursionLimit,
      ...traceConfig,
    },
  )) {
    for (const [node, data] of Object.entries(chunk)) {
      if (node === 'model_request') {
        trackFileCalls(data, pending);
        trackEvalCalls(data, pendingEval);
        console.log(stepLabel(namespace, node));
      } else if (node === 'tools') {
        logToolResults(data, pending, pendingEval);
      } else if (node === 'todoListMiddleware.after_model') {
        console.log(stepLabel(namespace, node));
      }
    }
  }

  console.log('─'.repeat(50));
}

function listMd(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(dir, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
}

function printOutputs() {
  const sources = listMd(path.join(projectDir, 'workspace/sources'));
  const reports = listMd(path.join(projectDir, 'workspace/reports'));

  if (sources.length) {
    console.log('\n sources:');
    for (const f of sources.slice(0, 8)) {
      console.log(`   ${path.relative(projectDir, f)}`);
    }
  }
  if (reports.length) {
    console.log('\n reports:');
    for (const f of reports.slice(0, 5)) {
      console.log(`   ${path.relative(projectDir, f)}`);
    }
  }
}

async function main() {
  printBanner();

  if (!env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY — copy .env.example to .env');
    process.exitCode = 1;
    return;
  }

  const query = await readQuery();
  if (!query) {
    console.error('请提供调研主题');
    process.exitCode = 1;
    return;
  }

  try {
    await run(query);
    printOutputs();
    console.log('\n✅ done');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Recursion limit')) {
      console.error(`\n❌ recursion limit (${recursionLimit}) — set RECURSION_LIMIT in .env`);
    } else {
      console.error('\n❌', err);
    }
    printOutputs();
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (!traceClient || !runStarted) return;
    try {
      await awaitAllCallbacks();
      await traceClient.awaitPendingTraceBatches();
      const trace = await traceClient.readRun(runId);
      console.log(`\nLangSmith trace: ${await traceClient.getRunUrl({ run: trace })}`);
    } catch {
      console.warn(`\n未能确认 LangSmith 上报，请检查网络、密钥和项目权限。Run ID: ${runId}`);
    }
  });

/*
prompt:
调研国家统计局公开的2023年省级地区生产总值（GDP）数据：提取GDP总量前6名省份的具体数值及同比增速，计算六省GDP总和、各省占全国GDP的比重，并按增速从高到低排名
*/
