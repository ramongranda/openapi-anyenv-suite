#!/usr/bin/env node
/**
 * Bundle an OpenAPI document using Redocly CLI, resolving $ref across files.
 *
 * This script is a thin wrapper around `redocly bundle` that ensures the
 * output directory exists and provides a sensible default output path.
 *
 * Usage:
 *   npm run bundle -- <path/to/openapi.yaml> [--out dist/bundled-openapi.yaml]
 */
import { basename } from 'node:path';
import { run, ensureDir } from './common-utils.mjs';
import { resolveBin } from './utils.mjs';

const rawArgs = process.argv.slice(2);
// Normalize args: ignore lone '--' tokens and prefer the first path-like arg
const args = rawArgs.filter(a => a !== '--');
if (args.length === 0) {
  console.error('Usage: pnpm run bundle -- <path/to/openapi.yaml> [--out dist/bundled-openapi.yaml]');
  process.exit(2);
}

// Pick first argument that looks like a file (ends with .yaml/.yml/.json), fallback to first arg
const fileArg = args.find(a => /\.(ya?ml|json)$/i.test(a)) || args[0];

let outIndex = args.indexOf('--out');
let outFile = null;
if (outIndex !== -1 && args[outIndex + 1]) {
  outFile = args[outIndex + 1];
}
if (outFile) {
  const dir = outFile.replaceAll('\\', '/').split('/').slice(0, -1).join('/');
  if (dir) ensureDir(dir);
} else {
  ensureDir('dist');
  outFile = `dist/bundled-${basename(fileArg)}`;
}

console.log(`Bundling: ${fileArg} -> ${outFile}`);
// Execute redocly bundle; resolveBin may return a node invocation for test stubs.
await run(resolveBin('redocly'), ['bundle', fileArg, '--output', outFile]);

