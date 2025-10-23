import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Run a command as a promise, capturing stdout/stderr and rejecting on non-zero exit.
 * @param {string} cmd - Comando a ejecutar.
 * @param {string[]} args - Arguments array
 * @param {object} [opts] - Opciones adicionales para el proceso.
 * @param {{cwd?:string, env?:object}} options - Optional spawn options
 * @returns {Promise<void>} - Promesa que se resuelve si el comando se ejecuta correctamente.
 * @returns {Promise<string>} Resolves with stdout if exit code is 0, otherwise rejects with an Error containing exit code.
 */
export function run(cmd, cmdArgs, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: 'inherit', shell: true, ...opts });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

/**
 * Ensure a directory exists, creating parents as needed. Silent on error.
 * @param {string} dirPath - Ruta del directorio a crear.
 * @param {string} dir - Directory path
 */
export function ensureDir(dir) {
  try { mkdirSync(dir, { recursive: true }); } catch (e) { /* ignore */ }
}
```
}

/**
 * Resuelve la ruta absoluta de un archivo o directorio.
 * @param {string} basePath - Ruta base.
 * @param {string} relativePath - Ruta relativa a resolver.
 * @returns {string} - Ruta absoluta resuelta.
 */
export function resolvePath(basePath, relativePath) {
  return path.resolve(basePath, relativePath);
}