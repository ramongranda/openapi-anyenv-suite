#!/usr/bin/env node
/**
 * Generate the grade HTML report via npx tools and serve it.
 *
 * Usage:
 *   npm run report:npx -- <path/to/openapi.yaml> [--port 8080] [--generate-only|--no-serve]
 *
 * Environment:
 *   SCHEMA_LINT=1  Include Redocly schema lint during grading
 *   GRADE_SOFT=1   Do not fail even with errors (exit 0)
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run report:npx -- <path/to/openapi.yaml> [--port 8080]');
  process.exit(2);
}
const file = args[0];
let port = 8080;
let generateOnly = false;
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--port' && args[i+1]) port = Number.parseInt(args[i+1], 10) || 8080;
  if (args[i] === '--generate-only' || args[i] === '--no-serve') generateOnly = true;
}

mkdirSync('dist', { recursive: true });

function run(cmd, cmdArgs, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: 'inherit', shell: true, ...opts });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

try {
  // 1) Run npx grading to produce dist/grade-report.html
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const gradeNpxScript = path.join(__dirname, 'grade-npx.mjs');
  const serveScript = path.join(__dirname, 'serve.mjs');
  await run(process.execPath, [gradeNpxScript, file]);

  if (!existsSync('dist/grade-report.html')) {
    try {
      const reportPath = 'dist/grade-report.json';
      if (existsSync(reportPath)) {
        const { renderGradeHtml } = await import('./report-html.mjs');
        const report = JSON.parse(readFileSync(reportPath, 'utf8'));
        const html = renderGradeHtml(report, [], []);
        writeFileSync('dist/grade-report.html', html, 'utf8');
      }
    } catch {}
  }
  if (!existsSync('dist/grade-report.html')) {
    console.error('grade-report.html not found in dist/. Did grading fail?');
    process.exit(1);
  }

  if (generateOnly) {
    process.exit(0);
  }
  // 2) Serve dist and print URL to the report
  console.log(`Serving at http://127.0.0.1:${port}/grade-report.html`);
  await run('node', [serveScript, '--dir', 'dist', '--port', String(port)]);
} catch (e) {
  console.error('Report (npx) preview failed:', e.message);
  process.exit(1);
}
