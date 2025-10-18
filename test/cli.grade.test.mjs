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
  writeFileSync(join(bin, 'spectral.cmd'), `@echo off\r\nnode \\"%~dp0spectral.js\\" %*\r\n`);

  // redocly stub -> supports: bundle <specPath> --output <outPath>
  const redoclyJs = `#!/usr/bin/env node\nconst fs=require('fs');\nconst args=process.argv.slice(2);\nconst outIdx=args.indexOf('--output');\nconst out= outIdx!==-1? args[outIdx+1] : 'dist/bundled.json';\nfs.mkdirSync(require('path').dirname(out),{recursive:true});\nconst spec={openapi:'3.0.0',info:{title:'x',version:'1.0.0'},servers:[{url:'https://api'}],paths:{'/ping':{get:{summary:'s',description:'d',responses:{'200':{},'400':{}}}}},components:{securitySchemes:{apiKey:{type:'apiKey',in:'header',name:'x'}}}};\nfs.writeFileSync(out, JSON.stringify(spec));\n`;
  writeFileSync(join(bin, 'redocly.js'), redoclyJs);
  writeFileSync(join(bin, 'redocly.cmd'), `@echo off\r\nnode \\"%~dp0redocly.js\\" %*\r\n`);

  return bin;
}

test('grade.mjs produces report with stubs', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'grade-cli-'));
  const binDir = setupFakeBins(cwd);

  // minimal input file (not actually read by stub)
  writeFileSync(join(cwd, 'spec.yaml'), 'openapi: 3.0.0');

  const env = { ...process.env, PATH: `${binDir};${process.env.PATH}` };
  const res = spawnSync(process.execPath, [join(process.cwd(), 'scripts', 'grade.mjs'), 'spec.yaml'], { cwd, env, encoding: 'utf8' });

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

