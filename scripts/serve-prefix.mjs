import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = resolve("dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};
const server = createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
  } catch {
    response.writeHead(400).end();
    return;
  }
  if (!pathname.startsWith("/Unwedged/")) {
    response.writeHead(404).end();
    return;
  }
  const candidate = resolve(root, `.${pathname.slice("/Unwedged".length)}`);
  if (candidate !== root && !candidate.startsWith(root + sep)) {
    response.writeHead(403).end();
    return;
  }
  let file = candidate;
  try {
    if (statSync(file).isDirectory()) file = resolve(file, "index.html");
    statSync(file);
  } catch {
    if (request.headers.accept?.includes("text/html"))
      file = resolve(root, "index.html");
    else {
      response.writeHead(404).end();
      return;
    }
  }
  response.setHeader(
    "Content-Type",
    types[extname(file)] ?? "application/octet-stream",
  );
  createReadStream(file).pipe(response);
});
server.listen(4176, "127.0.0.1");
