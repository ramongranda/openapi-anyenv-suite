import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Render a human-friendly HTML report for grading results.
 * @param {object} report - Summary produced in grade-report.json
 * @param {Array} spectralItems - Raw Spectral findings (array) if available
 * @param {Array} redoclyItems - Raw Redocly findings (array) if available
 * @returns {string} HTML string
 */
export function renderGradeHtml(report, spectralItems = [], redoclyItems = []) {
  const esc = (s) => {
    let str = String(s ?? '');
    str = str.replaceAll('&', '&amp;');
    str = str.replaceAll('<', '&lt;');
    str = str.replaceAll('>', '&gt;');
    return str;
  };
  const fmtPct = (n) => (typeof n === 'number') ? `${Math.round(n * 100)}%` : '';

  const { score, letter, spectral, redocly, heuristics } = report;
  const hasSpectral = Array.isArray(spectralItems) && spectralItems.length > 0;
  const hasRedocly = Array.isArray(redoclyItems) && redoclyItems.length > 0;

  const normSpectral = (hasSpectral ? spectralItems : []).map(it => {
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
    // Spectral paths like ["paths","/ping","get","responses","200"]
    const path = Array.isArray(it.path) ? it.path.join('.') : (it.path ?? '');
    const range = it.range ? `${it.range.start?.line ?? ''}:${it.range.start?.character ?? ''}` : '';
    return { severity: sev, code: it.code, message: it.message, path, where: range };
  });

  const normRedocly = (hasRedocly ? redoclyItems : []).map(it => {
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
    const path = Array.isArray(it.location?.[0]?.path) ? it.location[0].path.join('.') : (it.path ?? '');
    return { severity: sev, code: it.ruleId || it.code, message: it.message, path, where: '' };
  });

  const rows = (arr) => arr.map(r => `
      <tr class="sev-${esc(r.severity)}">
        <td>${esc(r.severity)}</td>
        <td>${esc(r.code ?? '')}</td>
        <td>${esc(r.message ?? '')}</td>
        <td>${esc(r.path ?? '')}</td>
        <td>${esc(r.where ?? '')}</td>
      </tr>`).join('');

  const heur = heuristics || {};
  const ratios = heur.ratios || {};
  const presence = heur.presence || {};

  // Build sections using external Tailwind template
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const templatePath = path.join(__dirname, '..', 'templates', 'grade-report.html');
  let html = readFileSync(templatePath, 'utf8');

  const row = (r) => `
    <tr class="border-b border-slate-700 sev-${esc(r.severity)}">
      <td class="align-top px-2 py-1 ${r.severity === 'error' ? 'border-l-4 border-rose-500' : r.severity?.toString().startsWith('warn') ? 'border-l-4 border-amber-500' : ''}"><span class="text-xs uppercase">${esc(r.severity)}</span></td>
      <td class="align-top px-2 py-1 text-slate-300">${esc(r.code ?? '')}</td>
      <td class="align-top px-2 py-1">${esc(r.message ?? '')}</td>
      <td class="align-top px-2 py-1 text-slate-300">${esc(r.path ?? '')}</td>
      <td class="align-top px-2 py-1 text-slate-300">${esc(r.where ?? '')}</td>
    </tr>`;

  const spectralRows = normSpectral.map((r) => row(r)).join('');
  const redoclyRows = normRedocly.map((r) => row(r)).join('');

  const spectralSection = spectralRows
    ? `
      <section class="bg-slate-800/80 border border-slate-700 rounded-lg p-4 mt-4">
        <h2 class="text-sm text-slate-300 mb-2">Spectral Findings</h2>
        <p class="text-xs text-slate-400 mb-2">${esc(spectral?.errors ?? 0)} errors, ${esc(spectral?.warnings ?? 0)} warnings</p>
        <div class="max-h-[420px] overflow-auto">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-slate-900">
              <tr class="text-left">
                <th class="px-2 py-1">Severity</th>
                <th class="px-2 py-1">Code</th>
                <th class="px-2 py-1">Message</th>
                <th class="px-2 py-1">Path</th>
                <th class="px-2 py-1">Where</th>
              </tr>
            </thead>
            <tbody>
              ${spectralRows}
            </tbody>
          </table>
        </div>
      </section>`
    : '';

  const redoclySection = redoclyRows
    ? `
      <section class="bg-slate-800/80 border border-slate-700 rounded-lg p-4 mt-4">
        <h2 class="text-sm text-slate-300 mb-2">Redocly Findings</h2>
        <p class="text-xs text-slate-400 mb-2">${esc(redocly?.errors ?? 0)} errors, ${esc(redocly?.warnings ?? 0)} warnings</p>
        <div class="max-h-[420px] overflow-auto">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-slate-900">
              <tr class="text-left">
                <th class="px-2 py-1">Severity</th>
                <th class="px-2 py-1">Rule</th>
                <th class="px-2 py-1">Message</th>
                <th class="px-2 py-1">Path</th>
                <th class="px-2 py-1">Where</th>
              </tr>
            </thead>
            <tbody>
              ${redoclyRows}
            </tbody>
          </table>
        </div>
      </section>`
    : '';

  const rep = (k, v) => (html = html.replaceAll(`{{${k}}}`, String(v)));
  rep('score', esc(score));
  rep('letter', esc(letter));
  rep('spectralErrors', esc(spectral?.errors ?? 0));
  rep('spectralWarnings', esc(spectral?.warnings ?? 0));
  rep('redoclyErrors', esc(redocly?.errors ?? 0));
  rep('redoclyWarnings', esc(redocly?.warnings ?? 0));
  rep('operations', esc(heur?.totals?.operations ?? 0));
  rep('summaryPct', fmtPct(ratios.withSummary));
  rep('descPct', fmtPct(ratios.withDesc));
  rep('with4xxPct', fmtPct(ratios.with4xx));
  rep('opIdUniquePct', fmtPct(ratios.opIdUniqueRatio));
  rep('hasTitle', presence.hasTitle ? 'Yes' : 'No');
  rep('hasVersion', presence.hasVersion ? 'Yes' : 'No');
  rep('hasServers', presence.hasServers ? 'Yes' : 'No');
  rep('hasSecSchemes', presence.hasSecSchemes ? 'Yes' : 'No');
  rep('bonus', esc(heur?.bonus ?? 0));

  html = html.replace('{{SPECTRAL_SECTION}}', spectralSection);
  html = html.replace('{{REDOCLY_SECTION}}', redoclySection);

  return html;
}
