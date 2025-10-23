import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function setupBinsWithLint(dir) {
  const bin = join(dir, 'bin');
  mkdirSync(bin, { recursive: true });

  // spectral stub -> prints empty JSON array (no issues)
  const spectralJs = `#!/usr/bin/env node\nprocess.stdout.write('[]');`;
  writeFileSync(join(bin, 'spectral.js'), spectralJs);
  writeFileSync(join(bin, 'spectral.cmd'), `@echo off\r\nnode %~dp0spectral.js %*\r\n`);

  // redocly stub -> supports bundle and lint
  const redoclyJs = `#!/usr/bin/env node\nconst fs=require('fs');\nconst path=require('path');\nconst args=process.argv.slice(2);\nif(args[0]==='bundle'){\n  const outIdx=args.indexOf('--output');\n  const out= outIdx!==-1? args[outIdx+1] : 'dist/bundled.json';\n  fs.mkdirSync(path.dirname(out),{recursive:true});\n  const spec={openapi:'3.0.0',info:{title:'x',version:'1.0.0'},servers:[{url:'https://api'}],paths:{'/ping':{get:{summary:'s',description:'d',responses:{'200':{},'400':{}}}}},components:{securitySchemes:{apiKey:{type:'apiKey',in:'header',name:'x'}}}};\n  fs.writeFileSync(out, JSON.stringify(spec));\n  process.exit(0);\n}\nif(args[0]==='lint'){\n  const result={ problems: [ { severity: 0, message: 'e' }, { severity: 1, message: 'w' } ] };\n  process.stdout.write(JSON.stringify(result));\n  process.exit(1);\n}\nprocess.exit(2);\n`;
  writeFileSync(join(bin, 'redocly.js'), redoclyJs);
  writeFileSync(join(bin, 'redocly.cmd'), `@echo off\r\nnode %~dp0redocly.js %*\r\n`);

  return bin;
}

test('grade.mjs handles "--" separator and uses the spec path after it', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'grade-cli-args-'));
  const binDir = setupBinsWithLint(cwd);

  writeFileSync(join(cwd, 'spec.yaml'), 'openapi: 3.0.0\ninfo:\n  title: test\n  version: 1.0.0\npaths: {}');

  const env = { ...process.env, PATH: `${binDir};${process.env.PATH}`, SCHEMA_LINT: '1' };
  // Simulate npm passing a '--' separator before the spec path
  const res = spawnSync(process.execPath, [join(process.cwd(), 'scripts', 'grade.mjs'), '--', 'spec.yaml'], { cwd, env, encoding: 'utf8' });

  // Always log for debugging
  console.log('stdout:\n', res.stdout);
  console.log('stderr:\n', res.stderr);

  // Since our redocly stub returns problems, strict mode should cause exit 1
  expect(res.status).toBe(1);

  const reportPath = join(cwd, 'dist', 'grade-report.json');
  expect(existsSync(reportPath)).toBe(true);
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  expect(report.redocly && report.redocly.errors).toBeGreaterThanOrEqual(1);
  expect(report.hadErrors).toBe(true);
});
