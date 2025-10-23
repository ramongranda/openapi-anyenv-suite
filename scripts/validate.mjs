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

const rawArgs = process.argv.slice(2);
function stripQuotes(s) {
  if (!s) return s;
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
  return s;
}
const cleaned = rawArgs.map(a => stripQuotes(a));
const split = cleaned.flatMap(a => (/\s/.test(a) ? a.split(/\s+/) : [a]));
const pieces = split.map(p => stripQuotes(p).trim()).filter(Boolean);
const args = pieces.filter(a => a !== '--');
if (args.length === 0) {
  console.error('Usage: pnpm run validate -- <path/to/openapi.yaml>');
  process.exit(2);
}
const file = args.find(a => /\.(ya?ml|json)$/i.test(a)) || args[0];
const DIST_DIR = 'dist';
ensureDir(DIST_DIR);
// Ensure bundled filename uses .json extension to be uniform across tools
const baseName = (() => {
  const p = basename(file).replace(/\.[^./]+$/, '');
  return p;
})();
const bundled = `${DIST_DIR}/bundled-${baseName}.json`;

try {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const spectralRuleset = resolvePath(__dirname, '../.spectral.yaml');

  // Bundle: resolve and write a single artifact that Spectral can analyze.
  console.log('Redocly bundle');
  await run(resolveBin('redocly'), ['bundle', file, '--output', bundled]);

  // Normalize produced bundle into a canonical dist/bundled.json so downstream
  // steps (grade, tests) can rely on a fixed path regardless of redocly's
  // output naming or extension.
  try {
    const { existsSync, copyFileSync, readFileSync, writeFileSync } = await import('node:fs');
    if (existsSync(bundled)) {
      if (/\.json$/i.test(bundled)) {
        copyFileSync(bundled, `${DIST_DIR}/bundled.json`);
      } else {
        // Try parse as YAML or JSON and write normalized JSON
        const content = readFileSync(bundled, 'utf8');
        try {
          const parsed = JSON.parse(content);
          writeFileSync(`${DIST_DIR}/bundled.json`, JSON.stringify(parsed, null, 2), 'utf8');
        } catch (je) {
          try {
            const yaml = (await import('yaml')).default;
            const parsed = yaml.parse(content);
            writeFileSync(`${DIST_DIR}/bundled.json`, JSON.stringify(parsed, null, 2), 'utf8');
          } catch (ye) {
            // Fallback: copy as-is
            copyFileSync(bundled, `${DIST_DIR}/bundled.json`);
          }
        }
      }
    }
  } catch (normErr) {
    console.error('[validate.mjs] Could not normalize bundle to dist/bundled.json:', normErr?.message ?? normErr);
  }

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


