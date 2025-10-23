import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function setupFakeBins(dir) {
  const bin = join(dir, 'bin');
  mkdirSync(bin, { recursive: true });

  // spectral stub -> prints empty JSON array (no issues)
  const spectralJs = `#!/usr/bin/env node\nprocess.stdout.write('[]');`;
  writeFileSync(join(bin, 'spectral.js'), spectralJs);
    writeFileSync(join(bin, 'spectral.cmd'), `@echo off\r\nnode %~dp0spectral.js %*\r\n`);

  // redocly stub -> supports: bundle <specPath> --output <outPath> y lint
  const redoclyJs = `#!/usr/bin/env node\nconst fs=require('fs');\nconst path=require('path');\nconst args=process.argv.slice(2);\nif(args[0]==='bundle'){\n  const outIdx=args.indexOf('--output');\n  const out= outIdx!==-1? args[outIdx+1] : 'dist/bundled.json';\n  fs.mkdirSync(path.dirname(out),{recursive:true});\n  const spec={openapi:'3.0.0',info:{title:'x',version:'1.0.0'},servers:[{url:'https://api'}],paths:{'/ping':{get:{summary:'s',description:'d',responses:{'200':{},'400':{}}}}},components:{securitySchemes:{apiKey:{type:'apiKey',in:'header',name:'x'}}}};\n  fs.writeFileSync(out, JSON.stringify(spec));\n  process.exit(0);\n}\nif(args[0]==='lint'){\n  const result={ problems: [] };\n  process.stdout.write(JSON.stringify(result));\n  process.exit(0);\n}\nprocess.exit(2);\n`;
  writeFileSync(join(bin, 'redocly.js'), redoclyJs);
    writeFileSync(join(bin, 'redocly.cmd'), `@echo off\r\nnode %~dp0redocly.js %*\r\n`);

  return bin;
}

test('grade.mjs produces report with stubs', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'grade-cli-'));
  const binDir = setupFakeBins(cwd);

  // minimal input file (not actually read by stub)
  writeFileSync(join(cwd, 'spec.yaml'), 'openapi: 3.0.0\ninfo:\n  title: test\n  version: 1.0.0\npaths: {}');

  const env = { ...process.env, PATH: `${binDir};${process.env.PATH}` };
  const res = spawnSync(process.execPath, [join(process.cwd(), 'scripts', 'grade.mjs'), 'spec.yaml'], { cwd, env, encoding: 'utf8' });

  // Always log for debugging
  console.log("stdout:\n", res.stdout);
  console.log("stderr:\n", res.stderr);

  // should succeed and print grade summary
  expect(res.status).toBe(0);
  expect(res.stdout).toMatch(/Final score:/);

  const reportPath = join(cwd, 'dist', 'grade-report.json');
  expect(existsSync(reportPath)).toBe(true);
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  expect(report).toHaveProperty('score');
  expect(report).toHaveProperty('letter');
  expect(['A','B','C','D','E']).toContain(report.letter);
});

