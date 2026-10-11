#!/usr/bin/env node
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { resolve, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
let port = 4173;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--help" || args[i] === "-h") {
    console.log(
      "Usage: unwedged [--port PORT]\nServe the Unwedged app on loopback.",
    );
    process.exit(0);
  }
  if (args[i] === "--port" && args[i + 1]) {
    port = Number(args[++i]);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      console.error("Port must be between 1 and 65535");
      process.exit(2);
    }
  } else {
    console.error(`Unknown option: ${args[i]}`);
    process.exit(2);
  }
}
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".json": "application/json",
};
const server = createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`)
        .pathname,
    );
  } catch {
    res.writeHead(400).end("Bad request");
    return;
  }
  const candidate = resolve(root, `.${pathname}`);
  if (candidate !== root && !candidate.startsWith(root + sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  let file = candidate;
  try {
    if (statSync(file).isDirectory()) file = resolve(file, "index.html");
    statSync(file);
  } catch {
    file = resolve(root, "index.html");
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader(
    "Content-Type",
    mime[extname(file)] ?? "application/octet-stream",
  );
  createReadStream(file)
    .on("error", () => res.writeHead(404).end())
    .pipe(res);
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Unwedged available at http://127.0.0.1:${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
