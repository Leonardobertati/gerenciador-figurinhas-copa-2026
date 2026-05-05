import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const PORT = Number(process.env.PORT || 4173);
const ROOT = process.cwd();

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".sql": "text/plain; charset=utf-8"
};

http
  .createServer((request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    const cleanPath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    let filePath = normalize(join(ROOT, cleanPath || "index.html"));

    if (!filePath.startsWith(ROOT)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = join(filePath, "index.html");
    }

    if (!existsSync(filePath)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": types[extname(filePath)] || "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
  })
  .listen(PORT, () => {
    console.log(`Servidor em http://localhost:${PORT}`);
  });
