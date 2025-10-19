import { readFileSync, existsSync } from 'node:fs';
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


  const heur = heuristics || {};
  const ratios = heur.ratios || {};
  const presence = heur.presence || {};

  // Build sections using external Tailwind template
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const templatePath = path.join(__dirname, '..', 'templates', 'grade-report.html');
  let html = readFileSync(templatePath, 'utf8');
  // Load AI prompt template and pre-fill scalar placeholders
  const aiTplPath = path.join(__dirname, '..', 'templates', 'ai-prompt.txt');
  let aiTpl = '';
  try { aiTpl = readFileSync(aiTplPath, 'utf8'); } catch {}

  const row = (r, src) => {
    let severityClass = '';
    if (r.severity === 'error') {
      severityClass = 'border-l-4 border-rose-500';
    } else if (r.severity?.toString().startsWith('warn')) {
      severityClass = 'border-l-4 border-amber-500';
    }
    return `
    <tr class="issue-row border-b border-slate-700 sev-${esc(r.severity)}" data-severity="${esc(r.severity)}" data-code="${esc(r.code ?? '')}" data-message="${esc(r.message ?? '')}" data-path="${esc(r.path ?? '')}" data-where="${esc(r.where ?? '')}" data-source="${esc(src)}">
      <td class="align-top px-2 py-1"><input type="checkbox" class="sel h-4 w-4" ${r.severity === 'error' || String(r.severity).startsWith('warn') ? 'checked' : ''} /></td>
      <td class="align-top px-2 py-1 ${severityClass}"><span class="text-xs uppercase">${esc(r.severity)}</span></td>
      <td class="align-top px-2 py-1 text-slate-300">${esc(r.code ?? '')}</td>
      <td class="align-top px-2 py-1">${esc(r.message ?? '')}</td>
      <td class="align-top px-2 py-1 text-slate-300">${esc(r.path ?? '')}</td>
      <td class="align-top px-2 py-1 text-slate-300">${esc(r.where ?? '')}</td>
    </tr>`;
  };

  const spectralRows = normSpectral.map((r) => row(r)).join('');
  const redoclyRows = normRedocly.map((r) => row(r)).join('');

  const spectralSection = spectralRows
    ? `
      <section class="bg-slate-800/80 border border-slate-700 rounded-lg mt-4" data-collapsible>
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 class="text-sm text-slate-300">Spectral Findings</h2>
          <button class="collapsible-toggle text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600">Collapse</button>
        </div>
        <div class="collapsible-content p-4">
        <p class="text-xs text-slate-400 mb-2">${esc(spectral?.errors ?? 0)} errors, ${esc(spectral?.warnings ?? 0)} warnings</p>
        <div class="max-h-[420px] overflow-auto">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-slate-900">
              <tr class="text-left">
                <th class="px-2 py-1">Select</th>
                <th class="px-2 py-1">Severity</th>
                <th class="px-2 py-1">Code</th>
                <th class="px-2 py-1">Message</th>
                <th class="px-2 py-1">Path</th>
                <th class="px-2 py-1">Where</th>
              </tr>
            </thead>
            <tbody>
              ${normSpectral.map((r) => row(r,'spectral')).join('')}
            </tbody>
          </table>
        </div>
        </div>
      </section>`
    : '';

  const redoclySection = redoclyRows
    ? `
      <section class="bg-slate-800/80 border border-slate-700 rounded-lg mt-4" data-collapsible>
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 class="text-sm text-slate-300">Redocly Findings</h2>
          <button class="collapsible-toggle text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600">Collapse</button>
        </div>
        <div class="collapsible-content p-4">
        <p class="text-xs text-slate-400 mb-2">${esc(redocly?.errors ?? 0)} errors, ${esc(redocly?.warnings ?? 0)} warnings</p>
        <div class="max-h-[420px] overflow-auto">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-slate-900">
              <tr class="text-left">
                <th class="px-2 py-1">Select</th>
                <th class="px-2 py-1">Severity</th>
                <th class="px-2 py-1">Rule</th>
                <th class="px-2 py-1">Message</th>
                <th class="px-2 py-1">Path</th>
                <th class="px-2 py-1">Where</th>
              </tr>
            </thead>
            <tbody>
              ${normRedocly.map((r) => row(r,'redocly')).join('')}
            </tbody>
          </table>
        </div>
        </div>
      </section>`
    : '';

  const rep = (k, v) => (html = html.replaceAll(`{{${k}}}`, String(v)));
  const repPrompt = (k, v) => (aiTpl = aiTpl.replaceAll(`{{${k}}}`, String(v)));
  // Logo handling: REPORT_LOGO (URL or local path) or GRADE_LOGO_URL
  const logoEnv = process.env.REPORT_LOGO || process.env.GRADE_LOGO_URL || '';
  let logoUrl = '';
  if (logoEnv) {
    if (/^https?:\/\//i.test(logoEnv)) {
      logoUrl = logoEnv;
    } else {
      try {
        const p = path.isAbsolute(logoEnv) ? logoEnv : path.join(process.cwd(), logoEnv);
        if (existsSync(p)) {
          const buf = readFileSync(p);
          const ext = path.extname(p).toLowerCase();
          let mime;
          if (ext === '.svg') {
            mime = 'image/svg+xml';
          } else if (ext === '.jpg' || ext === '.jpeg') {
            mime = 'image/jpeg';
          } else {
            mime = 'image/png';
          }
          logoUrl = `data:${mime};base64,${buf.toString('base64')}`;
        }
      } catch {}
    }
  }
  // Fallback to bundled default logo if none provided
  if (!logoUrl) {
    const defaultLogo = path.join(__dirname, '..', 'assets', 'logo-oas.png');
    try {
      if (existsSync(defaultLogo)) {
        const buf = readFileSync(defaultLogo);
        logoUrl = `data:image/png;base64,${buf.toString('base64')}`;
      }
    } catch {}
  }

  rep('logoUrl', logoUrl || '');
  rep('logoClass', logoUrl ? '' : 'hidden');
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

  // Fill same scalars in prompt template
  repPrompt('score', esc(score));
  repPrompt('letter', esc(letter));
  repPrompt('operations', esc(heur?.totals?.operations ?? 0));
  repPrompt('summaryPct', fmtPct(ratios.withSummary));
  repPrompt('descPct', fmtPct(ratios.withDesc));
  repPrompt('with4xxPct', fmtPct(ratios.with4xx));
  repPrompt('opIdUniquePct', fmtPct(ratios.opIdUniqueRatio));
  repPrompt('hasTitle', presence.hasTitle ? 'Yes' : 'No');
  repPrompt('hasVersion', presence.hasVersion ? 'Yes' : 'No');
  repPrompt('hasServers', presence.hasServers ? 'Yes' : 'No');
  repPrompt('hasSecSchemes', presence.hasSecSchemes ? 'Yes' : 'No');

  html = html.replace('{{SPECTRAL_SECTION}}', spectralSection);
  html = html.replace('{{REDOCLY_SECTION}}', redoclySection);
  // Inject prompt template tag
  html = html.replace('{{AI_PROMPT}}', `<script id="aiPromptTemplate" type="text/plain">${aiTpl}</script>`);

  return html;
}
