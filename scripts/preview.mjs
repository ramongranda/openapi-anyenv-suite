#!/usr/bin/env node
/**
 * Build Redocly HTML docs and serve them locally.
 *
 * Usage:
 *   npm run preview -- <path/to/openapi.yaml> [--port 8080]
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolveBin } from './utils.mjs';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run preview -- <path/to/openapi.yaml> [--port 8080]');
  process.exit(2);
}
const file = args[0];
let port = 8080;
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--port' && args[i+1]) port = parseInt(args[i+1], 10) || 8080;
}
mkdirSync('dist', { recursive: true });

function run(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: 'inherit', shell: true });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

try {
  console.log('Building docs (HTML)...');
  await run(resolveBin('redocly'), ['build-docs', file, '--output', 'dist/index.html']);
  console.log(`Serving at http://127.0.0.1:${port}`);
  await run('node', ['scripts/serve.mjs', '--dir', 'dist', '--port', String(port)]);
} catch (e) {
  console.error('Preview failed:', e.message);
  process.exit(1);
}


