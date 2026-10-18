/**
 * Tiny static server for local preview: `npm run serve` → http://localhost:8080
 * (any web server works; this one only exists so no extra tool is needed).
 * Unknown URLs get 404.html, like the .htaccess rule on the real host.
 */
import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT) || 8080;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8",
};

function fileFor(url) {
  const path = normalize(decodeURIComponent(new URL(url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  let file = join(root, path);
  try {
    if (statSync(file).isDirectory()) file = join(file, "index.html");
    statSync(file);
    return file;
  } catch {
    return null;
  }
}

createServer((req, res) => {
  const file = fileFor(req.url);
  const target = file ?? join(root, "404.html");
  const type = TYPES[extname(target)] ?? "application/octet-stream";
  const size = statSync(target).size;
  // Byte ranges: browsers (Safari above all) fetch videos in pieces
  const range = file && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      res.writeHead(416, { "Content-Range": `bytes */${size}` });
      return res.end();
    }
    res.writeHead(206, { "Content-Type": type, "Content-Length": end - start + 1, "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes" });
    return createReadStream(target, { start, end }).pipe(res);
  }
  res.writeHead(file ? 200 : 404, { "Content-Type": type, "Content-Length": size, "Accept-Ranges": "bytes" });
  createReadStream(target).pipe(res);
}).listen(port, () => console.log(`Maso preview → http://localhost:${port}`));
