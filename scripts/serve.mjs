/**
 * Tiny static file server used by preview/swagger commands.
 *
 * Usage:
 *   node scripts/serve.mjs --dir dist --port 8080
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { spawn } from 'node:child_process';

function parseArgs() {
  const args = process.argv.slice(2);
  let dir = 'dist';
  let port = 8080;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && args[i+1]) dir = args[i+1];
    if (args[i] === '--port' && args[i+1]) port = Number.parseInt(args[i+1], 10) || 8080;
  }
  return { dir, port };
}

const { dir, port } = parseArgs();
const REBUILD_ENABLE = process.env.REBUILD_ENABLE === '1';
const REBUILD_SPEC = process.env.REBUILD_SPEC || '';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url);
  if (REBUILD_ENABLE && parsedUrl.pathname === '/__rebuild') {
    // Trigger regeneration of report + docs + swagger
    try {
      // parse JSON body to get redocly toggle
      let body = '';
      await new Promise((resolve) => { req.on('data', chunk => body += chunk); req.on('end', resolve); });
      let redocly = false;
      try { const j = JSON.parse(body || '{}'); redocly = !!j.redocly; } catch {}
      const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
      const script = path.join(__dirname, 'grade-report.mjs');
      await new Promise((resolve) => {
        const p = spawn(process.execPath, [script, REBUILD_SPEC, '--generate-only'], {
          stdio: 'inherit', shell: true,
          env: { ...process.env, GRADE_SOFT: '1', SCHEMA_LINT: redocly ? '1' : '0' }
        });
        p.on('close', () => resolve());
      });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: String(e?.message || e) }));
    }
    return;
  }
  let pathname = `.${parsedUrl.pathname}`;
  if (pathname === './') pathname = './index.html';
  const filePath = path.join(dir, pathname.replace(/^\.\/+/, ''));
  fs.readFile(filePath, (err, data) => {
    if (err) { res.statusCode = 404; res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    const type = mime[ext] || 'application/octet-stream';
    res.statusCode = 200;
    res.setHeader('Content-Type', type);
    if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    res.end(data);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Serving ${dir} at http://127.0.0.1:${port}`);
});
