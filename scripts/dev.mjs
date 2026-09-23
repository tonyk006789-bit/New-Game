import { spawn } from 'node:child_process';
const children = ['apps/player/vite.config.ts', 'apps/admin/vite.config.ts'].map(config =>
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', config], { stdio: 'inherit' }));
function stop() { for (const child of children) child.kill(); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const child of children) child.on('exit', code => { if (code) { stop(); process.exitCode = code; } });
