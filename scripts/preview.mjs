#!/usr/bin/env node
/**
 * Build Redocly HTML docs and serve them locally.
 *
 * Usage:
 *   npm run preview -- <path/to/openapi.yaml> [--port 8080]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
  // Inject header with logo
  try {
    const htmlPath = 'dist/index.html';
    let html = readFileSync(htmlPath, 'utf8');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const envLogo = process.env.REPORT_LOGO || process.env.GRADE_LOGO_URL || '';
    let logoUrl = '';
    if (envLogo) {
      if (/^https?:\/\//i.test(envLogo)) logoUrl = envLogo; else {
        const p = path.isAbsolute(envLogo) ? envLogo : path.join(process.cwd(), envLogo);
        if (existsSync(p)) {
          const buf = readFileSync(p);
          const ext = path.extname(p).toLowerCase();
          const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
          logoUrl = `data:${mime};base64,${buf.toString('base64')}`;
        }
      }
    }
    if (!logoUrl) {
      const fallback = path.join(__dirname, '..', 'assets', 'logo-oas.svg');
      if (existsSync(fallback)) {
        const buf = readFileSync(fallback);
        logoUrl = `data:image/svg+xml;base64,${buf.toString('base64')}`;
      }
    }
    if (logoUrl) {
      const header = `\n<div style="display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;border-bottom:1px solid #1f2937;background:#0b1220;position:sticky;top:0;z-index:10">
  <img src="${logoUrl}" alt="OAS" style="width:28px;height:28px;border-radius:9999px;border:1px solid #1f2937"/>
  <span style="font-weight:600;color:#e2e8f0">OpenAPI Any-Env Suite</span>
</div>`;
      html = html.replace(/<body([^>]*)>/i, (m, g1) => `<body${g1}>${header}`);
      writeFileSync(htmlPath, html, 'utf8');
    }
  } catch {}
  console.log(`Serving at http://127.0.0.1:${port}`);
  await run('node', ['scripts/serve.mjs', '--dir', 'dist', '--port', String(port)]);
} catch (e) {
  console.error('Preview failed:', e.message);
  process.exit(1);
}


