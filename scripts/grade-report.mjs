#!/usr/bin/env node
// Canonical report generator. Prefer 'pnpm run check -- <spec> --docs' but
// this script remains a direct entrypoint. Print a short advisory message
// to encourage migrating to `check`.
console.error(
  "ADVISORY: prefer `pnpm run check -- <spec> [--docs]`. This script remains supported."
);
import { existsSync, writeFileSync } from "node:fs";
import { run, ensureDir } from "./common-utils.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    "Usage: pnpm run report -- <path/to/openapi.yaml> [--port 8080]"
  );
  process.exit(2);
}
const file = args[0];
let port = 8080;
let generateOnly = false;
for (let i = 1; i < args.length; i++) {
  if (args[i] === "--port" && args[i + 1])
    port = Number.parseInt(args[i + 1], 10) || 8080;
  if (args[i] === "--generate-only" || args[i] === "--no-serve")
    generateOnly = true;
}

ensureDir("dist");

try {
  console.log("Generating grade report");
  // Run canonical grade flow in soft mode to produce JSON + minimal HTML
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const gradeScript = path.join(__dirname, "grade.mjs");
  await run(process.execPath, [gradeScript, file, "--soft"]);

  const reportHtmlPath = "dist/grade-report.html";
  if (!existsSync(reportHtmlPath)) {
    writeFileSync(
      reportHtmlPath,
      "<html><body><h1>OpenAPI Grade Report</h1></body></html>"
    );
  }

  console.log("Reporte generado correctamente en dist/grade-report.html");

  if (generateOnly) {
    process.exit(0);
  }

  console.log(`Serving at http://127.0.0.1:${port}/grade-report.html`);
  await run("node", ["./serve.mjs", "--dir", "dist", "--port", String(port)]);
} catch (e) {
  console.error("Report generation failed:", e.message);
  process.exit(1);
}
