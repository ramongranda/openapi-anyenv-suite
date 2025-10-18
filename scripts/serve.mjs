import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

function parseArgs() {
  const args = process.argv.slice(2);
  let dir = 'dist';
  let port = 8080;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && args[i+1]) dir = args[i+1];
    if (args[i] === '--port' && args[i+1]) port = parseInt(args[i+1], 10) || 8080;
  }
  return { dir, port };
}

const { dir, port } = parseArgs();

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = `.${parsedUrl.pathname}`;
  if (pathname === './') pathname = './index.html';
  const filePath = path.join(dir, pathname.replace(/^\.\/+/, ''));
  fs.readFile(filePath, (err, data) => {
    if (err) { res.statusCode = 404; res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    const type = mime[ext] || 'application/octet-stream';
    res.statusCode = 200;
    res.setHeader('Content-Type', type);
    res.end(data);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Serving ${dir} at http://127.0.0.1:${port}`);
});
