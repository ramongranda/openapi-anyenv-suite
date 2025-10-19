import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

function setupFakeNpx(dir) {
  const bin = join(dir, 'bin');
  mkdirSync(bin, { recursive: true });

  // Minimal NPX shim that dispatches by package name
  const npxJs = `#!/usr/bin/env node\nconst fs=require('fs');\nconst path=require('path');\nconst args=process.argv.slice(2);\nconst pkg=args[0];\nconst rest=args.slice(1);\nfunction spectralLint() { process.stdout.write('[]'); }\nfunction redoclyBundle() {\n  const outIdx=rest.indexOf('--output');\n  const out= outIdx!==-1? rest[outIdx+1] : 'dist/bundled.json';\n  fs.mkdirSync(path.dirname(out),{recursive:true});\n  const spec={openapi:'3.0.0',info:{title:'x',version:'1.0.0'},servers:[{url:'https://api'}],paths:{'/ping':{get:{summary:'s',description:'d',responses:{'200':{},'400':{}}}}},components:{securitySchemes:{apiKey:{type:'apiKey',in:'header',name:'x'}}}};\n  fs.writeFileSync(out, JSON.stringify(spec));\n}\nif(pkg && pkg.startsWith('@stoplight/spectral-cli@')) { spectralLint(); process.exit(0); }\nif(pkg && pkg.startsWith('@redocly/cli@')) { if(rest[0]==='bundle') redoclyBundle(); process.exit(0); }\nprocess.exit(2);\n`;
  writeFileSync(join(bin, 'npx.js'), npxJs);
  writeFileSync(join(bin, 'npx.cmd'), `@echo off\r\nnode "%~dp0npx.js" %*\r\n`);

  return bin;
}

test('grade-npx.mjs produces report using NPX shim', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'grade-npx-cli-'));
  const binDir = setupFakeNpx(cwd);

  writeFileSync(join(cwd, 'spec.yaml'), 'openapi: 3.0.0');

  const env = { ...process.env, PATH: `${binDir};${process.env.PATH}`, GRADE_SOFT: '1' };
  const res = spawnSync(process.execPath, [join(process.cwd(), 'scripts', 'grade-npx.mjs'), 'spec.yaml'], { cwd, env, encoding: 'utf8' });

  if (res.status !== 0) {
    // Helpful debug on CI
    // eslint-disable-next-line no-console
    console.log('stdout:\n', res.stdout);
    // eslint-disable-next-line no-console
    console.log('stderr:\n', res.stderr);
  }
  expect(res.status).toBe(0);
  expect(res.stdout).toMatch(/Final score:/);

  const reportPath = join(cwd, 'dist', 'grade-report.json');
  expect(existsSync(reportPath)).toBe(true);
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  expect(report).toHaveProperty('score');
  expect(['A','B','C','D','E']).toContain(report.letter);

  const htmlPath = join(cwd, 'dist', 'grade-report.html');
  expect(existsSync(htmlPath)).toBe(true);
  const html = readFileSync(htmlPath, 'utf8');
  expect(html).toMatch(/OpenAPI Grade Report/);
});
