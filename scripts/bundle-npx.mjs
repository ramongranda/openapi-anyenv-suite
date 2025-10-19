#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { basename } from 'node:path';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run bundle:npx -- <path/to/openapi.yaml> [--out dist/bundled-openapi.yaml]');
  process.exit(2);
}
const file = args[0];

let outIndex = args.indexOf('--out');
let outFile = null;
if (outIndex !== -1 && args[outIndex + 1]) {
  outFile = args[outIndex + 1];
}
if (outFile) {
  const dir = outFile.replaceAll('\\', '/').split('/').slice(0, -1).join('/');
  if (dir) mkdirSync(dir, { recursive: true });
} else {
  mkdirSync('dist', { recursive: true });
  outFile = `dist/bundled-${basename(file)}`;
}

console.log(`Bundling: ${file} -> ${outFile}`);
const p = spawn('npx @redocly/cli@2.7.0', ['bundle', file, '--output', outFile], { stdio: 'inherit', shell: true });
p.on('close', (code) => process.exit(code || 0));
