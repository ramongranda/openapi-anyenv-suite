import { defineConfig } from 'vite'
import { spawn } from 'child_process'

function jsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      if (!body) return resolve(null)
      try {
        resolve(JSON.parse(body))
      } catch (err) {
        resolve(null)
      }
    })
    req.on('error', reject)
  })
}

export default defineConfig({
  plugins: [
    {
      name: 'rebuild-endpoint',
      configureServer(server) {
        server._isRebuilding = false
        server.middlewares.use(async (req, res, next) => {
          if (req.url !== '/__rebuild' || req.method !== 'POST') return next()

          const payload = (await jsonBody(req)) || {}

          if (server._isRebuilding) {
            res.statusCode = 409
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: 'rebuild already in progress' }))
            return
          }

          server._isRebuilding = true

          const args = []
          if (payload.generateOnly) args.push('--generate-only')
          if (payload.spec) args.push(payload.spec)

          const child = spawn(process.execPath, ['scripts/grade-report.mjs', ...args], {
            cwd: process.cwd(),
            env: process.env,
          })

          let stdout = ''
          let stderr = ''
          child.stdout.on('data', (d) => (stdout += d.toString()))
          child.stderr.on('data', (d) => (stderr += d.toString()))

          child.on('close', (code) => {
            server._isRebuilding = false
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({ ok: code === 0, code, stdout: stdout.slice(0, 65536), stderr: stderr.slice(0, 65536) })
            )
          })
        })
      },
    },
  ],
})
