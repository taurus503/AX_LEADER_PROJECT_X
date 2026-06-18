import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const commanderRoot = path.resolve(process.cwd());
const kospiRoot = path.resolve(process.cwd(), "..", "KOSPI200_Option_Warfare_Intelligence_Agent_v1");
const port = Number(process.env.PORT || 3000);

async function loadEnv(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx < 0) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

await loadEnv(path.join(commanderRoot, ".env"));
process.env.KOSPI200_AGENT_JSON_URL = `http://127.0.0.1:${port}/api/agent-result`;

const commanderMod = await import(pathToFileURL(path.join(commanderRoot, "api", "commander.js")).href);
const commanderHandler = commanderMod.default || commanderMod;
const kospiMod = await import(pathToFileURL(path.join(kospiRoot, "api", "agent-result.js")).href);
const kospiHandler = kospiMod.default || kospiMod;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function wrapResponse(res) {
  return {
    status(code) {
      res.statusCode = code;
      return this;
    },
    setHeader(key, value) {
      res.setHeader(key, value);
    },
    end(body) {
      res.end(body);
    }
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname === "/api/commander") {
      await commanderHandler(req, wrapResponse(res));
      return;
    }
    if (url.pathname === "/api/agent-result") {
      await kospiHandler(req, wrapResponse(res));
      return;
    }

    const targetPath = path.normalize(path.join(commanderRoot, url.pathname === "/" ? "index.html" : url.pathname.replace(/^\//, "")));
    if (!targetPath.startsWith(commanderRoot)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    const stat = await fs.stat(targetPath).catch(() => null);
    if (!stat || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(targetPath).toLowerCase();
    const body = await fs.readFile(targetPath);
    res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(body);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(String(error?.stack || error));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`preview server running at http://127.0.0.1:${port}`);
});

