#!/usr/bin/env node
/**
 * Grade an OpenAPI document by bundling, linting (Spectral [+ Redocly]),
 * computing heuristics, and producing JSON + HTML reports under dist/.
 *
 * Usage:
 *   npm run grade -- <path/to/openapi.yaml>
 *
 * Environment:
 *   SCHEMA_LINT=1  Include Redocly schema lint and factor into score
 *   GRADE_SOFT=1   Do not fail (exit 0) even when errors are present
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolveBin } from './utils.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderGradeHtml } from './report-html.mjs';
import { execAllowFail } from './process.mjs';
import { safeJsonParse } from './parser.mjs';
import { computeHeuristics } from './heuristics.mjs';
import { scoreToLetter, calculateScore } from './scoring.mjs';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run grade -- <path/to/openapi.yaml>');
  process.exit(2);
}
const file = args[0];

const STRICT = process.env.GRADE_SOFT !== '1'; // default strict

/**
 * Orchestrate bundle + lints + heuristics and write reports.
 *
 * @param {{ spectralCmd:string, redoclyCmd:string, specPath:string }} args
 * @returns {Promise<{ fatal:boolean, message?:string, report?:{
 *   bundledPath:string,
 *   spectral:{errors:number,warnings:number,exitCode:number},
 *   redocly: null | {errors:number,warnings:number,exitCode:number},
 *   heuristics:any,
 *   score:number,
 *   letter:'A'|'B'|'C'|'D'|'E',
 *   hadErrors:boolean
 * }}>
 */
async function gradeFlow({ spectralCmd, redoclyCmd, specPath }) {
  const DIST_DIR = 'dist';
  mkdirSync(DIST_DIR, { recursive: true });
  const bundledPath = `${DIST_DIR}/bundled.json`;

  // 1) Bundle
  const b = await execAllowFail(redoclyCmd, ['bundle', specPath, '--output', bundledPath]);
  if (b.code !== 0) {
    return { fatal: true, message: `redocly bundle exited ${b.code}.\n${b.err || b.out}` };
  }
  // Verificar que el bundle realmente existe antes de continuar
  import { existsSync } from 'node:fs';
  if (!existsSync(bundledPath)) {
    return { fatal: true, message: `Bundle not found: ${bundledPath}.\nRedocly output:\n${b.out}\n${b.err}` };
  }

  // 2) Spectral JSON (accept non-zero exit to still parse findings)
  // Calcular ruta absoluta de .spectral.yaml respecto a este script
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const spectralRuleset = path.resolve(__dirname, '..', '.spectral.yaml');
  const s = await execAllowFail(spectralCmd, ['lint', bundledPath, '--ruleset', spectralRuleset, '--format', 'json', '--fail-severity', 'error', '--quiet']);
  const spectralReport = safeJsonParse(s.out, 'spectral-json') || [];
  const spectralErrors = spectralReport.filter(r => r.severity === 0 || r.severity === 'error').length;
  const spectralWarnings  = spectralReport.filter(r => r.severity === 1 || r.severity === 'warn' || r.severity === 'warning').length;

  // 3) Optional Redocly lint JSON
  let redoclyReport = null, redoclyErrors = 0, redoclyWarnings = 0, rOut = null, redoclyItems = [];
  if (process.env.SCHEMA_LINT === '1') {
    const r = await execAllowFail(redoclyCmd, ['lint', bundledPath, '--format', 'json']);
    rOut = r;
    const parsedRedocly = safeJsonParse(r.out, 'redocly-json');
    if (parsedRedocly) {
      let items = [];
      if (Array.isArray(parsedRedocly.results)) items = parsedRedocly.results;
      else if (Array.isArray(parsedRedocly.problems)) items = parsedRedocly.problems;
      else if (Array.isArray(parsedRedocly)) items = parsedRedocly;
      redoclyItems = items;
      for (const it of items) {
        let sev;
        if (typeof it.severity === 'string') sev = it.severity;
        else if (it.severity === 0) sev = 'error';
        else if (it.severity === 1) sev = 'warn';
        else sev = 'info';
        if (sev === 'error') redoclyErrors++;
        else if (sev === 'warn' || sev === 'warning') redoclyWarnings++;
      }
    }
    redoclyReport = { errors: redoclyErrors, warnings: redoclyWarnings, exitCode: rOut?.code ?? 0 };
  }

  // 4) Heuristics
  const text = readFileSync(bundledPath, 'utf8');
  const spec = JSON.parse(text);
  const heuristics = computeHeuristics(spec);

  // 5) Scoring
  const spectral = { errors: spectralErrors, warnings: spectralWarnings, exitCode: s.code };
  const score = calculateScore(spectral, redoclyReport, heuristics);
  const letter = scoreToLetter(score);

  const hadErrors = (spectralErrors > 0) || (redoclyErrors > 0);
  const report = { bundledPath, spectral, redocly: redoclyReport, heuristics, score, letter, hadErrors };
  writeFileSync(`${DIST_DIR}/grade-report.json`, JSON.stringify(report, null, 2));
  try {
    const html = renderGradeHtml(report, spectralReport, redoclyItems);
    writeFileSync(`${DIST_DIR}/grade-report.html`, html);
  } catch (e) {
    // Non-fatal for HTML generation
    console.error('Failed to write grade-report.html:', e?.message || e);
  }
  return { fatal: false, report };
}

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
