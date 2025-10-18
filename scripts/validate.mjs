
import { spawn } from 'node:child_process';
import { basename } from 'node:path';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Usage: npm run validate -- <path/to/openapi.yaml>');
  process.exit(2);
}
const file = args[0];
const DIST_DIR = 'dist';
mkdirSync(DIST_DIR, { recursive: true });
const bundled = `${DIST_DIR}/bundled-${basename(file)}`;

function run(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: 'inherit', shell: true });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

try {
  console.log('📦 Redocly bundle');
  await run('redocly', ['bundle', file, '--output', bundled]);

  console.log(`🔎 Spectral lint (bundle only): ${bundled}`);
  await run('spectral', ['lint', bundled, '--ruleset', '.spectral.yaml', '--fail-severity', 'error']);

  if (process.env.SCHEMA_LINT === '1') {
    console.log('🧪 Redocly schema lint');
    await run('redocly', ['lint', bundled]);
  }

  console.log(`✅ Validation OK. Bundle: ${bundled}`);
} catch (err) {
  console.error('❌ Validation error:', err.message);
  process.exit(1);
}
