const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const API_URL = "https://dripclientofficial.dev/api/v1/products";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/api/products") {
    try {
      const headers = { "Accept": "application/json" };
      // Public catalog works without a key. A new key can optionally request account-tier prices.
      if (process.env.DRIP_API_KEY) {
        headers["Authorization"] = `Bearer ${process.env.DRIP_API_KEY}`;
      }

      const upstream = await fetch(API_URL, { headers, signal: AbortSignal.timeout(15000) });
      const raw = await upstream.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { message: "API returned a non-JSON response." };
      }

      if (!upstream.ok) {
        return sendJson(res, upstream.status, {
          error: "API provider returned an error.",
          status: upstream.status,
          details: data
        });
      }
      return sendJson(res, 200, data);
    } catch (err) {
      return sendJson(res, 502, {
        error: "Could not connect to Drip API.",
        details: err.name === "TimeoutError" ? "Request timed out." : "Check server internet access and API availability."
      });
    }
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const filePath = path.resolve(PUBLIC_DIR, "." + pathname);
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, contents) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }
    res.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });
    res.end(contents);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Toko Digital running on port ${PORT}`);
});