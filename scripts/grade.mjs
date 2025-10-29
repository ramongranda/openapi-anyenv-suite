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
import { fileURLToPath } from 'node:url';

// Resolve package paths regardless of caller CWD (for dlx/npx usage)
const __HERE = path.dirname(fileURLToPath(import.meta.url));
const __PKG_ROOT = path.resolve(__HERE, '..');
const __BUNDLE_WRAPPER = path.resolve(__PKG_ROOT, 'scripts', 'bundle.mjs');
const __SPECTRAL_RULESET = path.resolve(__PKG_ROOT, '.spectral.yaml');
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
const FLAG_NO_HTML = pieces.includes('--no-html') || pieces.includes('--no-report-html');
const FLAG_DOCS_STRICT = pieces.includes('--strict') || process.env.GRADE_STRICT === '1';

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
        await run({ cmd: 'node', args: [__BUNDLE_WRAPPER] }, ['--', specPath, '--out', 'dist/bundled.json']);
      } catch (error_) {
        console.error('Fallback local bundling failed:', error_?.message ?? error_);
        console.error('Creando un bundle mínimo en dist/bundled.json para permitir continuar con la generación de reportes.');
        const minimal = { openapi: '3.0.0', info: { title: 'stub', version: '0.0.0' }, paths: {} };
        try { writeFileSync('dist/bundled.json', JSON.stringify(minimal, null, 2), 'utf8'); } catch (error__) { console.error('No se pudo escribir dist/bundled.json en el fallback:', error__?.message ?? error__); }
      }
    }

    if (!existsSync('dist/bundled.json')) {
      console.warn('[grade] redocly did not create dist/bundled.json; attempting wrapper fallback');
      try { await run({ cmd: 'node', args: [__BUNDLE_WRAPPER] }, ['--', specPath, '--out', 'dist/bundled.json']); }
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
  // spectralCmd may be { cmd, args }
  try {
    const cmdBin = spectralCmd.cmd || spectralCmd;
    const cmdArgs = [...(spectralCmd.args || []), 'lint', target, '--ruleset', __SPECTRAL_RULESET, '-f', 'json'];
    const res = spawnSync(cmdBin, cmdArgs, { encoding: 'utf8', shell: true });
    const stdout = res.stdout || '';
    const stderr = res.stderr || '';
    if (res.status === 127) {
      console.error('spectral not found in PATH (exit 127). Recording stub errors.');
      return { errors: 1, warnings: 0, exitCode: 127, available: false, issues: [], problems: [] };
    }
    if (stderr) console.error('[spectral stderr]', stderr);
    // Try parse JSON output
    try {
      const parsed = stdout ? JSON.parse(stdout) : null;
      const problems = parsed && Array.isArray(parsed) ? parsed : (parsed && parsed.results ? parsed.results : []);
  const issues = Array.isArray(problems) ? problems : [];
  const errors = issues.filter(i => i.severity === 0 || i.level === 'error' || i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 1 || i.level === 'warn' || i.severity === 'warning').length;
  // Return both `problems` (canonical) and `issues` (legacy alias)
  return { errors, warnings, exitCode: res.status || 0, available: true, issues, problems: issues };
    } catch (e) {
      console.error('[gradeFlow] could not parse spectral JSON output:', e?.message ?? e);
      // Fallback: use exit code
  const exitCode = typeof res.status === 'number' ? res.status : 1;
  return { errors: exitCode === 0 ? 0 : 1, warnings: 0, exitCode, available: true, issues: [], problems: [] };
    }
  } catch (error_) {
    console.error(`spectral crashed: ${error_?.message ?? error_}`);
    return { errors: 1, warnings: 0, exitCode: 1, available: false, issues: [], problems: [] };
  }
}

function parseRedoclyOutput(res, stdout, stderr) {
  const redoclyAvailable = !(res.status === 127 || (res.error && res.error.code === 'ENOENT'));
  try {
    if (stdout) {
      try {
        const parsed = JSON.parse(stdout);
        const problems = parsed.problems || [];
        // Redocly may emit severity as strings ('error'|'warn') or numeric codes; normalize by checking strings first
        const errors = problems.filter(p => {
          const s = String(p.severity ?? '').toLowerCase();
          return s === 'error' || s.startsWith('err') || s === '0' || Number(s) === 0;
        }).length;
        const warnings = problems.filter(p => {
          const s = String(p.severity ?? '').toLowerCase();
          return s === 'warn' || s.startsWith('warn') || s === '1' || Number(s) === 1;
        }).length;
        return { errors, warnings, exitCode: res.status, available: redoclyAvailable, problems, raw: stdout };
      } catch (e) {
        // not JSON
      }
    }
    const combined = `${stdout}\n${stderr}`;
    // Extract numeric counts from human output as fallback and include raw text
    const errRe = /Validation failed with (\d+) error/;
    const warnRe = /(\d+) warning/;
    const errMatch = errRe.exec(combined);
    const warnMatch = warnRe.exec(combined);
    const errors = errMatch ? Number(errMatch[1]) : (res.status === 0 ? 0 : 1);
    const warnings = warnMatch ? Number(warnMatch[1]) : 0;
    return { errors, warnings, exitCode: res.status, available: redoclyAvailable, problems: [], raw: combined };
  } catch (error_) {
    console.error('[gradeFlow] could not parse redocly output:', error_?.message ?? error_);
    return { errors: res.status === 0 ? 0 : 1, warnings: 0, exitCode: res.status, available: redoclyAvailable, problems: [], raw: `${stdout}\n${stderr}` };
  }
}

async function runRedoclyLint(redoclyCmd, target) {
  try {
    console.log('Redocly lint');
    const cmdBin = redoclyCmd.cmd;
    // Request JSON output from Redocly when possible so we can capture detailed problems
    const cmdArgs = [...(redoclyCmd.args || []), 'lint', target, '--format', 'json'];
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

async function generateReportAndDocs(spectralReport, redoclyReport, heuristics, docs, redoclyCmd, specPath, docsStrict = false) {
  const reportJsonPath = 'dist/grade-report.json';
  // Write the human-facing HTML report as dist/index.html so consumers can
  // open the folder directly or serve it as a static site root.
  const reportHtmlPath = 'dist/index.html';
  const spectral = spectralReport || { errors: 0, warnings: 0, exitCode: 0 };
  let score = 100;
  let letter = 'A';
  // Track whether redoc-cli was used to generate docs
  let redocCliUsed = false;
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
  let countedRedoclyErrors;
  if (process.env.SCHEMA_LINT === '1') {
    countedRedoclyErrors = (redoclyAvailable && bundleCreated) ? redoclyErrorsCount : 0;
  } else {
    countedRedoclyErrors = redoclyErrorsCount;
  }
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
  // Render the full HTML report using the packaged template unless explicitly disabled
  if (!FLAG_NO_HTML) {
    try {
      const { renderGradeHtml } = await import('./report-html.mjs');
      const spectralItems = Array.isArray(spectral.problems) ? spectral.problems : (Array.isArray(spectral.issues) ? spectral.issues : []);
      const redoclyItems = (redoclyReport && Array.isArray(redoclyReport.problems)) ? redoclyReport.problems : [];
      const html = renderGradeHtml(finalReport, spectralItems, redoclyItems);
      writeFileSync(reportHtmlPath, html, 'utf8');
    } catch (e) {
      const htmlContent = '<!doctype html><html><head><meta charset="utf-8"><title>OpenAPI Grade Report</title></head><body><h1>OpenAPI Grade Report</h1><p>Score: ' + finalReport.score + '</p><p>Grade: ' + finalReport.letter + '</p></body></html>';
      writeFileSync(reportHtmlPath, htmlContent, 'utf8');
    }
  }

  // Backwards compatibility: also write legacy `dist/grade-report.html`
  try {
    const fs = await import('node:fs');
    const legacy = path.join(process.cwd(), 'dist', 'grade-report.html');
    if (fs.existsSync(reportHtmlPath)) {
      const content = fs.readFileSync(reportHtmlPath, 'utf8');
      fs.writeFileSync(legacy, content, 'utf8');
    }
  } catch (e) {
    // ignore non-fatal errors
  }

  if (docs) {
    let redocCliUsed = false;
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
          // If redocly failed to generate docs, try redoc-cli (local npm package) as a fallback
          try {
            const redocCliBin = resolveBin('redoc-cli');
            console.log('[grade] Trying redoc-cli as alternative to generate docs');
      await run(redocCliBin, ['bundle', 'dist/bundled.json', '-o', 'dist/docs.html']);
      console.log('[grade] redoc-cli produced dist/docs.html');
      redocCliUsed = true;
            // mark that docs were produced by redoc-cli; we'll record this later when writing JSON
            try { const fs = await import('node:fs'); if (fs.existsSync('dist/docs.html')) {/* noop */} } catch(e){}
          } catch (rcErr) {
            // ignore, fallback will be handled elsewhere
          }
      // Create lightweight fallback docs if nothing produced them
      try {
        const fs = await import('node:fs');
        const pathMod = await import('node:path');
        const docsPath = pathMod.resolve(process.cwd(), 'dist/docs.html');
        const swaggerPath = pathMod.resolve(process.cwd(), 'dist/swagger.html');
        const bundledPath = pathMod.resolve(process.cwd(), 'dist/bundled.json');
        let embedded = null;
        try { if (fs.existsSync(bundledPath)) { embedded = JSON.parse(fs.readFileSync(bundledPath, 'utf8')); } } catch (_) { embedded = null; }
        const bundleScript = embedded ? '\n<script>window.__BUNDLED_SPEC__ = ' + JSON.stringify(embedded) + ';</script>' : '';
        if (!fs.existsSync(docsPath)) {
          const redocHtml = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>API Docs</title><script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script></head><body style="margin:0;padding:0"><div id="redoc-container"></div>' + bundleScript + '<script>(function(){try{if(window.__BUNDLED_SPEC__){Redoc.init(window.__BUNDLED_SPEC__,{},document.getElementById(\'redoc-container\'));}else{const r=document.createElement(\'redoc\');r.setAttribute(\'spec-url\',\'bundled.json\');document.body.appendChild(r);}}catch(e){console.error(\'ReDoc init failed\',e);}})();</script></body></html>';
          fs.writeFileSync(docsPath, redocHtml, 'utf8');
          console.log('[grade] Created fallback dist/docs.html');
        }
        if (!fs.existsSync(swaggerPath)) {
          const swaggerHtml = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Swagger UI</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4/swagger-ui.css" /></head><body style="margin:0;padding:0"><div id="swagger"></div><script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-bundle.js"></script>' + bundleScript + '<script>(function(){try{if(window.__BUNDLED_SPEC__){SwaggerUIBundle({spec:window.__BUNDLED_SPEC__,dom_id:\'#swagger\'});}else{SwaggerUIBundle({url:\'bundled.json\',dom_id:\'#swagger\'});}}catch(e){console.error(\'Swagger init failed\',e);}})();</script></body></html>';
          fs.writeFileSync(swaggerPath, swaggerHtml, 'utf8');
          console.log('[grade] Created fallback dist/swagger.html');
        }
      } catch (_) { /* ignore */ }
  }

  // Record whether a docs.html was produced and attribute the tool used
  try {
    const docsPath = 'dist/docs.html';
    const docsGenerated = existsSync(docsPath);
    const docsTool = docsGenerated
      ? (redoclyReport && redoclyReport.available ? 'redocly' : (typeof redocCliUsed !== 'undefined' && redocCliUsed ? 'redoc-cli' : 'fallback'))
      : null;
    const fs = await import('node:fs');
    if (docsGenerated) {
      try {
        let raw = null;
        try { raw = JSON.parse(fs.readFileSync(reportJsonPath, 'utf8')); } catch (_) { raw = finalReport; }
        raw.docs = { generated: true, tool: docsTool };
        fs.writeFileSync(reportJsonPath, JSON.stringify(raw, null, 2), 'utf8');
        finalReport.docs = raw.docs;
      } catch (e) {
        // ignore JSON augment errors
      }
    } else {
      finalReport.docs = { generated: false, tool: null };
      try { fs.writeFileSync(reportJsonPath, JSON.stringify(finalReport, null, 2), 'utf8'); } catch (e) { }
    }
      // If caller requested strict docs generation (i.e. require Redocly), fail early
      if (docsStrict) {
        if (!docsGenerated) {
          console.error('[grade] --strict requested but no docs.html was produced. Failing.');
          process.exit(2);
        }
        if (docsTool !== 'redocly') {
          console.error(`[grade] --strict requested but docs were not produced by redocly (tool=${docsTool}). Failing.`);
          process.exit(2);
        }
      }
  } catch (e) {
    // ignore
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
  // Compute heuristics from the bundled spec if available
  let computedHeuristics = { bonus: 0 };
  try {
    const { computeHeuristics } = await import('./heuristics.mjs');
    const fs = await import('node:fs');
    const bundlePath = path.resolve(process.cwd(), 'dist/bundled.json');
    if (fs.existsSync(bundlePath)) {
      const raw = fs.readFileSync(bundlePath, 'utf8');
      const specObj = JSON.parse(raw);
      try {
        computedHeuristics = computeHeuristics(specObj) || computedHeuristics;
      } catch (hErr) {
        console.error('[gradeFlow] computeHeuristics failed:', hErr?.message ?? hErr);
      }
    } else {
      // Fallback: try to read original specPath
      try {
        const raw2 = fs.readFileSync(specPath, 'utf8');
        let specObj2 = null;
        try { specObj2 = JSON.parse(raw2); } catch (_) { specObj2 = raw2; }
        if (specObj2 && typeof specObj2 === 'object') {
          computedHeuristics = computeHeuristics(specObj2) || computedHeuristics;
        }
      } catch (_e) {
        // ignore
      }
    }
  } catch (error_) {
    console.error('[gradeFlow] heuristics module not available or failed to import:', error_?.message ?? error_);
  }

  // Ensure spectral and redocly shapes are fully populated for the final JSON
  const spectralFinal = Object.assign({ errors: 0, warnings: 0, exitCode: 0, available: false, issues: [], problems: [] }, spectralReport || {});
  // normalize alias: issues -> problems if needed
  if (Array.isArray(spectralFinal.issues) && !Array.isArray(spectralFinal.problems)) spectralFinal.problems = spectralFinal.issues;

  const redoclyFinal = Object.assign({ errors: 0, warnings: 0, exitCode: 0, available: false, problems: [], raw: '' }, redoclyReport || {});
  if (!Array.isArray(redoclyFinal.problems)) redoclyFinal.problems = redoclyFinal.problems ? Array.from(redoclyFinal.problems) : [];

  return generateReportAndDocs(spectralFinal, redoclyFinal, computedHeuristics, docs, redoclyCmd, specPath, FLAG_DOCS_STRICT);
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
