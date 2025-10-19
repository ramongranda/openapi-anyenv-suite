#!/usr/bin/env node
/**
 * Bundle an OpenAPI document via npx and serve Swagger UI against it.
 *
 * Usage:
 *   npm run swagger:npx -- <path/to/openapi.yaml> [--port 8080]
 */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run swagger:npx -- <path/to/openapi.yaml> [--port 8080]');
  process.exit(2);
}
const file = args[0];
let port = 8080;
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--port' && args[i+1]) port = Number.parseInt(args[i+1], 10) || 8080;
}

mkdirSync('dist', { recursive: true });
const bundled = 'dist/openapi-bundle.yaml';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
    const fallback = path.join(__dirname, '..', 'assets', 'logo-oas.svg');
    if (existsSync(fallback)) {
      const buf = readFileSync(fallback);
      return `data:image/svg+xml;base64,${buf.toString('base64')}`;
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

function run(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: 'inherit', shell: true });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

try {
  console.log('Redocly bundle (npx)');
  await run('npx', ['@redocly/cli@2.7.0', 'bundle', file, '--output', bundled]);

  writeFileSync('dist/swagger.html', swaggerHtml, 'utf8');
  console.log(`Serving Swagger UI at http://127.0.0.1:${port}/swagger.html`);
  await run('node', ['scripts/serve.mjs', '--dir', 'dist', '--port', String(port)]);
} catch (e) {
  console.error('Swagger (npx) preview failed:', e.message);
  process.exit(1);
}
