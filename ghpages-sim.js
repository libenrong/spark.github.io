// Emulates GitHub Pages static hosting: serves files from out/ mounted at
// basePath, and falls back to 404.html (with status 404) for missing paths.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'out');
const BASE = '/spark-viewer';
const PORT = 4173;

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
};

function send(res, status, file) {
    const ext = path.extname(file);
    fs.readFile(file, (err, buf) => {
        if (err) {
            res.writeHead(404, { 'content-type': 'text/plain' });
            res.end('not found');
            return;
        }
        res.writeHead(status, {
            'content-type': TYPES[ext] || 'application/octet-stream',
            'cache-control': 'no-cache',
        });
        res.end(buf);
    });
}

http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (!p.startsWith(BASE)) {
        // GH Pages would 404 for other top-level paths
        const fallback = path.join(ROOT, '404.html');
        return send(res, 404, fallback);
    }
    p = p.slice(BASE.length) || '/';
    let file = path.join(ROOT, p);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file)) {
        // GH Pages serves foo.html for /foo, else 404.html
        if (fs.existsSync(file + '.html')) {
            return send(res, 200, file + '.html');
        }
        return send(res, 404, path.join(ROOT, '404.html'));
    }
    send(res, 200, file);
}).listen(PORT, () => console.log('gh-pages sim on http://localhost:' + PORT + BASE + '/'));
