
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';

/** Execute a command and capture stdout/stderr, but DO NOT throw on non-zero exit. */
function execAllowFail(cmd, args) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: 'pipe', shell: true });
    let out = '', err = '';
    p.stdout.on('data', d => out += d.toString());
    p.stderr.on('data', d => err += d.toString());
    p.on('close', (code) => resolve({ code, out, err }));
  });
}

/** Try to parse JSON robustly (strips noise before/after the first JSON block) */
function safeJsonParse(text, fallbackLabel = 'payload') {
  if (!text) return null;
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  const first = Math.min(firstBrace === -1 ? Infinity : firstBrace, firstBracket === -1 ? Infinity : firstBracket);
  const last = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  const slice = (first !== Infinity && last >= first) ? text.slice(first, last + 1) : text;
  try {
    return JSON.parse(slice);
  } catch (e) {
    if (process.env.DEBUG_JSON === '1') {
      mkdirSync('dist', { recursive: true });
      writeFileSync(`dist/debug-${fallbackLabel}.txt`, text);
    }
    return null;
  }
}

function flattenOps(spec) {
  const paths = spec.paths || {};
  const methods = ['get','put','post','delete','patch','head','options','trace'];
  const ops = [];
  for (const p of Object.keys(paths)) {
    const item = paths[p] || {};
    for (const m of methods) {
      if (item[m]) ops.push({ path: p, method: m, op: item[m] });
    }
  }
  return ops;
}

function unique(arr) { return Array.from(new Set(arr)); }

function computeHeuristics(spec) {
  const ops = flattenOps(spec);
  const total = ops.length || 1;
  const hasTitle = !!(spec.info && spec.info.title);
  const hasVersion = !!(spec.info && spec.info.version);
  const hasServers = Array.isArray(spec.servers) && spec.servers.length > 0;
  const withSummary = ops.filter(o => !!o.op.summary).length / total;
  const withDesc = ops.filter(o => !!o.op.description).length / total;
  const opIds = ops.map(o => o.op.operationId).filter(Boolean);
  const uniqueOpIds = unique(opIds).length;
  const opIdUniqueRatio = opIds.length ? (uniqueOpIds / opIds.length) : 1;
  const with4xx = ops.filter(o => {
    const resps = (o.op.responses) ? Object.keys(o.op.responses) : [];
    return resps.some(code => /^4\d\d$/.test(code));
  }).length / total;
  const hasSecSchemes = !!(spec.components && spec.components.securitySchemes && Object.keys(spec.components.securitySchemes).length);

  let bonus = 0;
  if (hasTitle) bonus += 2;
  if (hasVersion) bonus += 2;
  if (hasServers) bonus += 1;
  if (withSummary >= 0.8) bonus += 5;
  if (withDesc >= 0.8) bonus += 5;
  if (with4xx >= 0.7) bonus += 5;
  if (hasSecSchemes) bonus += 3;
  if (bonus > 20) bonus = 20;

  return {
    totals: { operations: ops.length },
    ratios: { withSummary, withDesc, with4xx, opIdUniqueRatio },
    presence: { hasTitle, hasVersion, hasServers, hasSecSchemes },
    bonus
  };
}

function scoreToLetter(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 65) return 'C';
  if (score >= 50) return 'D';
  return 'E';
}

/**
 * Run bundle -> Spectral JSON -> (optional) Redocly JSON -> heuristics.
 * Returns an object; does not exit the process.
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
  const spectral = safeJsonParse(s.out, 'spectral-json') || [];
  const sErrors = spectral.filter(r => r.severity === 0 || r.severity === 'error').length;
  const sWarns  = spectral.filter(r => r.severity === 1 || r.severity === 'warn' || r.severity === 'warning').length;

  // 3) Optional Redocly lint JSON
  let redocly = null, rErrors = 0, rWarns = 0, rOut = null;
  if (process.env.SCHEMA_LINT === '1') {
    const r = await execAllowFail(redoclyCmd, ['lint', bundledPath, '--format', 'json']);
    rOut = r;
    redocly = safeJsonParse(r.out, 'redocly-json');
    if (redocly) {
      const items = Array.isArray(redocly.results) ? redocly.results
                   : Array.isArray(redocly.problems) ? redocly.problems
                   : Array.isArray(redocly) ? redocly
                   : [];
      for (const it of items) {
        const sev = (typeof it.severity === 'string' ? it.severity : it.severity === 0 ? 'error' : it.severity === 1 ? 'warn' : 'info');
        if (sev === 'error') rErrors++;
        else if (sev === 'warn' || sev === 'warning') rWarns++;
      }
    }
  }

  // 4) Heuristics
  const text = readFileSync(bundledPath, 'utf8');
  const spec = JSON.parse(text);
  const heur = computeHeuristics(spec);

  // 5) Scoring
  let score = 100;
  score -= Math.min(40, sErrors * 4);
  score -= Math.min(15, sWarns * 1);
  score -= Math.min(25, rErrors * 5);
  score -= Math.min(10, rWarns * 2);
  score += heur.bonus;
  if (score < 0) score = 0;
  if (score > 100) score = 100;
  const letter = scoreToLetter(score);

  const hadErrors = (sErrors > 0) || (rErrors > 0);
  const report = {
    bundledPath,
    spectral: { errors: sErrors, warnings: sWarns, exitCode: s.code },
    redocly: redocly ? { errors: rErrors, warnings: rWarns, exitCode: rOut?.code ?? 0 } : null,
    heuristics: heur,
    score, letter,
    hadErrors
  };

  writeFileSync(`${DIST_DIR}/grade-report.json`, JSON.stringify(report, null, 2));
  return { fatal: false, report };
}
