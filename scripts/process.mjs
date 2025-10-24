import { spawn } from "node:child_process";

/**
 * Execute a command and capture stdout/stderr without throwing on non-zero exit.
 *
 * @param {string} cmd - Binary or shell command to execute.
 * @param {string[]} args - Arguments passed to the command.
 * @returns {Promise<{code: number, out: string, err: string}>} Resolves with exit code and streams.
 */
/**
 * Spawn a process, capturing stdout/stderr. Never throws on non-zero exit.
 * Useful to parse tools' outputs while tolerating their exit codes (e.g. linters).
 *
 * @param {string} cmd Binary or shell command to execute.
 * @param {string[]} args Arguments to pass to the command.
 * @returns {Promise<{code:number,out:string,err:string}>} Exit code and collected streams.
 */
export function execAllowFail(cmd, args) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: "pipe", shell: true });
    let out = "",
      err = "";
    p.stdout.on("data", (d) => (out += d.toString()));
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) => resolve({ code, out, err }));
  });
}
