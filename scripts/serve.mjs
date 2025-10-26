/**
 * Tiny static file server used by preview/swagger commands.
 *
 * Usage:
 *   node scripts/serve.mjs --dir dist --port 8080
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { spawn } from "node:child_process";

function parseArgs() {
  const args = process.argv.slice(2);
  let dir = "dist";
  let port = 8080;
  let enableRebuild = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dir" && args[i + 1]) dir = args[i + 1];
    if (args[i] === "--port" && args[i + 1])
      port = Number.parseInt(args[i + 1], 10) || 8080;
    if (args[i] === "--rebuild" || args[i] === "--enable-rebuild") enableRebuild = true;
  }
  return { dir, port, enableRebuild };
}

const { dir, port } = parseArgs();
const { enableRebuild } = parseArgs();
const REBUILD_ENABLE = process.env.REBUILD_ENABLE === "1" || !!enableRebuild;
const REBUILD_SPEC = process.env.REBUILD_SPEC || "";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url);
  if (REBUILD_ENABLE && parsedUrl.pathname === "/__rebuild") {
    // Trigger regeneration of report + docs + swagger
    try {
      // parse JSON body to get redocly toggle
      let body = "";
      await new Promise((resolve) => {
        req.on("data", (chunk) => (body += chunk));
        req.on("end", resolve);
      });
      let redocly = false;
      try {
        const j = JSON.parse(body || "{}");
        redocly = !!j.redocly;
      } catch {}
      const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
      const script = path.join(__dirname, "grade-report.mjs");
      await new Promise((resolve) => {
        const p = spawn(
          process.execPath,
          [script, REBUILD_SPEC, "--generate-only"],
          {
            stdio: "inherit",
            shell: true,
            env: {
              ...process.env,
              GRADE_SOFT: "1",
              SCHEMA_LINT: redocly ? "1" : "0",
            },
          }
        );
        p.on("close", () => resolve());
      });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: String(e?.message || e) }));
    }
    return;
  }
  let pathname = `.${parsedUrl.pathname}`;
  if (pathname === "./") pathname = "./index.html";
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(__dirname, "..");

  const filePath = path.join(dir, pathname.replace(/^\.\/+/, ""));
  fs.readFile(filePath, (err, data) => {
    const ext = path.extname(filePath).toLowerCase();
    if (!err) {
      // serve file from dist
      const type = mime[ext] || "application/octet-stream";
      res.statusCode = 200;
      res.setHeader("Content-Type", type);
      if (ext === ".html") {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
      res.end(data);
      return;
    }
    // if not found in dist and path points to /assets/, try project root assets (copied or source)
    if (parsedUrl.pathname && parsedUrl.pathname.startsWith('/assets/')) {
      const rel = parsedUrl.pathname.replace(/^\/+/, '');
      const assetsRoot = path.join(projectRoot, 'assets');
      const assetPath = path.resolve(assetsRoot, rel.slice('assets/'.length)); // remove 'assets/' prefix from rel
      // Ensure assetPath is within assetsRoot
      if (!assetPath.startsWith(assetsRoot + path.sep)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }
      fs.readFile(assetPath, (err2, data2) => {
        if (err2) { res.statusCode = 404; res.end('Not found'); return; }
        const ext2 = path.extname(assetPath).toLowerCase();
        const type2 = mime[ext2] || 'application/octet-stream';
        res.statusCode = 200; res.setHeader('Content-Type', type2); res.end(data2);
      });
      return;
    }
    // otherwise 404
    res.statusCode = 404;
    res.end("Not found");
    return;
  });

});

server.listen(port, "0.0.0.0", () => {
  console.log(`Serving ${dir} at http://127.0.0.1:${port}`);
});
