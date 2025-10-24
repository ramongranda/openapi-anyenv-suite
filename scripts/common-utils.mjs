import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Run a command as a promise, capturing stdout/stderr and rejecting on non-zero exit.
 * @param {string} cmd - Command to execute.
 * @param {string[]} cmdArgs - Arguments array.
 * @param {object} [opts] - Optional spawn options (cwd, env, etc.).
 * @returns {Promise<void>} Resolves when the process exits with code 0, rejects otherwise.
 */
export function run(cmd, cmdArgs = [], opts = {}) {
  // Allow passing { cmd, args } returned by resolveBin
  if (typeof cmd === 'object' && cmd?.cmd) {
    cmdArgs = [...(cmd.args || []), ...cmdArgs];
    cmd = cmd.cmd;
  }
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: 'inherit', shell: true, ...opts });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    p.on('error', (err) => reject(err));
  });
}

/**
 * Ensure a directory exists, creating parents as needed. Silent on error.
 * @param {string} dir - Directory path to create.
 */
export function ensureDir(dir) {
  try {
    mkdirSync(dir, { recursive: true });
  } catch (e) {
    // intentionally ignore filesystem errors during directory creation
  }
}

/**
 * Resolve an absolute path from a base path and a relative path.
 * @param {string} basePath - Base path to resolve from.
 * @param {string} relativePath - Relative path to resolve.
 * @returns {string} Resolved absolute path.
 */
export function resolvePath(basePath, relativePath) {
  return path.resolve(basePath, relativePath);
}