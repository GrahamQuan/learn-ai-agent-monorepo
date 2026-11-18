import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const page = new URL('../public/index.html', import.meta.url);
await access(page);

const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer.exe' : 'xdg-open';
const target = process.platform === 'win32' ? fileURLToPath(page) : page.href;

// 检查文件与打开命令，不实际启动浏览器。
if (process.argv.includes('--dry-run')) {
  console.log(command, target);
} else {
  const child = spawn(command, [target], { stdio: 'inherit' });
  child.on('error', (error) => {
    console.error(`无法打开浏览器：${error.message}`);
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => {
    if (code !== 0) {
      console.error(`打开浏览器失败：${signal ?? code}`);
      process.exitCode = 1;
    }
  });
}
