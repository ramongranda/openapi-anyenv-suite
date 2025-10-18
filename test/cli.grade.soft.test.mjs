import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function setupBinsWithErrors(dir) {
  const bin = join(dir, 'bin');
  mkdirSync(bin, { recursive: true });

  // spectral stub -> 1 error, 1 warning
  const spectralJs = `#!/usr/bin/env node\nprocess.stdout.write(JSON.stringify([{severity:0},{severity:1}]));`;
  writeFileSync(join(bin, 'spectral.js'), spectralJs);
  writeFileSync(join(bin, 'spectral.cmd'), `@echo off\r\nnode \\"%~dp0spectral.js\\" %*\r\n`);

  // redocly stub -> bundle + lint with one error to trigger hadErrors
  const redoclyJs = `#!/usr/bin/env node\nconst fs=require('fs');\nconst path=require('path');\nconst args=process.argv.slice(2);\nif(args[0]==='bundle'){\n  const outIdx=args.indexOf('--output');\n  const out= outIdx!==-1? args[outIdx+1] : 'dist/bundled.json';\n  fs.mkdirSync(path.dirname(out),{recursive:true});\n  const spec={openapi:'3.0.0',info:{title:'x',version:'1.0.0'},paths:{}};\n  fs.writeFileSync(out, JSON.stringify(spec));\n  process.exit(0);\n}\nif(args[0]==='lint'){\n  const result={ problems: [ { severity: 0, message: 'e' } ] };\n  process.stdout.write(JSON.stringify(result));\n  process.exit(1);\n}\nprocess.exit(2);\n`;
  writeFileSync(join(bin, 'redocly.js'), redoclyJs);
  writeFileSync(join(bin, 'redocly.cmd'), `@echo off\r\nnode \\"%~dp0redocly.js\\" %*\r\n`);

  return bin;
}

test('GRADE_SOFT=1 returns exit 0 even with errors', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'grade-cli-soft-'));
  const binDir = setupBinsWithErrors(cwd);

  writeFileSync(join(cwd, 'spec.yaml'), 'openapi: 3.0.0');

  const env = { ...process.env, PATH: `${binDir};${process.env.PATH}`, SCHEMA_LINT: '1', GRADE_SOFT: '1' };
  const res = spawnSync(process.execPath, [join(process.cwd(), 'scripts', 'grade.mjs'), 'spec.yaml'], { cwd, env, encoding: 'utf8' });

  // Soft mode -> exit 0
  expect(res.status).toBe(0);

  const reportPath = join(cwd, 'dist', 'grade-report.json');
  expect(existsSync(reportPath)).toBe(true);
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  expect(report.hadErrors).toBe(true);
});

