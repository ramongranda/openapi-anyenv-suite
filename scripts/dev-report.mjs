#!/usr/bin/env node
import { spawn } from 'child_process'
import net from 'node:net'

const args = process.argv.slice(2)

function runReportViaPnpm(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['run', 'report', '--', ...args], { stdio: 'inherit', cwd: process.cwd(), env: process.env })
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error('report failed: ' + code))))
  })
}

function runVite(port = '8080') {
  return new Promise((resolve, reject) => {
    // Use pnpm exec to ensure local vite is used
    const child = spawn('pnpm', ['exec', 'vite', '--root', 'dist', '--port', port], { stdio: 'inherit', cwd: process.cwd(), env: process.env })
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error('vite exited: ' + code))))
  })
}

async function findAvailablePort(startPort, maxAttempts = 20) {
  let port = Number(startPort) || 8080;
  for (let i = 0; i < maxAttempts; i++) {
    const ok = await new Promise((resolve) => {
      const srv = net.createServer().once('error', (err) => {
        srv.close?.();
        resolve(false);
      }).once('listening', () => {
        srv.close(() => resolve(true));
      }).listen(port, '127.0.0.1');
    });
    if (ok) return String(port);
    port++;
  }
  throw new Error('No available port found');
}

(async () => {
  try {
    // allow passing --port N to this wrapper; capture it for vite and forward
    let port = '8080'
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--port' && args[i + 1]) {
        port = args[i + 1]
        break
      }
    }

    // forward the full args list to report (so it honors --port too)
    await runReportViaPnpm(args)

    // If the preferred port is busy, pick the next available one
    const chosenPort = await findAvailablePort(port, 50)
    if (String(chosenPort) !== String(port)) {
      console.log(`[dev-report] preferred port ${port} busy, using ${chosenPort}`)
    }
    await runVite(chosenPort)
  } catch (err) {
    // propagate non-zero exit
    console.error(err && err.stack ? err.stack : err)
    process.exit(1)
  }
})()
