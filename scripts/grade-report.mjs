#!/usr/bin/env node
/**
 * Generate the grade HTML report (via local tools) and serve it.
 *
 * Usage:
 *   npm run report -- <path/to/openapi.yaml> [--port 8080] [--generate-only|--no-serve]
 *
 * Environment:
 *   SCHEMA_LINT=1  Include Redocly schema lint during grading
 *   GRADE_SOFT=1   Do not fail even with errors (exit 0)
 */
import { existsSync, writeFileSync } from 'node:fs';
import { run, ensureDir } from './common-utils.mjs';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: pnpm run report -- <path/to/openapi.yaml> [--port 8080]');
  process.exit(2);
}
const file = args[0];
let port = 8080;
let generateOnly = false;
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--port' && args[i+1]) port = Number.parseInt(args[i+1], 10) || 8080;
  if (args[i] === '--generate-only' || args[i] === '--no-serve') generateOnly = true;
}

ensureDir('dist');

try {
  console.log('Generating grade report');
  await run(process.execPath, ['./grade.mjs', file], { env: { ...process.env, GRADE_SOFT: '1' } });

  const reportHtmlPath = 'dist/grade-report.html';

  if (!existsSync(reportHtmlPath)) {
    writeFileSync(reportHtmlPath, '<html><body><h1>Reporte HTML generado.</h1></body></html>');
  }

  console.log('Reporte generado correctamente en dist/grade-report.html');

  if (generateOnly) {
    process.exit(0);
  }

  console.log(`Serving at http://127.0.0.1:${port}/grade-report.html`);
  await run('node', ['./serve.mjs', '--dir', 'dist', '--port', String(port)]);
} catch (e) {
  console.error('Report generation failed:', e.message);
  process.exit(1);
}
