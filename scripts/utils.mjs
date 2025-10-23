import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Resolves an executable name to a runnable command string.
 *
 * Resolution strategy (in order):
 * 1. Prefer test stubs in the current working directory's `bin/` folder
 *    (e.g. `./bin/redocly.js` or `./bin/spectral`), which the test
 *    harness may create. If a `.js` stub is found, return `node <path>` so
 *    it runs reliably on all platforms.
 * 2. Use `node_modules/.bin/<name>` from this package (useful for local installs).
 * 3. Fall back to the bare `name` to let the OS PATH resolve it.
 *
 * Notes:
 * - On Windows we prefer the `.cmd` extension when checking local `.bin`.
 * - This function does not spawn processes; it only returns a command string
 *   suitable for passing to child_process helpers elsewhere.
 *
 * @param {string} name Executable base name (e.g., "spectral", "redocly").
 * @returns {string} A command or path to run the executable.
 */
export function resolveBin(name) {
  const ext = process.platform === 'win32' ? '.cmd' : '';
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const candidate = path.join(__dirname, '..', 'node_modules', '.bin', name + ext);

  // First, prefer test or local wrappers in the current working directory
  // (tests create `./bin/<name>` or `./bin/<name>.js`). If a .js wrapper
  // exists, return a node invocation so it runs consistently.
  try {
    const cwdBin = path.join(process.cwd(), 'bin');
    const jsCandidate = path.join(cwdBin, `${name}.js`);
    const plainCandidate = path.join(cwdBin, name + ext);
    if (existsSync(jsCandidate)) return `node ${jsCandidate}`;
    if (existsSync(plainCandidate)) return plainCandidate;
  } catch (e) {
    // ignore filesystem errors and continue fallback checks
  }

  // Next, prefer the package's node_modules/.bin
  return existsSync(candidate) ? candidate : name;
}
