import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Resolve a binary path from local node_modules/.bin falling back to PATH.
 * On Windows, appends ".cmd" for local .bin binaries.
 *
 * @param {string} name Executable base name (e.g., "spectral", "redocly").
 * @returns {string} Local absolute path if found; otherwise the name for PATH resolution.
 */
export function resolveBin(name) {
  const ext = process.platform === 'win32' ? '.cmd' : '';
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const candidate = path.join(__dirname, '..', 'node_modules', '.bin', name + ext);
  // Prefer a `bin` directory inside the current working directory (used by tests)
  try {
    const cwdBin = path.join(process.cwd(), 'bin');
    // On *nix test stubs may be JS files (e.g. redocly.js), prefer invoking them with node.
    const jsCandidate = path.join(cwdBin, `${name}.js`);
    const plainCandidate = path.join(cwdBin, name + ext);
    if (existsSync(jsCandidate)) return `node ${jsCandidate}`;
    if (existsSync(plainCandidate)) return plainCandidate;
  } catch (e) {
    // ignore
  }

  return existsSync(candidate) ? candidate : name;
}
