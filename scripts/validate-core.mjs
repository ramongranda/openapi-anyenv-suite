/*
 * Core implementation for validate CLI. This file is imported by `validate.mjs` which
 * contains only a shebang and dynamic import so the parser doesn't see multiple
 * shebangs or duplicated top-level blocks.
 */
import { run, ensureDir } from "./common-utils.mjs";
import { resolveBin } from "./utils.mjs";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  existsSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rawArgs = process.argv.slice(2);
if (rawArgs.length === 0) {
  console.error("Usage: pnpm run check -- <path/to/openapi.yaml>");
  process.exit(2);
}
const file = rawArgs[0];
const DIST_DIR = "dist";
ensureDir(DIST_DIR);

// Resolve package-rooted paths so fallback works under npx/dlx
const __HERE = path.dirname(fileURLToPath(import.meta.url));
const __PKG_ROOT = path.resolve(__HERE, "..");
const __BUNDLE_WRAPPER = path.resolve(__PKG_ROOT, "scripts", "bundle.mjs");
const __SPECTRAL_RULESET = path.resolve(__PKG_ROOT, ".spectral.yaml");

export default async function validate() {
  try {
    const outPath = `${DIST_DIR}/bundled.json`;
    try {
      await run(resolveBin("redocly"), [
        "bundle",
        file,
        "--output",
        outPath,
        "--ext",
        "json",
      ]);
    } catch (e) {
      console.error(
        "redocly bundle failed, falling back to local bundler:",
        e?.message ?? e
      );
      try {
        await run(process.execPath, [
          __BUNDLE_WRAPPER,
          file,
          "--out",
          outPath,
        ]);
      } catch (e2) {
        console.error("local bundler failed:", e2?.message ?? e2);
        throw e;
      }
    }

    if (!existsSync(outPath)) {
      console.warn(
        "dist/bundled.json missing after bundling attempts; trying to normalize alternative artifacts"
      );
      try {
        const files = readdirSync(DIST_DIR);
        const candidate = files.find((f) =>
          /^bundled([.-].*)?(\.(ya?ml|json))?$/i.test(f)
        );
        if (candidate) {
          const src = path.join(DIST_DIR, candidate);
          const lower = candidate.toLowerCase();
          if (lower.endsWith(".json")) copyFileSync(src, outPath);
          else if (lower.endsWith(".yml") || lower.endsWith(".yaml")) {
            const yaml = (await import("yaml")).default;
            const content = readFileSync(src, "utf8");
            const parsed = yaml.parse(content);
            writeFileSync(outPath, JSON.stringify(parsed, null, 2), "utf8");
          } else {
            const content = readFileSync(src, "utf8");
            try {
              const parsed = JSON.parse(content);
              writeFileSync(outPath, JSON.stringify(parsed, null, 2), "utf8");
            } catch (_) {
              try {
                const yaml = (await import("yaml")).default;
                const parsed = yaml.parse(content);
                writeFileSync(outPath, JSON.stringify(parsed, null, 2), "utf8");
              } catch (_) {
                copyFileSync(src, outPath);
              }
            }
          }
        }
      } catch (normErr) {
        console.error("Normalization failed:", normErr?.message ?? normErr);
      }
    }

    const spectralRuleset = __SPECTRAL_RULESET;
    console.log(`Spectral lint (bundle only): ${outPath}`);
    await run(resolveBin("spectral"), [
      "lint",
      outPath,
      "--ruleset",
      spectralRuleset,
      "--fail-severity",
      "error",
    ]);

    if (process.env.SCHEMA_LINT === "1") {
      console.log("Redocly schema lint");
      await run(resolveBin("redocly"), ["lint", outPath]);
    }

    console.log(`Validation OK. Bundle: ${outPath}`);
  } catch (err) {
    console.error("Validation error:", err?.message ?? err);
    process.exit(1);
  }
}

// If imported dynamically from validate.mjs the caller will run the function;
// but allow running this file directly (no shebang here) for tests.
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("validate-core.mjs")
) {
  await validate();
}
