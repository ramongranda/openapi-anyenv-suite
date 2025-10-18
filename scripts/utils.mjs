import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function resolveBin(name) {
  const ext = process.platform === 'win32' ? '.cmd' : '';
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const candidate = path.join(__dirname, '..', 'node_modules', '.bin', name + ext);
  return existsSync(candidate) ? candidate : name;
}

