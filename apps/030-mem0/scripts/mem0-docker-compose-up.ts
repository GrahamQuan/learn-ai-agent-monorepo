import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const server = new URL('../../../../mem0/server/', import.meta.url);

if (!existsSync(new URL('.env', server))) {
  console.error('缺少 mem0/server/.env，请先运行 pnpm --filter 030-mem0 setup:mem0。');
  process.exitCode = 1;
} else {
  const result = spawnSync('docker', ['compose', '-f', 'docker-compose.yaml', 'up', '-d', '--build'], {
    cwd: server,
    stdio: 'inherit',
  });
  if (result.error) console.error(result.error.message);
  process.exitCode = result.status ?? 1;
}
