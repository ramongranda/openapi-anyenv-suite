#!/usr/bin/env node
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
} from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = argv.slice(2);
  const outIndex = args.indexOf("--out");
  const out =
    outIndex !== -1 && args[outIndex + 1]
      ? args[outIndex + 1]
      : "dist/bundled.json";
  // spec may be passed directly or after a '--'
  const spec = args.find((a) => /\.(ya?ml|json)$/i.test(a)) || args.at(-1);
  return { spec, out };
}

async function main() {
  const { spec, out } = parseArgs(process.argv);
  if (!spec) {
    console.error("Usage: node scripts/bundle.mjs -- <spec> --out <outpath>");
    process.exit(2);
  }

  try {
    const absSpec = path.resolve(process.cwd(), spec);
    const absOut = path.resolve(process.cwd(), out);
    const outDir = path.dirname(absOut);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    if (!existsSync(absSpec)) {
      console.error(`Spec not found: ${absSpec}`);
      process.exit(3);
    }

    const content = readFileSync(absSpec, "utf8");
    // Try JSON first
    await fallbackBundle(absSpec, absOut, content);

    // --- extracted handlers for clarity and testability ---
    async function fallbackBundle(absSpec, absOut, content) {
      try {
        const parsed = JSON.parse(content);
        writeFileSync(absOut, JSON.stringify(parsed, null, 2), "utf8");
        console.log(`Fallback bundle: wrote JSON to ${absOut}`);
        process.exit(0);
      } catch (jsonErr) {
        // Delegate JSON parse failure handling to a dedicated function
        await handleJsonParseError(absSpec, absOut, content, jsonErr);
      }
    }

    async function handleJsonParseError(absSpec, absOut, content, error) {
      // Attempt YAML parsing; if it fails, proceed to copy fallback
      await tryParseYamlOrCopy(absSpec, absOut, content);
    }

    async function tryParseYamlOrCopy(absSpec, absOut, content) {
      try {
        const { default: YAML } = await import("yaml");
        const parsed = YAML.parse(content);
        writeFileSync(absOut, JSON.stringify(parsed, null, 2), "utf8");
        console.log(`Fallback bundle: parsed YAML and wrote JSON to ${absOut}`);
        process.exit(0);
      } catch (yamlErr) {
        // Delegate copy fallback to its own handler
        await handleCopyFallback(absSpec, absOut, yamlErr);
      }
    }

    async function handleCopyFallback(absSpec, absOut, previousError) {
      try {
        copyFileSync(absSpec, absOut);
        console.log(`Fallback bundle: copied ${absSpec} to ${absOut}`);
        process.exit(0);
      } catch (copyErr) {
        handleFinalFallbackError(copyErr);
      }
    }

    function handleFinalFallbackError(err) {
      console.error("Fallback bundling failed:", err?.message ?? err);
      process.exit(4);
    }
  } catch (err) {
    console.error("Unexpected error in fallback bundler:", err?.message ?? err);
    process.exit(5);
  }
}

main();
