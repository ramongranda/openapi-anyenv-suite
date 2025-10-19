#!/usr/bin/env node
/**
 * Build Redocly HTML docs via npx and serve them locally.
 *
 * Usage:
 *   npm run preview:npx -- <path/to/openapi.yaml> [--port 8080]
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run preview:npx -- <path/to/openapi.yaml> [--port 8080]');
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
  console.log('Building docs (HTML) via npx...');
  await run('npx', ['@redocly/cli@2.7.0', 'build-docs', file, '--output', 'dist/index.html']);
  console.log(`Serving at http://127.0.0.1:${port}`);
  await run('node', ['scripts/serve.mjs', '--dir', 'dist', '--port', String(port)]);
} catch (e) {
  console.error('Preview (npx) failed:', e.message);
  process.exit(1);
}
