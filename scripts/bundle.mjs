#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = argv.slice(2);
  const outIndex = args.indexOf('--out');
  const out = outIndex !== -1 && args[outIndex + 1] ? args[outIndex + 1] : 'dist/bundled.json';
  // spec may be passed directly or after a '--'
  const spec = args.find(a => /\.(ya?ml|json)$/i.test(a)) || args[args.length - 1];
  return { spec, out };
}

async function main() {
  const { spec, out } = parseArgs(process.argv);
  if (!spec) {
    console.error('Usage: node scripts/bundle.mjs -- <spec> --out <outpath>');
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

    const content = readFileSync(absSpec, 'utf8');
    // Try JSON first
    try {
      const parsed = JSON.parse(content);
      writeFileSync(absOut, JSON.stringify(parsed, null, 2), 'utf8');
      console.log(`Fallback bundle: wrote JSON to ${absOut}`);
      process.exit(0);
    } catch (jsonErr) {
      // Try YAML
      try {
        const { default: YAML } = await import('yaml');
        const parsed = YAML.parse(content);
        writeFileSync(absOut, JSON.stringify(parsed, null, 2), 'utf8');
        console.log(`Fallback bundle: parsed YAML and wrote JSON to ${absOut}`);
        process.exit(0);
      } catch (yamlErr) {
        // As a last resort, copy the file
        try {
          copyFileSync(absSpec, absOut);
          console.log(`Fallback bundle: copied ${absSpec} to ${absOut}`);
          process.exit(0);
        } catch (copyErr) {
          console.error('Fallback bundling failed:', copyErr?.message ?? copyErr);
          process.exit(4);
        }
      }
    }
  } catch (err) {
    console.error('Unexpected error in fallback bundler:', err?.message ?? err);
    process.exit(5);
  }
}

main();
