import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Ejecuta un comando en un proceso hijo.
 * @param {string} cmd - Comando a ejecutar.
 * @param {string[]} cmdArgs - Argumentos del comando.
 * @param {object} [opts] - Opciones adicionales para el proceso.
 * @returns {Promise<void>} - Promesa que se resuelve si el comando se ejecuta correctamente.
 */
export function run(cmd, cmdArgs, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: 'inherit', shell: true, ...opts });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

/**
 * Crea un directorio de forma recursiva si no existe.
 * @param {string} dirPath - Ruta del directorio a crear.
 */
export function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true });
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