#!/usr/bin/env node
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execAllowFail } from './process.mjs';
import { renderGradeHtml } from './report-html.mjs';
import { safeJsonParse } from './parser.mjs';
import { computeHeuristics } from './heuristics.mjs';
import { scoreToLetter, calculateScore } from './scoring.mjs';
import { run, ensureDir, resolvePath } from './common-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run grade:npx -- <path/to/openapi.yaml>');
  process.exit(2);
}
const file = args[0];

ensureDir('dist');
const DIST_DIR = 'dist';

const defaultConfigPath = resolvePath(__dirname, '../grade.config.json');
const customConfigPath = resolvePath(process.cwd(), 'dist/grade.config.json');
const configPath = existsSync(customConfigPath) ? customConfigPath : defaultConfigPath;

const defaultSpectralRuleset = resolvePath(__dirname, '../.spectral.yaml');
const customSpectralRuleset = resolvePath(process.cwd(), 'dist/.spectral.yaml');
const spectralRuleset = existsSync(customSpectralRuleset) ? customSpectralRuleset : defaultSpectralRuleset;

const STRICT = process.env.GRADE_SOFT !== '1'; // default strict

async function gradeFlow({ spectralCmd, redoclyCmd, specPath }) {
  if (!spectralCmd || !redoclyCmd || !specPath) {
    throw new Error('Parámetros incompletos para gradeFlow');
  }

  try {
    console.log('Redocly bundle');
    await run(redoclyCmd, ['bundle', specPath, '--output', 'dist/bundled.json']);

    if (!existsSync('dist/bundled.json')) {
      throw new Error('El archivo dist/bundled.json no se generó correctamente.');
    }

    // 2) Spectral JSON (accept non-zero exit to still parse findings)
    // Calcular ruta absoluta de .spectral.yaml respecto a este script
    const spectralRuleset = path.resolve(__dirname, '..', '.spectral.yaml');
    const s = await execAllowFail(spectralCmd, ['lint', 'dist/bundled.json', '--ruleset', spectralRuleset, '--format', 'json', '--fail-severity', 'error', '--quiet']);
    const spectralReport = safeJsonParse(s.out, 'spectral-json') || [];
    const spectralErrors = spectralReport.filter(r => r.severity === 0 || r.severity === 'error').length;
    const spectralWarnings  = spectralReport.filter(r => r.severity === 1 || r.severity === 'warn' || r.severity === 'warning').length;

    // 3) Optional Redocly lint JSON
    let redoclyReport = null, redoclyErrors = 0, redoclyWarnings = 0, rOut = null, redoclyItems = [];
    if (process.env.SCHEMA_LINT === '1') {
      const r = await execAllowFail(redoclyCmd, ['lint', 'dist/bundled.json', '--format', 'json']);
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
    const text = readFileSync('dist/bundled.json', 'utf8');
    const spec = JSON.parse(text);
    const heuristics = computeHeuristics(spec);

    // 5) Scoring
    const spectral = { errors: spectralErrors, warnings: spectralWarnings, exitCode: s.code };
    const score = calculateScore(spectral, redoclyReport, heuristics);
    const letter = scoreToLetter(score);

    const hadErrors = (spectralErrors > 0) || (redoclyErrors > 0);
    const report = { bundledPath: 'dist/bundled.json', spectral, redocly: redoclyReport, heuristics, score, letter, hadErrors };
    writeFileSync(`${DIST_DIR}/grade-report.json`, JSON.stringify(report, null, 2));
    try {
      const html = renderGradeHtml(report, spectralReport, redoclyItems);
      writeFileSync(`${DIST_DIR}/grade-report.html`, html);
    } catch (e) {
      // Non-fatal for HTML generation
      console.error('Failed to write grade-report.html:', e?.message || e);
    }
    return { fatal: false, report };
  } catch (err) {
    console.error('Error durante la ejecución:', err.message);
    return { fatal: true, message: err.message };
  }
}

function validateSpec(spectralCmd, specPath) {
  // Lógica de validación separada
}

function gradeSpec(redoclyCmd, specPath) {
  // Lógica de calificación separada
}

const { fatal, message, report } = await gradeFlow({
  spectralCmd: 'npx @stoplight/spectral-cli@6.15.0',
  redoclyCmd: 'npx @redocly/cli@2.7.0',
  specPath: file
});
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
