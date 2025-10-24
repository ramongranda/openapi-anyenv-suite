#!/usr/bin/env node
// Safe doctor script: print node and tool versions if available, but never fail
import { spawnSync } from "node:child_process";

function tryExec(cmd, args = []) {
  try {
    const res = spawnSync(cmd, args, { encoding: "utf8", shell: true });
    if (res.error) return `${cmd} error: ${res.error.message}`;
    if (res.status !== 0) return `${cmd} exit ${res.status}`;
    return (res.stdout || res.stderr || "").trim();
  } catch (e) {
    return `${cmd} not available (${e.message})`;
  }
}

console.log("Node:", process.version);
console.log("pnpm:", tryExec("pnpm", ["-v"]));
console.log(
  "spectral:",
  tryExec("pnpm", ["exec", "--", "spectral", "--version"])
);
console.log(
  "redocly:",
  tryExec("pnpm", ["exec", "--", "redocly", "--version"])
);

// Always exit 0
process.exit(0);
