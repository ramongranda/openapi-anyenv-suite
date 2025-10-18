import { spawn } from 'node:child_process';

/** Execute a command and capture stdout/stderr, but DO NOT throw on non-zero exit. */
export function execAllowFail(cmd, args) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: 'pipe', shell: true });
    let out = '', err = '';
    p.stdout.on('data', d => out += d.toString());
    p.stderr.on('data', d => err += d.toString());
    p.on('close', (code) => resolve({ code, out, err }));
  });
}
