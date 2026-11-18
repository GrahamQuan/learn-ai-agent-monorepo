import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const repo = fileURLToPath(new URL('../../../../mem0', import.meta.url));
const upstream = 'https://github.com/mem0ai/mem0.git';
const endpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const server = resolve(repo, 'server');

function read(file: string) {
  return readFileSync(resolve(server, file), 'utf8');
}

function replaceLine(content: string, before: string, after: string) {
  const lines = content.split(/\r?\n/);
  if (lines.includes(after)) return content;
  const index = lines.indexOf(before);
  if (index < 0) throw new Error(`Dockerfile 与预期不同，找不到 ${before}`);
  lines[index] = after;
  return lines.join(content.includes('\r\n') ? '\r\n' : '\n');
}

function configureEnv() {
  const existing = existsSync(resolve(server, '.env'));
  let content = read(existing ? '.env' : '.env.example');
  const env = parseEnv(content);
  const appEnvFile = new URL('../.env', import.meta.url);
  const appEnv = existsSync(appEnvFile) ? parseEnv(readFileSync(appEnvFile, 'utf8')) : {};
  if (appEnv.OPENAI_API_KEY && appEnv.OPENAI_BASE_URL && appEnv.OPENAI_BASE_URL.replace(/\/$/, '') !== endpoint) {
    throw new Error('apps/030-mem0/.env 的 OPENAI_BASE_URL 与 Mem0 的 DashScope 端点不一致，请核对密钥所属服务。');
  }
  if (!appEnv.OPENAI_API_KEY && env.OPENAI_API_KEY && env.OPENAI_BASE_URL !== endpoint) {
    throw new Error('已有 OPENAI_API_KEY 使用其他端点。请先在 server/.env 中配置 DashScope 的密钥和 OPENAI_BASE_URL，再运行脚本。');
  }
  const settings = {
    OPENAI_API_KEY: appEnv.OPENAI_API_KEY || env.OPENAI_API_KEY || process.env.DASHSCOPE_API_KEY || '',
    OPENAI_BASE_URL: endpoint,
    POSTGRES_PASSWORD: env.POSTGRES_PASSWORD || randomBytes(24).toString('hex'),
    JWT_SECRET: env.JWT_SECRET || randomBytes(32).toString('hex'),
    AUTH_DISABLED: 'true',
    MEM0_DEFAULT_LLM_MODEL: 'qwen-plus',
    MEM0_DEFAULT_EMBEDDER_MODEL: 'text-embedding-v2', // 固定输出 1536 维，与 pgvector 列一致。
  };
  for (const [key, value] of Object.entries(settings)) {
    if (env[key] === value) continue;
    if (/[\r\n]/.test(value)) throw new Error(`${key} 必须是单行值`);
    const pattern = new RegExp(`^(?:export[ \\t]+)?${key}[ \\t]*=.*$`, 'gm');
    const line = `${key}=${value}`;
    content = pattern.test(content)
      ? content.replace(pattern, () => line)
      : content.trimEnd() + '\n' + line + '\n';
  }
  return content;
}

function setup() {
  if (!existsSync(repo)) execFileSync('git', ['clone', upstream, repo], { stdio: 'inherit' });
  const root = execFileSync('git', ['-C', repo, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  if (resolve(root) !== resolve(repo)) throw new Error(`${repo} 不是独立的 Git 仓库`);

  const manifest = JSON.parse(read('dashboard/package.json'));
  manifest.packageManager = 'pnpm@10.5.2';
  manifest.pnpm ??= {};
  manifest.pnpm.onlyBuiltDependencies = [...new Set([
    ...(manifest.pnpm.onlyBuiltDependencies ?? []), 'sharp', 'unrs-resolver',
  ])];

  const files = {
    'dev.Dockerfile': replaceLine(read('dev.Dockerfile'), 'RUN pip install -e .[graph]', 'RUN pip install -e .'),
    'dashboard/Dockerfile': replaceLine(read('dashboard/Dockerfile'), 'FROM node:20-alpine AS base', 'FROM node:22-alpine AS base'),
    'dashboard/package.json': JSON.stringify(manifest, null, 2) + '\n',
    '.env': configureEnv(),
  };
  for (const [file, content] of Object.entries(files)) {
    const path = resolve(server, file);
    if (!existsSync(path) || read(file) !== content) writeFileSync(path, content, { mode: 0o600 });
  }
  console.log(`Mem0 已配置：${server}`);
  if (!parseEnv(files['.env']).OPENAI_API_KEY) console.log('请在 apps/030-mem0/.env 中填写 OPENAI_API_KEY，再运行 setup:mem0。');
}

try {
  setup();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
