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
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run report -- <path/to/openapi.yaml> [--port 8080]');
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
  // 1) Run local grading to produce dist/grade-report.html
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const gradeScript = path.join(__dirname, 'grade.mjs');
  const serveScript = path.join(__dirname, 'serve.mjs');
  try {
    // Force soft mode so report generation never aborts due to errors
    await run(process.execPath, [gradeScript, file], { env: { ...process.env, GRADE_SOFT: '1' } });
  } catch (e) {
    // Continue even if grading exited non-zero; we'll attempt to produce HTML anyway
    console.warn('Grade step exited non-zero; continuing to generate report.');
    console.error('Grading error:', e);
  }

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
  // 2) Serve dist and print URL to the report (non-fatal)
  console.log(`Serving at http://127.0.0.1:${port}/grade-report.html`);
  try {
    await run('node', [serveScript, '--dir', 'dist', '--port', String(port)]);
  } catch (e) {
    console.error('Serve failed:', e.message);
    console.warn('You can open dist/grade-report.html manually.');
    process.exit(1);
  }
} catch (e) {
  console.error('Report preview failed:', e.message);
  process.exit(1);
}
