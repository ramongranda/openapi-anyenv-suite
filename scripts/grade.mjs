#!/usr/bin/env node
import { gradeFlow } from './grade_common.mjs';
import { resolveBin } from './utils.mjs';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run grade -- <path/to/openapi.yaml>');
  process.exit(2);
}
const file = args[0];

const STRICT = process.env.GRADE_SOFT === '1' ? false : true; // default strict

const { fatal, message, report } = await gradeFlow({ spectralCmd: resolveBin('spectral'), redoclyCmd: resolveBin('redocly'), specPath: file });
if (fatal) {
  console.error(message);
  process.exit(1);
}

const { score, letter, spectral, redocly, hadErrors } = report;
console.log('-'.repeat(60));
console.log(`Final score: ${score} | Grade: ${letter}`);
console.log(`Spectral: ${spectral.errors} errors, ${spectral.warnings} warnings` + (redocly ? ` | Redocly: ${redocly.errors} errors, ${redocly.warnings} warnings` : ''));
console.log(`Report: dist/grade-report.json`);
console.log('-'.repeat(60));

if (STRICT && hadErrors) process.exit(1);
process.exit(0);

