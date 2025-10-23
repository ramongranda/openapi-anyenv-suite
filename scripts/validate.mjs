#!/usr/bin/env node
/**
 * Validate an OpenAPI document: bundle then lint with Spectral (+ optional Redocly).
 *
 * Steps:
 * 1) Bundle the spec using Redocly (resolves $ref across files).
 * 2) Run Spectral against the bundle using the local `.spectral.yaml` ruleset.
 * 3) Optionally run Redocly schema lint when `SCHEMA_LINT=1`.
 *
 * This script throws (exit 1) on any validation failures to be usable in CI.
 *
 * Usage:
 *   npm run validate -- <path/to/openapi.yaml>
 *
 * Environment:
 *   SCHEMA_LINT=1  Include Redocly schema lint after Spectral.
 */
import { basename, dirname } from 'node:path';
import { resolveBin } from './utils.mjs';
import { run, ensureDir, resolvePath } from './common-utils.mjs';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: pnpm run validate -- <path/to/openapi.yaml>');
  process.exit(2);
}
const file = args[0];
const DIST_DIR = 'dist';
ensureDir(DIST_DIR);
const bundled = `${DIST_DIR}/bundled-${basename(file)}`;

try {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const spectralRuleset = resolvePath(__dirname, '../.spectral.yaml');

  // Bundle: resolve and write a single artifact that Spectral can analyze.
  console.log('Redocly bundle');
  await run(resolveBin('redocly'), ['bundle', file, '--output', bundled]);

  // Spectral lint: fail the process on severity 'error' so CI can catch issues.
  console.log(`Spectral lint (bundle only): ${bundled}`);
  await run(resolveBin('spectral'), ['lint', bundled, '--ruleset', spectralRuleset, '--fail-severity', 'error']);

  // Optional schema-level lint using Redocly (more strict, slower).
  if (process.env.SCHEMA_LINT === '1') {
    console.log('Redocly schema lint');
    await run(resolveBin('redocly'), ['lint', bundled]);
  }

  console.log(`Validation OK. Bundle: ${bundled}`);
} catch (err) {
  console.error('Validation error:', err.message);
  process.exit(1);
}


