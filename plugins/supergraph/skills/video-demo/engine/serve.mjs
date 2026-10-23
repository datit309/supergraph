#!/usr/bin/env node
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

/**
 * Serves the pinned build, because a demo must not be filmed against a dev
 * server, nor against a directory the rest of the repo rebuilds.
 *
 * This replaced the app's own dev server for one reason, learned twice in one
 * afternoon: a dev server's module graph belongs to whoever is editing the
 * source. Two full corpus runs died mid-flight because another session touched
 * the app's source and an install rewrote `node_modules` underneath the
 * bundler, and both times the symptom was scenes failing on a page that never
 * rendered, which looks exactly like a broken scene. A build cannot be
 * invalidated by a keystroke. It is also what anybody actually ships, so the
 * corpus is now of the production bundle rather than of a development one.
 *
 * Route resolution follows `nginx.conf` deliberately, so what is filmed
 * matches what is deployed: a real file wins, then a directory's own
 * `index.html` (which is what a prerendered page is), and only then the SPA
 * shell. Getting that order wrong would serve the shell over a prerendered
 * page and film a client-side render of something the deployment serves as
 * static HTML.
 */

const ROOT = resolve(process.argv[2] ?? 'demo/.build');
const PORT = Number(process.env.DEMO_PORT ?? process.argv[3] ?? 5499);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

async function fileAt(path) {
  const found = await stat(path).catch(() => null);
  return found?.isFile() ? path : null;
}

/**
 * `..` is stripped before the path is joined, not after. A studio server is
 * only ever reachable from localhost, but a path traversal that reads outside
 * the build directory is not a thing to leave lying around because of who
 * happens to be calling today.
 */
function inside(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(
    /^(\.\.[/\\])+/,
    ''
  );
  const full = join(ROOT, clean);
  return full.startsWith(ROOT) ? full : ROOT;
}

async function resolveFile(pathname) {
  const full = inside(pathname);

  return (
    (await fileAt(full)) ??
    (await fileAt(join(full, 'index.html'))) ??
    (await fileAt(join(ROOT, 'index.html')))
  );
}

const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;

  void resolveFile(pathname).then((file) => {
    if (!file) {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('not found');
      return;
    }

    response.writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      // Hashed assets are immutable; the shell must never be, or a rebuilt
      // corpus films the previous build out of the browser's own cache.
      'cache-control': file.endsWith('index.html')
        ? 'no-store'
        : 'public, max-age=31536000, immutable',
    });

    createReadStream(file).pipe(response);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`demo studio serving ${ROOT} on ${PORT}\n`);
});
