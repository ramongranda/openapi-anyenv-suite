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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
  try {
    // Force soft mode so report generation never aborts due to errors
    await run(process.execPath, [gradeNpxScript, file], { env: { ...process.env, GRADE_SOFT: '1' } });
  } catch (e) {
    // Continue even if grading exited non-zero; we'll attempt to produce HTML anyway
    console.warn('Grade step (npx) exited non-zero; continuing to generate report.');
    console.error('Error details:', e);
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

  // 1.1) Make report the index (copy)
  try {
    const html = readFileSync('dist/grade-report.html', 'utf8');
    writeFileSync('dist/index.html', html, 'utf8');
  } catch {}

  // 1.2) Build docs (Redocly) and Swagger (non-fatal) using npx
  try {
    await run('npx', ['@redocly/cli@2.7.0', 'build-docs', file, '--output', 'dist/docs.html']);
  } catch (e) {
    console.warn('Docs build (npx) failed:', e?.message || e);
  }
  try {
    await run('npx', ['@redocly/cli@2.7.0', 'bundle', file, '--output', 'dist/openapi-bundle.yaml']);
    const envLogo = process.env.REPORT_LOGO || process.env.GRADE_LOGO_URL || '';
    function computeLogoUrl() {
      if (envLogo) {
        if (/^https?:\/\//i.test(envLogo)) return envLogo;
        try {
          const p = path.isAbsolute(envLogo) ? envLogo : path.join(process.cwd(), envLogo);
          if (existsSync(p)) {
            const buf = readFileSync(p);
            const ext = path.extname(p).toLowerCase();
            const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
            return `data:${mime};base64,${buf.toString('base64')}`;
          }
        } catch {}
      }
      try {
        const fallback = path.join(__dirname, '..', 'assets', 'logo-oas.png');
        if (existsSync(fallback)) {
          const buf = readFileSync(fallback);
          return `data:image/png;base64,${buf.toString('base64')}`;
        }
      } catch {}
      return '';
    }
    const logoUrl = computeLogoUrl();
    const swaggerHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style> body { margin: 0; } .oas-brand{display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;border-bottom:1px solid #1f2937;background:#0b1220;position:sticky;top:0;z-index:10} .oas-brand span{font-weight:600;color:#e2e8f0} .oas-brand img{width:28px;height:28px;border-radius:9999px;border:1px solid #1f2937}</style>
  </head>
  <body>
    <div class="oas-brand">${logoUrl ? `<img src="${logoUrl}" alt="OAS"/>` : ''}<span>OpenAPI Any-Env Suite</span></div>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: 'openapi-bundle.yaml',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
        layout: 'BaseLayout'
      });
    </script>
  </body>
  </html>`;
    writeFileSync('dist/swagger.html', swaggerHtml, 'utf8');
  } catch (e) {
    console.warn('Swagger generation (npx) failed:', e?.message || e);
  }

  if (generateOnly) {
    process.exit(0);
  }
  // 2) Serve dist and print URL to the report (non-fatal)
  console.log(`Serving at http://127.0.0.1:${port}/grade-report.html`);
  try {
    await run('node', [serveScript, '--dir', 'dist', '--port', String(port)]);
  } catch (e) {
    console.warn('Serve failed (npx); you can open dist/grade-report.html manually.');
    console.error('Error details:', e);
    // Finish gracefully in non-serve scenarios
    process.exit(0);
  }
} catch (e) {
  console.error('Report (npx) preview failed:', e.message);
  process.exit(1);
}
