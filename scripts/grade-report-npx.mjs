#!/usr/bin/env node
// Legacy NPX wrapper: delegate to canonical scripts/grade-report.mjs with a uniform deprecation message.
console.error(
  "DEPRECATION: this NPX wrapper will be removed in a future release. Use `pnpm run check -- <spec> --docs` or call `scripts/grade-report.mjs` directly."
);
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const scriptPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "grade-report.mjs"
);
const res = spawnSync(process.execPath, [scriptPath, ...args], {
  stdio: "inherit",
});
process.exit(res.status ?? 0);
