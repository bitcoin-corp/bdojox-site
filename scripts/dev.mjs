// Local preview WITH the sign-in API (python http.server serves the page but not /api).
// Usage: pnpm dev:api  → http://localhost:4961 . Uses a throwaway session secret unless one is set.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { extname, join, normalize } from 'node:path';

const PORT = Number(process.env.PORT || 4961);
process.env.BWALLETX_ORIGIN ||= `http://localhost:${PORT}`;
process.env.BWALLETX_SESSION_SECRET ||= randomBytes(32).toString('base64');
const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm', '.m4a': 'audio/mp4', '.json': 'application/json' };

createServer(async (req, res) => {
  const url = new URL(req.url, process.env.BWALLETX_ORIGIN);
  const m = url.pathname.match(/^\/api\/auth\/(challenge|verify|session|logout)$/);
  if (m) {
    const mod = await import(`../api/auth/${m[1]}.js`);
    const fn = mod[req.method];
    if (!fn) return res.writeHead(405).end();
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const r = await fn(new Request(url, { method: req.method, headers: req.headers, body: chunks.length ? Buffer.concat(chunks) : undefined }));
    res.writeHead(r.status, Object.fromEntries(r.headers));
    return res.end(Buffer.from(await r.arrayBuffer()));
  }
  let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  if (p.endsWith('/')) p += 'index.html';
  let f = join(root, p);
  if (!(await stat(f).catch(() => null))?.isFile()) f += '.html';
  try {
    const body = await readFile(f);
    res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, () => console.log(`bdojox + sign-in API on ${process.env.BWALLETX_ORIGIN}`));
