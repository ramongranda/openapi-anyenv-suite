#!/usr/bin/env node
// Wrapper to prevent accidental local releases. Only runs semantic-release when
// executed in CI (e.g. GitHub Actions) or when CI env var is explicitly set.
import { spawnSync } from "node:child_process";

const isCI = process.env.GITHUB_ACTIONS === "true" || process.env.CI === "true";
if (!isCI) {
  console.error(
    "Refusing to run semantic-release outside CI. Set GITHUB_ACTIONS=true or CI=true to allow."
  );
  process.exit(1);
}

const res = spawnSync("npx", ["semantic-release"], {
  stdio: "inherit",
  shell: false,
});
process.exit(res.status ?? 0);
