#!/usr/bin/env node
// 只读静态预览。不安装依赖，不执行上游 tools/。
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
};

export function startPreviewServer(root, host = '127.0.0.1', port = 0) {
  const projectRoot = path.resolve(root);
  if (!fs.existsSync(path.join(projectRoot, 'render.html'))) {
    throw new Error(`不是鹈鹕影片目录（缺少 render.html）: ${projectRoot}`);
  }

  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url || '/', `http://${host}`);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
      }
      if (pathname === '/') pathname = '/index.html';
      const filePath = path.resolve(projectRoot, `.${pathname}`);
      if (filePath !== projectRoot && !filePath.startsWith(projectRoot + path.sep)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME[ext] || 'application/octet-stream',
          'Content-Length': stat.size,
          'Cache-Control': 'no-cache',
        });
        fs.createReadStream(filePath).pipe(res);
      });
    } catch (error) {
      res.writeHead(500);
      res.end(String(error));
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const addr = server.address();
      const actualPort = typeof addr === 'object' && addr ? addr.port : port;
      resolve({
        server,
        host,
        port: actualPort,
        baseUrl: `http://${host}:${actualPort}`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

function arg(name, fallback = '') {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] || fallback;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const root = arg('--root');
  const host = arg('--host', '127.0.0.1');
  const port = Number(arg('--port', '41731'));
  if (!root) {
    console.error('用法: node scripts/preview-server.mjs --root <影片目录> [--host 127.0.0.1] [--port 41731]');
    process.exit(2);
  }
  if (!Number.isFinite(port) || port < 0 || port > 65535) {
    console.error('端口无效。');
    process.exit(2);
  }
  const preview = await startPreviewServer(root, host, port);
  console.log(`[preview] ${preview.baseUrl}`);
  console.log('[preview] 播放器 /  离屏宿主 /render.html  分镜页 /gallery.html');
  console.log('[preview] 按 Ctrl-C 停止。没有安装依赖。');
}
