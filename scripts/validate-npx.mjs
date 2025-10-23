#!/usr/bin/env node
/**
 * Validate via npx tools: Redocly bundle, Spectral lint (+ optional Redocly lint).
 *
 * Usage:
 *   npm run validate:npx -- <path/to/openapi.yaml>
 *
 * Environment:
 *   SCHEMA_LINT=1  Include Redocly schema lint after Spectral.
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path, { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run validate:npx -- <path/to/openapi.yaml>');
  process.exit(2);
}
const file = args[0];
const DIST_DIR = 'dist';
mkdirSync(DIST_DIR, { recursive: true });
const bundled = `${DIST_DIR}/bundled-${basename(file)}`;

function run(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: 'inherit', shell: true });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}


try {
  // Calcular ruta absoluta de .spectral.yaml respecto a este script
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const spectralRuleset = path.resolve(__dirname, '..', '.spectral.yaml');

  console.log('Redocly bundle (npx)');
  await run('npx @redocly/cli@2.7.0', ['bundle', file, '--output', bundled]);

  console.log(`Spectral lint (bundle only): ${bundled}`);
  await run('npx @stoplight/spectral-cli@6.15.0', ['lint', bundled, '--ruleset', spectralRuleset, '--fail-severity', 'error']);

  if (process.env.SCHEMA_LINT === '1') {
    console.log('Redocly schema lint (npx)');
    await run('npx @redocly/cli@2.7.0', ['lint', bundled]);
  }

  console.log(`Validation OK. Bundle: ${bundled}`);
} catch (err) {
  console.error('Validation error:', err.message);
  process.exit(1);
}
