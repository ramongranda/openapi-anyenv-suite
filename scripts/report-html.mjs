import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Render a human-friendly HTML report for grading results.
 *
 * Responsibilities:
 * - Normalize incoming Spectral/Redocly items to a common shape used by the
 *   HTML template.
 * - Embed a logo (from env or bundled asset) as a data URL when appropriate.
 * - Fill placeholders in the `templates/grade-report.html` file and inject
 *   normalized findings.
 *
 * @param {object} report - Summary produced in grade-report.json
 * @param {Array} spectralItems - Raw Spectral findings (array) if available
 * @param {Array} redoclyItems - Raw Redocly findings (array) if available
 * @returns {string} HTML string
 */
export function renderGradeHtml(report, spectralItems = [], redoclyItems = []) {
  const esc = (s) => {
    let str = String(s ?? "");
    str = str.replaceAll("&", "&amp;");
    str = str.replaceAll("<", "&lt;");
    str = str.replaceAll(">", "&gt;");
    return str;
  };
  const fmtPct = (n) =>
    typeof n === "number" ? `${Math.round(n * 100)}%` : "";

  const { score, letter, spectral, redocly, heuristics } = report;
  const hasSpectral = Array.isArray(spectralItems) && spectralItems.length > 0;
  const hasRedocly = Array.isArray(redoclyItems) && redoclyItems.length > 0;

  const normSpectral = (hasSpectral ? spectralItems : []).map((it) => {
    let sev;
    if (typeof it.severity === "string") {
      sev = it.severity;
    } else if (it.severity === 0) {
      sev = "error";
    } else if (it.severity === 1) {
      sev = "warn";
    } else {
      sev = "info";
    }
    // Spectral paths like ["paths","/ping","get","responses","200"]
    let path = Array.isArray(it.path) ? it.path.join(".") : it.path ?? "";
    if (typeof path === 'string' && path.startsWith('paths.')) path = path.slice(6);
    const range = it.range
      ? `${it.range.start?.line ?? ""}:${it.range.start?.character ?? ""}`
      : "";
    return {
      severity: sev,
      code: it.code,
      message: it.message,
      path,
      where: range,
    };
  });

  const normRedocly = (hasRedocly ? redoclyItems : []).map((it) => {
    let sev;
    if (typeof it.severity === "string") {
      sev = it.severity;
    } else if (it.severity === 0) {
      sev = "error";
    } else if (it.severity === 1) {
      sev = "warn";
    } else {
      sev = "info";
    }
    let path = Array.isArray(it.location?.[0]?.path)
      ? it.location[0].path.join(".")
      : it.path ?? "";
    if (typeof path === 'string' && path.startsWith('paths.')) path = path.slice(6);
    return {
      severity: sev,
      code: it.ruleId || it.code,
      message: it.message,
      path,
      where: "",
    };
  });

  const heur = heuristics || {};
  const ratios = heur.ratios || {};
  const presence = heur.presence || {};

  // Build sections using external Tailwind template
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "grade-report.html"
  );
  let html = readFileSync(templatePath, "utf8");
  // Load AI prompt template and pre-fill scalar placeholders
  const aiTplPath = path.join(__dirname, "..", "templates", "ai-prompt.txt");
  let aiTpl = "";
  try {
    aiTpl = readFileSync(aiTplPath, "utf8");
  } catch {}

  // Build an HTML table row for a normalized finding.
  // `src` is a string indicating the originating linter (e.g. 'spectral').
  const row = (r, src) => {
    let severityClass = "";
    if (r.severity === "error") {
      severityClass = "border-l-4 border-rose-500";
    } else if (r.severity?.toString().startsWith("warn")) {
      severityClass = "border-l-4 border-amber-500";
    }
    // add a severity class on the row for compact-mode hiding, and render
    // a small colored badge (pill) inside the severity cell
    let sevClass = '';
    let tdSeverityClass = 'align-top px-3 py-2';
  let badgeClass = 'inline-block text-xs font-semibold px-2 py-0.5 rounded-full w-20 text-center';
    const sll = String(r.severity || '').toLowerCase();
    if (sll.startsWith('err')) { sevClass = 'sev-error'; badgeClass += ' bg-rose-600 text-rose-50'; }
    else if (sll.startsWith('warn')) { sevClass = 'sev-warning'; badgeClass += ' bg-amber-500 text-amber-900'; }
    else { sevClass = 'sev-info'; badgeClass += ' bg-sky-500 text-white'; }
    return `
    <tr class="issue-row ${sevClass} odd:bg-slate-800/60" data-severity="${esc(
      r.severity
    )}" data-code="${esc(r.code ?? "")}" data-message="${esc(
      r.message ?? ""
    )}" data-path="${esc(r.path ?? "")}" data-source="${esc(src)}">
      <td class="align-top px-3 py-2"><input type="checkbox" class="sel h-4 w-4" ${
        r.severity === "error" || String(r.severity).startsWith("warn")
          ? "checked"
          : ""
      } /></td>
      <td class="${tdSeverityClass} ${severityClass}"><span class="${badgeClass}">${esc(
      r.severity
    )}</span></td>
      <td class="align-top px-3 py-2 text-slate-300 font-mono">${esc(r.code ?? "")}</td>
      <td class="align-top px-3 py-2">${esc(r.message ?? "")}</td>
      <td class="align-top px-3 py-2 text-slate-300 whitespace-normal break-all"><code class="text-xs whitespace-normal break-all">${esc(r.path ?? "")}</code></td>
    </tr>`;
  };

  const spectralRows = normSpectral.map((r) => row(r)).join("");
  const redoclyRows = normRedocly.map((r) => row(r)).join("");

  const spectralSection = spectralRows
    ? `
      <div class="p-4">
        <div class="overflow-visible">
          <table class="min-w-full text-sm table-auto border-collapse divide-y divide-slate-700">
            <thead class="sticky top-0 bg-slate-900">
              <tr class="text-left">
                <th class="px-3 py-2 text-slate-300">Select</th>
                <th class="px-3 py-2 text-slate-300">Severity</th>
                <th class="px-3 py-2 text-slate-300">Code</th>
                <th class="px-3 py-2 text-slate-300">Message</th>
                <th class="px-3 py-2 text-slate-300">Path</th>
                <th class="px-3 py-2 text-slate-300">Where</th>
              </tr>
            </thead>
            <tbody>
              ${normSpectral.map((r) => row(r, "spectral")).join("")}
            </tbody>
          </table>
        </div>
      </div>`
    : "";

  const redoclySection = redoclyRows
    ? `
      <div class="p-4">
        <div class="overflow-visible">
          <table class="min-w-full text-sm table-auto border-collapse divide-y divide-slate-700">
            <thead class="sticky top-0 bg-slate-900">
              <tr class="text-left">
                <th class="px-3 py-2 text-slate-300">Select</th>
                <th class="px-3 py-2 text-slate-300">Severity</th>
                <th class="px-3 py-2 text-slate-300">Rule</th>
                <th class="px-3 py-2 text-slate-300">Message</th>
                <th class="px-3 py-2 text-slate-300">Path</th>
                <th class="px-3 py-2 text-slate-300">Where</th>
              </tr>
            </thead>
            <tbody>
              ${normRedocly.map((r) => row(r, "redocly")).join("")}
            </tbody>
          </table>
        </div>
      </div>`
    : "";

  const rep = (k, v) => (html = html.replaceAll(`{{${k}}}`, String(v)));
  const repPrompt = (k, v) => (aiTpl = aiTpl.replaceAll(`{{${k}}}`, String(v)));
  // Logo handling: REPORT_LOGO (URL or local path) or GRADE_LOGO_URL
  const logoEnv = process.env.REPORT_LOGO || process.env.GRADE_LOGO_URL || "";
  let logoUrl = "";
  if (logoEnv) {
    if (/^https?:\/\//i.test(logoEnv)) {
      logoUrl = logoEnv;
    } else {
      try {
        const p = path.isAbsolute(logoEnv)
          ? logoEnv
          : path.join(process.cwd(), logoEnv);
        if (existsSync(p)) {
          const buf = readFileSync(p);
          const ext = path.extname(p).toLowerCase();
          let mime;
          if (ext === ".svg") {
            mime = "image/svg+xml";
          } else if (ext === ".jpg" || ext === ".jpeg") {
            mime = "image/jpeg";
          } else {
            mime = "image/png";
          }
          logoUrl = `data:${mime};base64,${buf.toString("base64")}`;
        }
      } catch {}
    }
  }
  // Fallback to bundled default logo if none provided
  if (!logoUrl) {
    const defaultLogo = path.join(__dirname, "..", "assets", "logo-oas.png");
    try {
      if (existsSync(defaultLogo)) {
        const buf = readFileSync(defaultLogo);
        logoUrl = `data:image/png;base64,${buf.toString("base64")}`;
      }
    } catch {}
  }

  rep("logoUrl", logoUrl || "");
  rep("logoClass", logoUrl ? "" : "hidden");
  rep("year", new Date().getFullYear());
  rep("score", esc(score));
  rep("letter", esc(letter));
  // Compute grade color classes for the letter pill
  const letterUpper = String(letter || "").toUpperCase();
  let gradeBg = "bg-sky-900/60";
  let gradeText = "text-sky-300";
  if (letterUpper === "A") {
    gradeBg = "bg-emerald-900/60";
    gradeText = "text-emerald-300";
  } else if (letterUpper === "B") {
    gradeBg = "bg-sky-900/60";
    gradeText = "text-sky-300";
  } else if (letterUpper === "C") {
    gradeBg = "bg-amber-900/60";
    gradeText = "text-amber-300";
  } else if (letterUpper === "D") {
    gradeBg = "bg-orange-900/60";
    gradeText = "text-orange-300";
  } else if (letterUpper === "E" || letterUpper === "F") {
    gradeBg = "bg-rose-900/60";
    gradeText = "text-rose-300";
  }
  rep("gradeBg", gradeBg);
  rep("gradeText", gradeText);
  rep("spectralErrors", esc(spectral?.errors ?? 0));
  rep("spectralWarnings", esc(spectral?.warnings ?? 0));
  rep("redoclyErrors", esc(redocly?.errors ?? 0));
  rep("redoclyWarnings", esc(redocly?.warnings ?? 0));
  // Docs badge (which tool produced docs.html)
  const docsMeta = report.docs || { generated: false, tool: null };
  let docsBadge = '';
  if (docsMeta.generated) {
    if (docsMeta.tool === 'redocly') docsBadge = '<span class="ml-2 inline-block text-xs px-2 py-0.5 rounded bg-sky-600 text-white">Redocly</span>';
    else if (docsMeta.tool === 'redoc-cli') docsBadge = '<span class="ml-2 inline-block text-xs px-2 py-0.5 rounded bg-indigo-600 text-white">redoc-cli</span>';
    else docsBadge = '<span class="ml-2 inline-block text-xs px-2 py-0.5 rounded bg-amber-600 text-black">Fallback</span>';
  } else {
    docsBadge = '<span class="ml-2 inline-block text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">No docs</span>';
  }
  rep('docsBadge', docsBadge);
  rep("operations", esc(heur?.totals?.operations ?? 0));
  rep("summaryPct", fmtPct(ratios.withSummary));
  rep("descPct", fmtPct(ratios.withDesc));
  rep("with4xxPct", fmtPct(ratios.with4xx));
  rep("opIdUniquePct", fmtPct(ratios.opIdUniqueRatio));
  rep("hasTitle", presence.hasTitle ? "Yes" : "No");
  rep("hasVersion", presence.hasVersion ? "Yes" : "No");
  rep("hasServers", presence.hasServers ? "Yes" : "No");
  rep("hasSecSchemes", presence.hasSecSchemes ? "Yes" : "No");
  rep("bonus", esc(heur?.bonus ?? 0));

  // Fill same scalars in prompt template
  repPrompt("score", esc(score));
  repPrompt("letter", esc(letter));
  repPrompt("operations", esc(heur?.totals?.operations ?? 0));
  repPrompt("summaryPct", fmtPct(ratios.withSummary));
  repPrompt("descPct", fmtPct(ratios.withDesc));
  repPrompt("with4xxPct", fmtPct(ratios.with4xx));
  repPrompt("opIdUniquePct", fmtPct(ratios.opIdUniqueRatio));
  repPrompt("hasTitle", presence.hasTitle ? "Yes" : "No");
  repPrompt("hasVersion", presence.hasVersion ? "Yes" : "No");
  repPrompt("hasServers", presence.hasServers ? "Yes" : "No");
  repPrompt("hasSecSchemes", presence.hasSecSchemes ? "Yes" : "No");

  html = html.replace("{{SPECTRAL_SECTION}}", spectralSection);
  html = html.replace("{{REDOCLY_SECTION}}", redoclySection);
  // Inject prompt template tag
  html = html.replace(
    "{{AI_PROMPT}}",
    `<script id="aiPromptTemplate" type="text/plain">${aiTpl}</script>`
  );

  return html;
}
