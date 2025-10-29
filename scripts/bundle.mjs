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
        const sanitized = sanitizeUnresolvedRefs(parsed, path.dirname(absSpec));
        writeFileSync(absOut, JSON.stringify(sanitized, null, 2), "utf8");
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
        const sanitized = sanitizeUnresolvedRefs(parsed, path.dirname(absSpec));
        writeFileSync(absOut, JSON.stringify(sanitized, null, 2), "utf8");
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

// --- Helpers ---
function sanitizeUnresolvedRefs(root, baseDir) {
  let replaced = 0;
  const seen = new WeakSet();
  function existsAtPointer(obj, pointer) {
    try {
      if (!pointer || pointer === '#') return true;
      if (!pointer.startsWith('#/')) return false;
      const parts = pointer.slice(2).split('/').map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'));
      let cur = obj;
      for (const p of parts) {
        if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
        else return false;
      }
      return cur !== undefined;
    } catch { return false; }
  }
  function isResolvableExternal(ref) {
    try {
      if (!ref || typeof ref !== 'string') return false;
      if (/^https?:\/\//i.test(ref)) return false; // do not attempt network
      // crude check for file-like refs (ending in .yaml/.yml/.json or relative path)
      const looksFile = /\.(ya?ml|json)$/i.test(ref) || ref.includes('/') || ref.includes('\\');
      if (!looksFile) return false;
      const abs = path.isAbsolute(ref) ? ref : path.join(baseDir, ref);
      return existsSync(abs);
    } catch { return false; }
  }
  function placeholderFromRef(ref) {
    return {
      type: 'object',
      description: `Placeholder for unresolved $ref: ${String(ref)}`,
      properties: {},
      additionalProperties: true,
    };
  }
  function walk(node) {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (typeof node.$ref === 'string') {
      const ref = node.$ref;
      let ok = false;
      if (ref.startsWith('#/')) ok = existsAtPointer(root, ref);
      else ok = isResolvableExternal(ref);
      if (!ok) {
        // replace current object with placeholder shape
        delete node.$ref;
        Object.assign(node, placeholderFromRef(ref));
        replaced++;
      }
    }
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (v && typeof v === 'object') walk(v);
    }
    if (Array.isArray(node)) node.forEach(walk);
  }
  try { walk(root); } catch {}
  if (replaced > 0) console.warn(`[fallback-bundle] Replaced ${replaced} unresolved $ref with placeholders`);
  return root;
}

main();
