import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

const [rootArg, portArg = "8080", hostArg = "127.0.0.1"] = process.argv.slice(2);
if (!rootArg) {
  console.error("Usage: node scripts/serve.mjs <folder> [port] [host]");
  process.exit(1);
}

const root = path.resolve(process.cwd(), rootArg);
const port = Number(portArg);
const host = hostArg;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer(async (req, res) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
  };
  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, headers);
    res.end("Method not allowed");
    return;
  }
  try {
    const url = new URL(req.url || "/", `http://${host}:${port}`);
    const decoded = decodeURIComponent(url.pathname);
    let file = path.resolve(root, `.${decoded}`);
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
      res.writeHead(403, headers);
      res.end("Forbidden");
      return;
    }
    let info = await stat(file).catch(() => null);
    if (info?.isDirectory()) {
      file = path.join(file, "index.html");
      info = await stat(file).catch(() => null);
    }
    if (!info?.isFile()) {
      res.writeHead(404, headers);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      ...headers,
      "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": info.size,
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(file).pipe(res);
  } catch (error) {
    res.writeHead(500, headers);
    res.end(`Server error: ${error.message}`);
  }
});

server.listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}/`);
});
