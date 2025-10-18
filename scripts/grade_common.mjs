import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execAllowFail } from './process.mjs';
import { safeJsonParse } from './parser.mjs';
import { computeHeuristics } from './heuristics.mjs';
import { scoreToLetter, calculateScore } from './scoring.mjs';

/**
 * Orchestrate the grading flow: bundle -> Spectral (JSON) -> optional Redocly (JSON) -> heuristics -> scoring.
 * Does not terminate the process; returns a fatal flag and structured report.
 *
 * @param {{spectralCmd:string, redoclyCmd:string, specPath:string}} params - Commands and spec path.
 * @returns {Promise<{fatal:boolean, message?:string, report?:any}>}
 */
export async function gradeFlow({ spectralCmd, redoclyCmd, specPath }) {
  const DIST_DIR = 'dist';
  mkdirSync(DIST_DIR, { recursive: true });
  const bundledPath = `${DIST_DIR}/bundled.json`;

  // 1) Bundle
  const b = await execAllowFail(redoclyCmd, ['bundle', specPath, '--output', bundledPath]);
  if (b.code !== 0) {
    return { fatal: true, message: `redocly bundle exited ${b.code}.\n${b.err || b.out}` };
  }

  // 2) Spectral JSON (we accept non-zero exit to still parse findings)
  const s = await execAllowFail(spectralCmd, ['lint', bundledPath, '--ruleset', '.spectral.yaml', '--format', 'json', '--fail-severity', 'error', '--quiet']);
  const spectralReport = safeJsonParse(s.out, 'spectral-json') || [];
  const spectralErrors = spectralReport.filter(r => r.severity === 0 || r.severity === 'error').length;
  const spectralWarnings  = spectralReport.filter(r => r.severity === 1 || r.severity === 'warn' || r.severity === 'warning').length;

  // 3) Optional Redocly lint JSON
  let redoclyReport = null, redoclyErrors = 0, redoclyWarnings = 0, rOut = null;
  if (process.env.SCHEMA_LINT === '1') {
    const r = await execAllowFail(redoclyCmd, ['lint', bundledPath, '--format', 'json']);
    rOut = r;
    const parsedRedocly = safeJsonParse(r.out, 'redocly-json');
    if (parsedRedocly) {
      let items = [];
      if (Array.isArray(parsedRedocly.results)) {
        items = parsedRedocly.results;
      } else if (Array.isArray(parsedRedocly.problems)) {
        items = parsedRedocly.problems;
      } else if (Array.isArray(parsedRedocly)) {
        items = parsedRedocly;
      }
      for (const it of items) {
        let sev;
        if (typeof it.severity === 'string') {
          sev = it.severity;
        } else if (it.severity === 0) {
          sev = 'error';
        } else if (it.severity === 1) {
          sev = 'warn';
        } else {
          sev = 'info';
        }
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
  const report = {
    bundledPath,
    spectral,
    redocly: redoclyReport,
    heuristics,
    score, letter,
    hadErrors
  };

  writeFileSync(`${DIST_DIR}/grade-report.json`, JSON.stringify(report, null, 2));
  return { fatal: false, report };
}
