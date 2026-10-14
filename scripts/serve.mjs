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
  const status = file ? 200 : 404;
  const target = file ?? join(root, "404.html");
  res.writeHead(status, { "Content-Type": TYPES[extname(target)] ?? "application/octet-stream" });
  createReadStream(target).pipe(res);
}).listen(port, () => console.log(`Maso preview → http://localhost:${port}`));
