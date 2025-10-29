#!/usr/bin/env node
// Canonical report generator. Prefer 'pnpm run check -- <spec> --docs' but
// this script remains a direct entrypoint. Print a short advisory message
// to encourage migrating to `check`.
console.error(
  "ADVISORY: prefer `pnpm run check -- <spec> [--docs]`. This script will prefer an existing dist/grade-report.json produced by `check`."
);
import { existsSync, writeFileSync, cpSync } from "node:fs";
import { run, ensureDir } from "./common-utils.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    "Usage: pnpm run report:static -- <path/to/openapi.yaml> [--regenerate]"
  );
  process.exit(2);
}
const file = args[0];
let port = 8080;
let generateOnly = false;
let regenerate = false;
for (let i = 1; i < args.length; i++) {
  if (args[i] === "--port" && args[i + 1])
    port = Number.parseInt(args[i + 1], 10) || 8080;
  if (args[i] === "--generate-only" || args[i] === "--no-serve")
    generateOnly = true;
  if (args[i] === "--regenerate" || args[i] === "--force") regenerate = true;
}

ensureDir("dist");

try {
  console.log("Preparing grade report output in dist/");

  // Preferred flow: use an existing dist/grade-report.json produced by `pnpm run check`.
  // If missing or --regenerate is requested, invoke the canonical grade flow to produce it.
  const reportJsonPath = "dist/grade-report.json";
  // The main static report will be generated as `dist/index.html` so it can
  // be served directly as the site root. Keep JSON under dist/grade-report.json
  // for compatibility with existing tooling.
  const reportHtmlPath = "dist/index.html";
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const gradeScript = path.join(__dirname, "grade.mjs");

  if (!existsSync(reportJsonPath) || regenerate) {
    console.log(
      `${
        existsSync(reportJsonPath)
          ? "dist/grade-report.json present but regeneration requested"
          : "dist/grade-report.json not found"
      }, running check to (re)generate artifacts`
    );
    // Request docs generation as well so that dist/docs.html (Redocly) and swagger artifacts are created when possible.
    // grade.mjs will gracefully fallback if Redocly is not available.
    // Use pnpm to invoke the canonical `check` script so we always go through pnpm.
    // Forward --strict if present in this invocation
    const checkArgs = ["run", "check", "--", file, "--soft", "--docs"];
    if (args.includes("--strict")) checkArgs.push("--strict");
    // Run pnpm from the repository root (not the current working dir) so
    // the local package.json/package scripts are available even when the
    // caller invoked this script from a temp directory (tests spawn like that).
    await run("pnpm", checkArgs, { cwd: path.join(__dirname, "..") });
  } else {
    console.log(
      "Using existing dist/grade-report.json produced by `check` — skipping re-run."
    );
  }

  // Copy assets into dist/assets so the generated report is self-contained
  try {
    const assetsSrc = path.join(__dirname, "..", "assets");
    const assetsDest = path.join(process.cwd(), "dist", "assets");
    if (existsSync(assetsSrc)) {
      console.log("Copying assets to dist/assets/");
      // do not overwrite existing files if present (force: false)
      cpSync(assetsSrc, assetsDest, { recursive: true, force: false });
    }
  } catch (copyErr) {
    console.warn(
      "Could not copy assets to dist/assets:",
      String(copyErr?.message || copyErr)
    );
  }

  // Try to read JSON; build a minimal HTML summary if present
  let report = null;
  try {
    if (existsSync(reportJsonPath)) {
      const fsPromises = await import("node:fs/promises");
      report = JSON.parse(await fsPromises.readFile(reportJsonPath, "utf8"));
    }
  } catch (err) {
    console.error("Could not read dist/grade-report.json:", err.message || err);
  }

  // Ensure user-facing docs pages exist BEFORE rendering the template so links/badges
  // can reflect the presence of these files (they consume dist/bundled.json).
  try {
    const docsPathEarly = path.join(process.cwd(), "dist", "docs.html");
    const swaggerPathEarly = path.join(process.cwd(), "dist", "swagger.html");
    if (generateOnly || !existsSync(docsPathEarly)) {
      try {
        let embedded = null;
        if (existsSync(path.join(process.cwd(), "dist", "bundled.json"))) {
          try {
            embedded = JSON.parse(
              await (
                await import("node:fs/promises")
              ).readFile(
                path.join(process.cwd(), "dist", "bundled.json"),
                "utf8"
              )
            );
          } catch (e) {
            embedded = null;
          }
        }
        const bundleScript = embedded
          ? `\n<script>window.__BUNDLED_SPEC__ = ${JSON.stringify(
              embedded
            )};</script>`
          : "";
        const redocHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>API Docs</title><script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script></head><body style="margin:0;padding:0"><div id="redoc-container"></div>${bundleScript}<script> (function(){ try{ if(window.__BUNDLED_SPEC__){ Redoc.init(window.__BUNDLED_SPEC__, {}, document.getElementById('redoc-container')); } else { const r = document.createElement('redoc'); r.setAttribute('spec-url','bundled.json'); document.body.appendChild(r); } }catch(e){ console.error('ReDoc init failed', e); } })();</script></body></html>`;
        writeFileSync(docsPathEarly, redocHtml, "utf8");
        console.log("Created fallback dist/docs.html (ReDoc)");
      } catch (e) {
        console.warn("Could not create fallback docs.html:", e?.message || e);
      }
    }
    if (generateOnly || !existsSync(swaggerPathEarly)) {
      try {
        let embedded = null;
        if (existsSync(path.join(process.cwd(), "dist", "bundled.json"))) {
          try {
            embedded = JSON.parse(
              await (
                await import("node:fs/promises")
              ).readFile(
                path.join(process.cwd(), "dist", "bundled.json"),
                "utf8"
              )
            );
          } catch (e) {
            embedded = null;
          }
        }
        const bundleScript = embedded
          ? `\n<script>window.__BUNDLED_SPEC__ = ${JSON.stringify(
              embedded
            )};</script>`
          : "";
        const swaggerHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Swagger UI</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4/swagger-ui.css" /></head><body style="margin:0;padding:0"><div id="swagger"></div><script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-bundle.js"></script>${bundleScript}<script> (function(){ try{ if(window.__BUNDLED_SPEC__){ SwaggerUIBundle({ spec: window.__BUNDLED_SPEC__, dom_id: '#swagger' }); } else { SwaggerUIBundle({ url: 'bundled.json', dom_id: '#swagger' }); } }catch(e){ console.error('Swagger init failed', e); } })();</script></body></html>`;
        writeFileSync(swaggerPathEarly, swaggerHtml, "utf8");
        console.log("Created fallback dist/swagger.html (Swagger UI)");
      } catch (e) {
        console.warn(
          "Could not create fallback swagger.html:",
          e?.message || e
        );
      }
    }
  } catch (e) {
    console.warn(
      "Could not ensure early fallback docs/swagger pages:",
      e?.message || e
    );
  }

  if (!report) {
    console.log("No JSON report found; creating minimal HTML placeholder.");
    writeFileSync(
      reportHtmlPath,
      "<html><body><h1>OpenAPI Grade Report</h1><p>No JSON report available.</p></body></html>"
    );
  } else {
    // Prefer to render the nicer template if available
    const score = report.score ?? "N/A";
    const letter = report.letter ?? "N/A";
    // Normalize incoming report shape: use `problems` for both linters.
    const spectral = report.spectral ?? { errors: 0, warnings: 0 };
    // If older payload uses `issues`, normalize to `problems` and recalc counts.
    if (Array.isArray(spectral.issues) && !Array.isArray(spectral.problems)) {
      spectral.problems = spectral.issues;
    }
    if (Array.isArray(spectral.problems)) {
      // recompute errors/warnings from severity (spectral severity: 1 = error, 0 = warn/info)
      const errs = spectral.problems.filter(
        (p) => Number(p.severity) >= 1
      ).length;
      const warns = spectral.problems.filter(
        (p) => Number(p.severity) < 1
      ).length;
      spectral.errors = errs;
      spectral.warnings = warns;
    }

    const redocly = report.redocly ?? { errors: 0, warnings: 0, problems: [] };
    // Ensure redocly.problems exists and recompute counts according to severity strings
    if (Array.isArray(redocly.problems)) {
      const errs = redocly.problems.filter((p) =>
        String(p.severity || "")
          .toLowerCase()
          .startsWith("err")
      ).length;
      const warns = redocly.problems.filter((p) =>
        String(p.severity || "")
          .toLowerCase()
          .startsWith("warn")
      ).length;
      // If provided counts are missing or inconsistent, override with computed values
      redocly.errors = errs;
      redocly.warnings = warns;
    }
    const hadErrors = report.hadErrors ? "Yes" : "No";

    // helpers to safely embed text into HTML and data-attributes
    const escHtml = (s) =>
      String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    const escAttr = (s) => encodeURIComponent(String(s ?? ""));

    // Build readable lists for spectral issues and redocly problems (HTML fragments)
    let spectralSection = "";
    const sp = Array.isArray(spectral.problems)
      ? spectral.problems
      : Array.isArray(spectral.issues)
      ? spectral.issues
      : [];
    if (sp.length > 0) {
      spectralSection =
        `<div class="overflow-visible"><table class="min-w-full text-sm table-auto border-collapse divide-y divide-slate-700"><thead class="bg-slate-900"><tr class="text-left"><th class="px-3 py-2"></th><th class="px-3 py-2 text-slate-300">Severity</th><th class="px-3 py-2 text-slate-300">Code</th><th class="px-3 py-2 text-slate-300">Message</th><th class="px-3 py-2 text-slate-300">Location</th></tr></thead><tbody class="bg-transparent">` +
        sp
          .map((i) => {
            // Normalize severity to text
            let sev = "";
            try {
              const s = i.severity;
              if (typeof s === "string") sev = s;
              else if (Number(s) === 0) sev = "error";
              else if (Number(s) === 1) sev = "warning";
              else sev = String(s ?? "info");
            } catch (_) {
              sev = String(i.severity ?? "");
            }
            // severity class for the row (used for compact mode) and a
            // small badge inside the severity cell that receives the colored background.
            let sevClass = "";
            let tdBaseClass = "px-3 py-2";
            let badgeClass =
              "inline-block text-xs font-semibold px-2 py-0.5 rounded-full w-20 text-center";
            const sl = String(sev || "").toLowerCase();
            if (sl.startsWith("err")) {
              sevClass = "sev-error";
              badgeClass += " bg-rose-600 text-rose-50";
            } else if (sl.startsWith("warn")) {
              sevClass = "sev-warning";
              badgeClass += " bg-amber-500 text-amber-900";
            } else {
              sevClass = "sev-info";
              badgeClass += " bg-sky-500 text-white";
            }
            const code = String(i.code ?? i.rule ?? "rule");
            const msg = String(i.message ?? JSON.stringify(i));
            let locVal = i.path || i.location || i.range || i.source || "";
            if (Array.isArray(locVal)) { try { locVal = locVal.join('.'); } catch(_) { locVal = String(locVal); } }
            let loc = String(locVal);
            if (loc.startsWith('paths.')) loc = loc.slice(6);
            // Use encoded data-* attributes to avoid breaking HTML when values contain quotes
            return `<tr class="issue-row ${sevClass} odd:bg-slate-800/60" data-severity="${escAttr(
              sev
            )}" data-code="${escAttr(code)}" data-path="${escAttr(
              loc
            )}" data-message="${escAttr(
              msg
            )}"><td class="px-3 py-2"><input type="checkbox" class="sel" aria-label="Select issue"/></td><td class="${tdBaseClass}"><span class="${badgeClass}">${escHtml(
              sev
            )}</span></td><td class="px-3 py-2 font-mono">${escHtml(
              code
            )}</td><td class="px-3 py-2">${escHtml(
              msg
            )}</td><td class="px-3 py-2 whitespace-normal break-all"><code class="text-xs whitespace-normal break-all">${escHtml(loc)}</code></td></tr>`;
          })
          .join("") +
        `</tbody></table></div>`;
    } else {
      // If there are no spectral problems, render nothing to keep the static
      // report compact and avoid noisy 'No Spectral problems found' messages.
      spectralSection = "";
    }

    let redoclySection = "";
    if (Array.isArray(redocly.problems) && redocly.problems.length > 0) {
      redoclySection =
        `<div class="overflow-visible"><table class="min-w-full text-sm table-auto border-collapse divide-y divide-slate-700"><thead class="bg-slate-900"><tr class="text-left"><th class="px-3 py-2"></th><th class="px-3 py-2 text-slate-300">Severity</th><th class="px-3 py-2 text-slate-300">Code</th><th class="px-3 py-2 text-slate-300">Message</th><th class="px-3 py-2 text-slate-300">Location</th></tr></thead><tbody class="bg-transparent">` +
        redocly.problems
          .map((p) => {
            // Normalize severity
            let sev = "";
            try {
              const s = p.severity;
              if (typeof s === "string") sev = s;
              else if (Number(s) === 0) sev = "error";
              else if (Number(s) === 1) sev = "warning";
              else sev = String(s ?? "");
            } catch (_) {
              sev = String(p.severity ?? "");
            }
            const rule = String(p.ruleId ?? p.code ?? "problem");
            const msg = String(p.message ?? JSON.stringify(p));
            // Normalize location: prefer a human-friendly pointer when available
            let loc = "";
            try {
              if (Array.isArray(p.location) && p.location.length) {
                const first = p.location[0];
                if (first && first.pointer) loc = String(first.pointer);
                else loc = JSON.stringify(p.location);
              } else if (p.pointer) {
                loc = String(p.pointer);
              } else if (p.location && typeof p.location === "string") {
                loc = String(p.location);
              } else if (p.path) {
                loc = JSON.stringify(p.path);
              } else {
                loc = "";
              }
            } catch (e) {
              loc = JSON.stringify(p.location || p.path || "");
            }
            // If loc looks like a JSON Pointer (may start with '#' or '/'),
            // decode `~1`->`/` and `~0`->`~`, decode URI escapes and
            // collapse duplicate slashes so it appears as a readable path.
            try {
              const isPointer =
                typeof loc === "string" &&
                (loc.startsWith("#") ||
                  loc.startsWith("/") ||
                  loc.includes("~1") ||
                  loc.includes("~0"));
              if (isPointer) {
                let pstr = String(loc || "");
                // remove leading '#'
                if (pstr.startsWith("#")) pstr = pstr.slice(1);
                try {
                  pstr = decodeURIComponent(pstr);
                } catch (e) {}
                pstr = pstr.replaceAll("~1", "/").replaceAll("~0", "~");
                if (!pstr.startsWith("/")) pstr = "/" + pstr;
                // collapse duplicated slashes into single
                pstr = pstr.replace(/\/+/g, "/");
                // normalize '/paths//pets' -> '/paths/pets'
                pstr = pstr.replace(/\/+/g, "/");
                // final cleanup: remove trailing slash unless it's root
                if (pstr.length > 1 && pstr.endsWith("/"))
                  pstr = pstr.slice(0, -1);
                loc = pstr;
              }
            } catch (e) {}
            const sl = String(sev || "").toLowerCase();
            let sevClass = "sev-info";
            let badgeClass =
              "inline-block text-xs font-semibold px-2 py-0.5 rounded-full w-20 text-center";
            if (sl.startsWith("err")) {
              sevClass = "sev-error";
              badgeClass += " bg-rose-600 text-rose-50";
            } else if (sl.startsWith("warn")) {
              sevClass = "sev-warning";
              badgeClass += " bg-amber-500 text-amber-900";
            } else {
              sevClass = "sev-info";
              badgeClass += " bg-sky-500 text-white";
            }
            return `<tr class="issue-row ${sevClass} odd:bg-slate-800/60" data-severity="${escAttr(
              sev
            )}" data-code="${escAttr(rule)}" data-path="${escAttr(
              loc
            )}" data-message="${escAttr(
              msg
            )}"><td class="px-3 py-2"><input type="checkbox" class="sel" aria-label="Select issue"/></td><td class="px-3 py-2"><span class="${badgeClass}">${escHtml(
              sev
            )}</span></td><td class="px-3 py-2 font-mono">${escHtml(
              rule
            )}</td><td class="px-3 py-2">${escHtml(
              msg
            )}</td><td class="px-3 py-2"><code>${escHtml(
              loc
            )}</code></td></tr>`;
          })
          .join("") +
        `</tbody></table></div>`;
    } else if (redocly && redocly.raw && (redocly.errors || redocly.warnings)) {
      const safeRaw = String(redocly.raw)
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
      redoclySection = `<pre style="white-space:pre-wrap; border:1px solid #ddd; padding:8px;">${safeRaw}</pre>`;
    } else {
      // Don't show a 'No Redocly problems found' placeholder when there are no problems.
      redoclySection = "";
    }

    // Build a tabbed UI containing only the sections that have content.
    let issuesTabs = "";
    try {
      const hasSpectral = Boolean(spectralSection && spectralSection.length);
      const hasRedocly = Boolean(redoclySection && redoclySection.length);
      if (hasSpectral || hasRedocly) {
        const defaultTab = hasSpectral ? "spectral" : "redocly";
        issuesTabs = `<div x-data="{tab:'${defaultTab}'}" class="mt-4">`;
        // Tab buttons
        issuesTabs += `<div class="flex gap-2 mb-3">`;
        if (hasSpectral) {
          issuesTabs += `<button @click="tab='spectral'" :class="tab==='spectral' ? 'bg-sky-700 text-white' : 'bg-slate-700 text-slate-300'" class="px-3 py-1 rounded text-sm">Spectral</button>`;
        }
        if (hasRedocly) {
          issuesTabs += `<button @click="tab='redocly'" :class="tab==='redocly' ? 'bg-sky-700 text-white' : 'bg-slate-700 text-slate-300'" class="px-3 py-1 rounded text-sm">Redocly</button>`;
        }
        issuesTabs += `</div>`;
        // Panels
        if (hasSpectral) {
          issuesTabs += `<div x-show="tab==='spectral'" x-transition.opacity class="collapsible-content">${spectralSection}</div>`;
        }
        if (hasRedocly) {
          issuesTabs += `<div x-show="tab==='redocly'" x-transition.opacity class="collapsible-content">${redoclySection}</div>`;
        }
        issuesTabs += `</div>`;
      }
    } catch (e) {
      issuesTabs = spectralSection + redoclySection;
    }

    // Attempt to use the visual template if present
    const tplPath = path.join(
      __dirname,
      "..",
      "templates",
      "grade-report.html"
    );
    if (existsSync(tplPath)) {
      try {
        const tpl = await import("node:fs/promises");
        let template = await tpl.readFile(tplPath, "utf8");
        // basic replacements
        const gradeBg =
          letter === "A"
            ? "bg-emerald-400"
            : letter === "B"
            ? "bg-sky-500"
            : letter === "C"
            ? "bg-amber-500"
            : "bg-rose-600";
        const gradeText = letter === "A" ? "text-slate-900" : "text-white";
        template = template.replaceAll("{{score}}", String(score));
        template = template.replaceAll("{{letter}}", String(letter));
        template = template.replaceAll("{{logoUrl}}", "assets/logo-oas.png");
        template = template.replaceAll("{{logoClass}}", "");
        template = template.replaceAll(
          "{{spectralErrors}}",
          String(spectral.errors ?? 0)
        );
        template = template.replaceAll(
          "{{spectralWarnings}}",
          String(spectral.warnings ?? 0)
        );
        template = template.replaceAll(
          "{{redoclyErrors}}",
          String(redocly.errors ?? 0)
        );
        template = template.replaceAll(
          "{{redoclyWarnings}}",
          String(redocly.warnings ?? 0)
        );
        // expose whether redocly was available so the client can disable the toggle
        template = template.replaceAll(
          "{{redoclyAvailable}}",
          String(redocly.available === true)
        );
        // Prepare initial toggle state placeholders for Redocly (server-rendered defaults)
        const redoclyEnabledDefault = redocly.available === true;
        const redoclyAriaPressed = redoclyEnabledDefault ? "true" : "false";
        const redoclyBtnClass = redoclyEnabledDefault
          ? "bg-sky-600"
          : "bg-slate-700";
        const redoclyKnobClass = redoclyEnabledDefault
          ? "translate-x-6"
          : "translate-x-1";
        const redoclyDisabledAttr =
          redocly.available === false ? "disabled" : "";
        const redoclyDisabledClasses =
          redocly.available === false ? "opacity-50 pointer-events-none" : "";
        template = template.replaceAll(
          "{{redoclyAriaPressed}}",
          redoclyAriaPressed
        );
        template = template.replaceAll("{{redoclyBtnClass}}", redoclyBtnClass);
        template = template.replaceAll(
          "{{redoclyKnobClass}}",
          redoclyKnobClass
        );
        template = template.replaceAll(
          "{{redoclyDisabledAttr}}",
          redoclyDisabledAttr
        );
        template = template.replaceAll(
          "{{redoclyDisabledClasses}}",
          redoclyDisabledClasses
        );
        template = template.replaceAll("{{gradeBg}}", gradeBg);
        template = template.replaceAll("{{gradeText}}", gradeText);
        template = template.replaceAll(
          "{{year}}",
          String(new Date().getFullYear())
        );
        // Inject the tabbed issues UI (falls back to raw sections if tabs empty)
        // Insert only the table panels into the template; the template already
        // contains the tab UI (buttons and panels). Avoid injecting the full
        // `issuesTabs` markup here to prevent duplicate tabs appearing.
        template = template.replaceAll("{{SPECTRAL_SECTION}}", spectralSection);
        template = template.replaceAll("{{REDOCLY_SECTION}}", redoclySection);
        // inject AI prompt template if exists, and populate heuristics placeholders
        const aiTplPath = path.join(
          __dirname,
          "..",
          "templates",
          "ai-prompt.txt"
        );
        if (existsSync(aiTplPath)) {
          let aiRaw = await tpl.readFile(aiTplPath, "utf8");
          // Fill heuristics placeholders inside the AI template so generated prompts contain concrete numbers
          try {
            const heur = report.heuristics || {};
            const totals = heur.totals || {};
            const ratios = heur.ratios || {};
            const presence = heur.presence || {};
            const fmtPct = (n) =>
              typeof n === "number"
                ? String(Math.round(n * 100) + "%")
                : String(n ?? "0%");
            const replacements = {
              "{{operations}}": String(totals.operations ?? 0),
              "{{summaryPct}}": fmtPct(ratios.withSummary),
              "{{descPct}}": fmtPct(ratios.withDesc),
              "{{with4xxPct}}": fmtPct(ratios.with4xx),
              "{{opIdUniquePct}}": fmtPct(ratios.opIdUniqueRatio),
              "{{hasTitle}}": presence.hasTitle ? "Yes" : "No",
              "{{hasVersion}}": presence.hasVersion ? "Yes" : "No",
              "{{hasServers}}": presence.hasServers ? "Yes" : "No",
              "{{hasSecSchemes}}": presence.hasSecSchemes ? "Yes" : "No",
              "{{bonus}}": String(heur.bonus ?? 0),
            };
            for (const k of Object.keys(replacements))
              aiRaw = aiRaw.replaceAll(k, replacements[k]);
          } catch (e) {
            // ignore heuristic injection errors
          }
          const safe = aiRaw.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
          const aiScript = `<script type="text/template" id="aiPromptTemplate">${safe}</script>`;
          template = template.replaceAll("{{AI_PROMPT}}", aiScript);
        } else {
          template = template.replaceAll("{{AI_PROMPT}}", "");
        }
        // Docs badge: indicate which tool produced docs (redocly, redoc-cli, fallback, or none)
        try {
          // Prefer report-provided metadata, but if absent and the dist contains
          // docs.html or bundled.json, surface a fallback docs badge so static
          // reports don't show "No docs" when docs are actually available.
          let docsMeta = report.docs || { generated: false, tool: null };
          try {
            const docsExists = existsSync(
              path.join(process.cwd(), "dist", "docs.html")
            );
            const bundleExists = existsSync(
              path.join(process.cwd(), "dist", "bundled.json")
            );
            if (!docsMeta.generated && (docsExists || bundleExists)) {
              docsMeta = { generated: true, tool: "fallback" };
            }
          } catch (_) {
            // ignore fs probe errors
          }
          let docsBadge = "";
          if (docsMeta.generated) {
            if (docsMeta.tool === "redocly")
              docsBadge =
                '<span class="ml-2 inline-block text-xs px-2 py-0.5 rounded bg-sky-600 text-white">Redocly</span>';
            else if (docsMeta.tool === "redoc-cli")
              docsBadge =
                '<span class="ml-2 inline-block text-xs px-2 py-0.5 rounded bg-indigo-600 text-white">redoc-cli</span>';
            else
              docsBadge =
                '<span class="ml-2 inline-block text-xs px-2 py-0.5 rounded bg-amber-600 text-black">Fallback</span>';
          } else {
            docsBadge =
              '<span class="ml-2 inline-block text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">No docs</span>';
          }
          template = template.replaceAll("{{docsBadge}}", docsBadge);
        } catch (e) {
          template = template.replaceAll("{{docsBadge}}", "");
        }
        // Replace heuristics placeholders in the main template too so the static UI displays values
        try {
          const heur = report.heuristics || {};
          const totals = heur.totals || {};
          const ratios = heur.ratios || {};
          const presence = heur.presence || {};
          const fmtPct = (n) =>
            typeof n === "number"
              ? String(Math.round(n * 100) + "%")
              : String(n ?? "0%");
          template = template.replaceAll(
            "{{operations}}",
            String(totals.operations ?? 0)
          );
          template = template.replaceAll(
            "{{summaryPct}}",
            fmtPct(ratios.withSummary)
          );
          template = template.replaceAll(
            "{{descPct}}",
            fmtPct(ratios.withDesc)
          );
          template = template.replaceAll(
            "{{with4xxPct}}",
            fmtPct(ratios.with4xx)
          );
          template = template.replaceAll(
            "{{opIdUniquePct}}",
            fmtPct(ratios.opIdUniqueRatio)
          );
          template = template.replaceAll(
            "{{hasTitle}}",
            presence.hasTitle ? "Yes" : "No"
          );
          template = template.replaceAll(
            "{{hasVersion}}",
            presence.hasVersion ? "Yes" : "No"
          );
          template = template.replaceAll(
            "{{hasServers}}",
            presence.hasServers ? "Yes" : "No"
          );
          template = template.replaceAll(
            "{{hasSecSchemes}}",
            presence.hasSecSchemes ? "Yes" : "No"
          );
          template = template.replaceAll("{{bonus}}", String(heur.bonus ?? 0));
        } catch (e) {
          // ignore
        }
        // Replace the rebuild button placeholder depending on generateOnly mode.
        try {
          const rebuildHtml = generateOnly
            ? ""
            : `<button id="rebuildBtn" class="px-2 py-1 rounded bg-rose-700 hover:bg-rose-600 inline-flex items-center gap-2" title="Rebuild report">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2" />
              </svg>
              <span>Rebuild</span>
            </button>`;
          template = template.replaceAll("{{REBUILD_BUTTON}}", rebuildHtml);
        } catch (e) {
          template = template.replaceAll("{{REBUILD_BUTTON}}", "");
        }
        writeFileSync(reportHtmlPath, template, "utf8");
      } catch (tplErr) {
        // fallback to simple report if templating fails
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>OpenAPI Grade Report</title></head><body><h1>OpenAPI Grade Report</h1><p><strong>Score:</strong> ${score}</p><p><strong>Grade:</strong> ${letter}</p>${spectralSection}${redoclySection}<p><strong>Had errors:</strong> ${hadErrors}</p><h2>Raw JSON</h2><pre style="white-space:pre-wrap; border:1px solid #ddd; padding:8px; margin-top:1rem;">${JSON.stringify(
          report,
          null,
          2
        )}</pre></body></html>`;
        writeFileSync(reportHtmlPath, html, "utf8");
      }
    } else {
      // no template found; write a simple HTML
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>OpenAPI Grade Report</title></head><body><h1>OpenAPI Grade Report</h1><p><strong>Score:</strong> ${score}</p><p><strong>Grade:</strong> ${letter}</p>${spectralSection}${redoclySection}<p><strong>Had errors:</strong> ${hadErrors}</p><h2>Raw JSON</h2><pre style="white-space:pre-wrap; border:1px solid #ddd; padding:8px; margin-top:1rem;">${JSON.stringify(
        report,
        null,
        2
      )}</pre></body></html>`;
      writeFileSync(reportHtmlPath, html, "utf8");
    }
  }

  // For backward compatibility with older tooling/tests that expect
  // `dist/grade-report.html`, also write a copy of the generated
  // `dist/index.html` to `dist/grade-report.html` when possible.
  try {
    const fs = await import("node:fs");
    const legacyPath = path.join(process.cwd(), "dist", "grade-report.html");
    if (existsSync(reportHtmlPath)) {
      const content = fs.readFileSync(reportHtmlPath, "utf8");
      fs.writeFileSync(legacyPath, content, "utf8");
    }
  } catch (e) {
    // Non-fatal: continue even if we cannot create the legacy file
  }

  console.log("Report artifacts ready in dist/");
  // Ensure user-facing docs pages exist even if Redocly was not available
  try {
    const docsPath = path.join(process.cwd(), "dist", "docs.html");
    const swaggerPath = path.join(process.cwd(), "dist", "swagger.html");
    // If Redocly did not produce docs.html, create a lightweight ReDoc page that
    // consumes the generated bundle (dist/bundled.json). This allows the UI links
    // to work even when Redocly CLI is not installed.
    if (generateOnly || !existsSync(docsPath)) {
      try {
        let embedded = null;
        if (existsSync(path.join(process.cwd(), "dist", "bundled.json"))) {
          try {
            embedded = JSON.parse(
              await (
                await import("node:fs/promises")
              ).readFile(
                path.join(process.cwd(), "dist", "bundled.json"),
                "utf8"
              )
            );
          } catch (e) {
            embedded = null;
          }
        }
        const bundleScript = embedded
          ? `\n<script>window.__BUNDLED_SPEC__ = ${JSON.stringify(
              embedded
            )};</script>`
          : "";
        const redocHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>API Docs</title><script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script></head><body style="margin:0;padding:0"><div id="redoc-container"></div>${bundleScript}<script> (function(){ try{ if(window.__BUNDLED_SPEC__){ Redoc.init(window.__BUNDLED_SPEC__, {}, document.getElementById('redoc-container')); } else { const r = document.createElement('redoc'); r.setAttribute('spec-url','bundled.json'); document.body.appendChild(r); } }catch(e){ console.error('ReDoc init failed', e); } })();</script></body></html>`;
        writeFileSync(docsPath, redocHtml, "utf8");
        console.log("Created fallback dist/docs.html (ReDoc)");
      } catch (e) {
        console.warn("Could not create fallback docs.html:", e?.message || e);
      }
    }
    // If swagger.html missing, create a minimal Swagger UI page pointing to bundled.json
    if (generateOnly || !existsSync(swaggerPath)) {
      try {
        let embedded = null;
        if (existsSync(path.join(process.cwd(), "dist", "bundled.json"))) {
          try {
            embedded = JSON.parse(
              await (
                await import("node:fs/promises")
              ).readFile(
                path.join(process.cwd(), "dist", "bundled.json"),
                "utf8"
              )
            );
          } catch (e) {
            embedded = null;
          }
        }
        const bundleScript = embedded
          ? `\n<script>window.__BUNDLED_SPEC__ = ${JSON.stringify(
              embedded
            )};</script>`
          : "";
        const swaggerHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Swagger UI</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4/swagger-ui.css" /></head><body style="margin:0;padding:0"><div id="swagger"></div><script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-bundle.js"></script>${bundleScript}<script> (function(){ try{ if(window.__BUNDLED_SPEC__){ SwaggerUIBundle({ spec: window.__BUNDLED_SPEC__, dom_id: '#swagger' }); } else { SwaggerUIBundle({ url: 'bundled.json', dom_id: '#swagger' }); } }catch(e){ console.error('Swagger init failed', e); } })();</script></body></html>`;
        writeFileSync(swaggerPath, swaggerHtml, "utf8");
        console.log("Created fallback dist/swagger.html (Swagger UI)");
      } catch (e) {
        console.warn(
          "Could not create fallback swagger.html:",
          e?.message || e
        );
      }
    }
  } catch (e) {
    console.warn(
      "Could not ensure fallback docs/swagger pages:",
      e?.message || e
    );
  }

  // This script only generates static artifacts (report:static). To preview
  // or serve the generated site use the dedicated npm script `serve:dist`.
  // e.g. `pnpm run serve:dist` which runs `vite preview` against `dist/`.
  process.exit(0);
} catch (e) {
  console.error("Report generation failed:", e.message);
  process.exit(1);
}
