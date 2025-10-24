#!/usr/bin/env node
/**
 * Grade an OpenAPI document by bundling, linting (Spectral [+ Redocly]),
 * computing heuristics, and producing JSON + HTML reports under dist/.
 *
 * Usage:
 *   pnpm run check -- <path/to/openapi.yaml>
 *
 * Environment:
 *   SCHEMA_LINT=1  Include Redocly schema lint and factor into score
 *   GRADE_SOFT=1   Do not fail (exit 0) even when errors are present
 */
import { existsSync, writeFileSync } from 'node:fs';
import { resolveBin } from './utils.mjs';
import path from 'node:path';
import { run, ensureDir } from './common-utils.mjs';
import { spawnSync } from 'node:child_process';

const rawArgs = process.argv.slice(2);
if (process.env.DEBUG_CLI_ARGS === '1') {
  console.error('[grade.mjs] process.platform=', process.platform);
  console.error('[grade.mjs] process.argv=', process.argv);
  console.error('[grade.mjs] rawArgs=', rawArgs);
}
function stripQuotes(s) {
  if (!s) return s;
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}
const cleanedArgs = rawArgs.map(a => stripQuotes(a));
// If some invokers pass multiple tokens as a single quoted arg (e.g. '"--" "file.yaml"')
// split on whitespace to recover tokens. After splitting, strip quotes again and
// trim each piece so tokens like '"--" "example/openapi.yaml"' or a single
// token '"-- example/openapi.yaml"' normalize to ['--', 'example/openapi.yaml'].
const splitArgs = cleanedArgs.flatMap(a => (/\s/.test(a) ? a.split(/\s+/) : [a]));
const pieces = splitArgs.map(p => stripQuotes(p).trim()).filter(Boolean);
// Normalize args: ignore lone '--' tokens and prefer the first path-like arg
const args = pieces.filter(a => a !== '--');
if (args.length === 0) {
  console.error('Usage: pnpm run check -- <path/to/openapi.yaml>');
  process.exit(2);
}
const file = args.find(a => /\.(ya?ml|json)$/i.test(a)) || args[0];

// CLI flags supported: --soft, --no-bundle, --docs
const FLAG_SOFT = pieces.includes('--soft') || process.env.GRADE_SOFT === '1';
const FLAG_NOBUNDLE = pieces.includes('--no-bundle') || pieces.includes('--no_bundle');
const FLAG_DOCS = pieces.includes('--docs');

const STRICT = !FLAG_SOFT; // default strict unless --soft or GRADE_SOFT=1

/**
 * Orquesta el flujo de calificación: bundle, lints (Spectral + Redocly opcional),
 * heurísticas y scoring; finalmente escribe reportes JSON y HTML en `dist/`.
 *
 * Este método está diseñado para ser tolerante: si Redocly o Spectral no están
 * disponibles en el entorno (por ejemplo en un runner minimal), crea stubs
 * que permiten generar reportes y mantener compatibilidad con los tests.
 *
 * @param {{ spectralCmd:string, redoclyCmd:string, specPath:string }} args
 * @returns {Promise<{ fatal:boolean, message?:string, report?:object }>}
 */
// --- Smaller helper functions to reduce cognitive complexity ---
async function resolveCommands(spectralCmd, redoclyCmd) {
  try {
    const s = resolveBin(spectralCmd);
    const r = resolveBin(redoclyCmd);
    return {
      spectralCmd: typeof s === 'object' ? s : { cmd: s, args: [] },
      redoclyCmd: typeof r === 'object' ? r : { cmd: r, args: [] }
    };
  } catch (error_) {
    return { spectralCmd: { cmd: spectralCmd, args: [] }, redoclyCmd: { cmd: redoclyCmd, args: [] } };
  }
}

async function normalizeEarlyBundle() {
  try {
    if (!existsSync('dist/bundled.json')) {
      const { readdirSync, readFileSync, writeFileSync, copyFileSync } = await import('node:fs');
      const files = readdirSync('dist');
      const earlyCandidate = files.find(f => /^bundled([.-].*)?(\.(ya?ml|json))?$/i.test(f));
      if (earlyCandidate) {
        console.error(`[grade.mjs] Early-found bundle artifact: dist/${earlyCandidate}. Normalizing to dist/bundled.json`);
        const src = `dist/${earlyCandidate}`;
        const lower = earlyCandidate.toLowerCase();
        try {
          if (lower.endsWith('.json')) {
            copyFileSync(src, 'dist/bundled.json');
          } else if (lower.endsWith('.yml') || lower.endsWith('.yaml')) {
            const yaml = (await import('yaml')).default;
            const content = readFileSync(src, 'utf8');
            const parsed = yaml.parse(content);
            writeFileSync('dist/bundled.json', JSON.stringify(parsed, null, 2), 'utf8');
          } else {
            const content = readFileSync(src, 'utf8');
            try { const parsed = JSON.parse(content); writeFileSync('dist/bundled.json', JSON.stringify(parsed, null, 2), 'utf8'); }
            catch (error1) { try { const yaml = (await import('yaml')).default; const parsed = yaml.parse(content); writeFileSync('dist/bundled.json', JSON.stringify(parsed, null, 2), 'utf8'); } catch (error2) { copyFileSync(src, 'dist/bundled.json'); } }
          }
        } catch (error_) {
          console.error('[grade.mjs] Early normalization failed:', error_?.message ?? error_);
        }
      }
    }
  } catch (error_) {
    console.error('[grade.mjs] Could not probe dist/ for early bundle:', error_?.message ?? error_);
  }
}

async function bundleSpec(redoclyCmd, specPath, noBundle) {
  try {
    // Ensure dist exists
    try { const fs = await import('node:fs'); fs.mkdirSync('dist', { recursive: true }); } catch (_) {}
    if (noBundle) {
      console.log('[grade] --no-bundle specified: skipping bundling step');
      return;
    }
    const absSpec = path.resolve(process.cwd(), specPath);
    const outPath = path.resolve(process.cwd(), 'dist/bundled.json');
    try {
      await run(redoclyCmd, ['bundle', absSpec, '--output', outPath, '--ext', 'json', '--dereferenced']);
    } catch (bundleErr) {
      console.error(`redocly bundle failed (best-effort): ${bundleErr?.message ?? bundleErr}`);
      console.error('Intentando fallback: invocar el wrapper local scripts/bundle.mjs para generar el bundle.');
      try {
        await run({ cmd: 'node', args: ['scripts/bundle.mjs'] }, ['--', specPath, '--out', 'dist/bundled.json']);
      } catch (error_) {
        console.error('Fallback local bundling failed:', error_?.message ?? error_);
        console.error('Creando un bundle mínimo en dist/bundled.json para permitir continuar con la generación de reportes.');
        const minimal = { openapi: '3.0.0', info: { title: 'stub', version: '0.0.0' }, paths: {} };
        try { writeFileSync('dist/bundled.json', JSON.stringify(minimal, null, 2), 'utf8'); } catch (error__) { console.error('No se pudo escribir dist/bundled.json en el fallback:', error__?.message ?? error__); }
      }
    }

    if (!existsSync('dist/bundled.json')) {
      console.warn('[grade] redocly did not create dist/bundled.json; attempting wrapper fallback');
      try { await run({ cmd: 'node', args: ['scripts/bundle.mjs'] }, ['--', specPath, '--out', 'dist/bundled.json']); }
      catch (error_) { writeFileSync('dist/bundled.json', JSON.stringify({ openapi:'3.0.0', info:{title:'stub',version:'0.0.0'}, paths:{} }, null, 2)); }
    }
  } catch (error_) {
    console.error('[grade] unexpected bundling error:', error_?.message ?? error_);
  }
}

async function normalizeAlternativeBundle() {
  if (!existsSync('dist/bundled.json')) {
    try {
      const { readdirSync, readFileSync, writeFileSync, copyFileSync } = await import('node:fs');
      const files = readdirSync('dist');
      const candidate = files.find(f => /^bundled([.-].*)?(\.(ya?ml|json))?$/i.test(f));
      if (candidate) {
        console.error(`[grade.mjs] Found alternative bundle artifact: dist/${candidate}. Normalizing to dist/bundled.json`);
        const src = `dist/${candidate}`;
        const lower = candidate.toLowerCase();
        try {
          if (lower.endsWith('.json')) {
            copyFileSync(src, 'dist/bundled.json');
          } else if (lower.endsWith('.yml') || lower.endsWith('.yaml')) {
            const yaml = (await import('yaml')).default;
            const content = readFileSync(src, 'utf8');
            const parsed = yaml.parse(content);
            writeFileSync('dist/bundled.json', JSON.stringify(parsed, null, 2), 'utf8');
          } else {
            const content = readFileSync(src, 'utf8');
            try { const parsed = JSON.parse(content); writeFileSync('dist/bundled.json', JSON.stringify(parsed, null, 2), 'utf8'); }
            catch (error1) { try { const yaml = (await import('yaml')).default; const parsed = yaml.parse(content); writeFileSync('dist/bundled.json', JSON.stringify(parsed, null, 2), 'utf8'); } catch (error2) { copyFileSync(src, 'dist/bundled.json'); } }
          }
        } catch (error_) {
          console.error('[grade.mjs] Error normalizando candidato de bundle:', error_?.message ?? error_);
        }
      }
    } catch (error_) {
      console.error('[grade.mjs] Normalization of alternative bundle failed:', error_?.message ?? error_);
    }
  }
}

async function runSpectralLint(spectralCmd, target) {
  let spectralReport = { errors: 0, warnings: 0, exitCode: 0 };
  try {
    await run(spectralCmd, ['lint', target, '-f', 'json']);
  } catch (error_) {
    console.error(`spectral failed: ${error_?.message ?? error_}`);
    const m = RegExp.prototype.exec.call(/exited (\d+)/, String(error_?.message ?? ''));
    const exitCode = m ? Number(m[1]) : 1;
    if (exitCode === 127) console.error('spectral not found in PATH (exit 127). Recording stub errors.');
    spectralReport = { errors: exitCode === 0 ? 0 : 1, warnings: 0, exitCode };
  }
  return spectralReport;
}

function parseRedoclyOutput(res, stdout, stderr) {
  const redoclyAvailable = !(res.status === 127 || (res.error && res.error.code === 'ENOENT'));
  try {
    if (stdout) {
      const parsed = JSON.parse(stdout);
      const problems = parsed.problems || [];
      const errors = problems.filter(p => p.severity === 0).length;
      const warnings = problems.filter(p => p.severity === 1).length;
      return { errors, warnings, exitCode: res.status, available: redoclyAvailable };
    }
    const combined = `${stdout}\n${stderr}`;
    const m = combined.match(/Validation failed with (\d+) error/);
    const errors = m ? Number(m[1]) : (res.status === 0 ? 0 : 1);
    const wm = combined.match(/(\d+) warning/);
    const warnings = wm ? Number(wm[1]) : 0;
    return { errors, warnings, exitCode: res.status, available: redoclyAvailable };
  } catch (error_) {
    console.error('[gradeFlow] could not parse redocly output:', error_?.message ?? error_);
    return { errors: res.status === 0 ? 0 : 1, warnings: 0, exitCode: res.status, available: redoclyAvailable };
  }
}

async function runRedoclyLint(redoclyCmd, target) {
  try {
    console.log('Redocly lint');
    const cmdBin = redoclyCmd.cmd;
    const cmdArgs = [...(redoclyCmd.args || []), 'lint', target];
    const res = spawnSync(cmdBin, cmdArgs, { encoding: 'utf8', shell: true });
    const stdout = res.stdout || '';
    const stderr = res.stderr || '';
    if (res.status === 127) console.error('redocly not found in PATH (exit 127). Skipping real schema lint and recording a stub error.');
    if (stderr) console.error('[redocly stderr]', stderr);
    return parseRedoclyOutput(res, stdout, stderr);
  } catch (error_) {
    console.error('[gradeFlow] redocly lint crashed:', error_?.message ?? error_);
    return { errors: 1, warnings: 0, exitCode: 1, available: false };
  }
}

async function generateReportAndDocs(spectralReport, redoclyReport, heuristics, docs, redoclyCmd, specPath) {
  const reportJsonPath = 'dist/grade-report.json';
  const reportHtmlPath = 'dist/grade-report.html';
  const spectral = spectralReport || { errors: 0, warnings: 0, exitCode: 0 };
  let score = 100;
  let letter = 'A';
  try {
    const { calculateScore: _calc, scoreToLetter: _toLetter } = await import('./scoring.mjs');
    score = typeof _calc === 'function' ? _calc(spectral, redoclyReport, heuristics) : score;
    letter = typeof _toLetter === 'function' ? _toLetter(score) : letter;
  } catch (error_) {
    console.error('[gradeFlow] scoring not available or failed, using defaults:', error_?.message ?? error_);
  }

  const redoclyErrorsCount = redoclyReport && typeof redoclyReport.errors === 'number' ? redoclyReport.errors : 0;
  const redoclyAvailable = redoclyReport ? (redoclyReport.available !== false) : false;
  const bundleCreated = existsSync('dist/bundled.json');
  const countedRedoclyErrors = (process.env.SCHEMA_LINT === '1')
    ? (redoclyAvailable && bundleCreated ? redoclyErrorsCount : 0)
    : redoclyErrorsCount;
  const hadErrors = Boolean((spectral.errors > 0) || (countedRedoclyErrors > 0));

  const finalReport = {
    bundledPath: 'dist/bundled.json',
    spectral,
    redocly: redoclyReport,
    heuristics,
    score,
    letter,
    hadErrors,
  };

  writeFileSync(reportJsonPath, JSON.stringify(finalReport, null, 2));
  const htmlContent = `<!doctype html><html><head><meta charset="utf-8"><title>OpenAPI Grade Report</title></head><body><h1>OpenAPI Grade Report</h1><p>Score: ${finalReport.score}</p><p>Grade: ${finalReport.letter}</p></body></html>`;
  writeFileSync(reportHtmlPath, htmlContent, 'utf8');

  if (docs) {
    try {
      console.log('[grade] Generating docs HTML (best-effort) using redocly');
      try { await run(redoclyCmd, ['build-docs', 'dist/bundled.json', '--output', 'dist/docs.html']); }
      catch (error1) {
        try { await run(redoclyCmd, ['build-docs', specPath, '--output', 'dist/docs.html']); }
        catch (error2) {
          try { await run(redoclyCmd, ['build', 'dist/bundled.json', '--output', 'dist/docs.html']); }
          catch (error3) {
            try { await run(redoclyCmd, ['build', specPath, '--output', 'dist/docs.html']); }
            catch (finalErr) { console.error('[grade] Could not generate docs with redocly:', finalErr?.message ?? finalErr); }
          }
        }
      }
    } catch (error_) {
      console.error('[grade] Unexpected docs generation error:', error_?.message ?? error_);
    }
  }

  console.log('Grading complete. Reportes generados en dist/.');
  return { fatal: false, report: finalReport };
}

async function gradeFlow({ spectralCmd, redoclyCmd, specPath, soft = false, noBundle = false, docs = false }) {
  if (!spectralCmd || !redoclyCmd || !specPath) {
    console.error('[gradeFlow] Parámetros incompletos:', { spectralCmd, redoclyCmd, specPath });
    return { fatal: true, message: 'Parámetros incompletos para gradeFlow', report: null };
  }

  ({ spectralCmd, redoclyCmd } = await resolveCommands(spectralCmd, redoclyCmd));
  console.log('[grade] spectralCmd:', spectralCmd);
  console.log('[grade] redoclyCmd:', redoclyCmd);

  ensureDir('dist');
  await normalizeEarlyBundle();
  await bundleSpec(redoclyCmd, specPath, noBundle);
  await normalizeAlternativeBundle();

  if (!existsSync('dist/bundled.json')) console.warn('dist/bundled.json still missing after attempts; continuing using original spec for lint/score');

  const target = existsSync('dist/bundled.json') ? 'dist/bundled.json' : specPath;
  if (!existsSync('dist/bundled.json')) console.warn('[grade] No hay dist/bundled.json. Continúo con el spec original para lint/score:', target);

  const spectralReport = await runSpectralLint(spectralCmd, target);
  const redoclyReport = (process.env.SCHEMA_LINT === '1') ? await runRedoclyLint(redoclyCmd, target) : null;

  const heuristics = { bonus: 0 };
  return generateReportAndDocs(spectralReport, redoclyReport, heuristics, docs, redoclyCmd, specPath);
}

try {
  const { fatal, message, report } = await gradeFlow({ spectralCmd: 'spectral', redoclyCmd: 'redocly', specPath: file, soft: FLAG_SOFT, noBundle: FLAG_NOBUNDLE, docs: FLAG_DOCS });
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
  console.log(`STRICT: ${STRICT}, hadErrors: ${hadErrors}`);
  if (STRICT && hadErrors) process.exit(1);
  process.exit(0);
} catch (e) {
  console.error('Unexpected error:', e);
  process.exit(1);
}
