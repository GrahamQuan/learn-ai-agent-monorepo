import { spawnSync } from 'node:child_process';

const server = new URL('../../../../mem0/server/', import.meta.url);
const result = spawnSync('docker', ['compose', '-f', 'docker-compose.yaml', 'down'], {
  cwd: server,
  stdio: 'inherit',
});

if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
