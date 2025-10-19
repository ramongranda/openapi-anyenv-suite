import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

function setupFakeNpx(dir) {
  const bin = join(dir, 'bin');
  mkdirSync(bin, { recursive: true });
  // Minimal NPX shim that dispatches by package name
  const npxJs = `#!/usr/bin/env node\nconst fs=require('fs');\nconst path=require('path');\nconst args=process.argv.slice(2);\nconst pkg=args[0];\nconst rest=args.slice(1);\nfunction spectralLint() { process.stdout.write('[]'); }\nfunction redoclyBundle() {\n  const outIdx=rest.indexOf('--output');\n  const out= outIdx!==-1? rest[outIdx+1] : 'dist/bundled.json';\n  fs.mkdirSync(path.dirname(out),{recursive:true});\n  const spec={openapi:'3.0.0',info:{title:'x',version:'1.0.0'},servers:[{url:'https://api'}],paths:{}};\n  fs.writeFileSync(out, JSON.stringify(spec));\n}\nif(pkg && pkg.startsWith('@stoplight/spectral-cli@')) { spectralLint(); process.exit(0); }\nif(pkg && pkg.startsWith('@redocly/cli@')) { if(rest[0]==='bundle') redoclyBundle(); process.exit(0); }\nprocess.exit(2);\n`;
  writeFileSync(join(bin, 'npx.js'), npxJs);
  writeFileSync(join(bin, 'npx.cmd'), `@echo off\r\nnode "%~dp0npx.js" %*\r\n`);
  return bin;
}

test('grade-report.mjs generates HTML and serves it', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'report-cli-'));
  const binDir = setupFakeNpx(cwd);

  writeFileSync(join(cwd, 'spec.yaml'), 'openapi: 3.0.0');

  const env = { ...process.env, PATH: `${binDir};${process.env.PATH}`, GRADE_SOFT: '1' };
  const child = spawn(process.execPath, [join(process.cwd(), 'scripts', 'grade-report-npx.mjs'), 'spec.yaml', '--generate-only'], { cwd, env, encoding: 'utf8' });
  await new Promise((resolve) => child.on('close', () => resolve()));

  const htmlPath = join(cwd, 'dist', 'grade-report.html');
  // Wait up to 15s for HTML to be generated (CI can be slow)
  const started = Date.now();
  while (!existsSync(htmlPath) && Date.now() - started < 15000) {
    await new Promise((r) => setTimeout(r, 100));
  }
  expect(existsSync(htmlPath)).toBe(true);
  const html = readFileSync(htmlPath, 'utf8');
  expect(html).toMatch(/OpenAPI Grade Report/);
}, 30000);
