import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import {
  computeFeaturesFromPrices,
  fetchYahooMarketFeatures,
  parseYahooChartResponse
} from "../src/market-data-provider.mjs";
import {
  fetchGoogleNewsContext,
  parseGoogleNewsRss,
  summarizeNewsContext
} from "../src/market-news-provider.mjs";

const root = process.cwd();
const port = Number(process.argv[2] || 4173);
const cachePath = join(root, "data", "kospi200-yahoo-chart.json");
const newsCachePath = join(root, "data", "kospi200-news-rss.xml");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function safePath(urlPath) {
  const requested = decodeURIComponent(urlPath.split("?")[0]);
  const relative = requested === "/" ? "market-regime-demo.html" : requested.replace(/^\/+/, "");
  const resolved = normalize(join(root, relative));
  return resolved.startsWith(root) ? resolved : null;
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);

  if (requestUrl.pathname === "/api/market-data") {
    try {
      const symbol = requestUrl.searchParams.get("symbol") || "^KS200";
      const asOf = requestUrl.searchParams.get("asOf") || requestUrl.searchParams.get("date") || undefined;
      const features = await fetchYahooMarketFeatures(symbol, fetch, { asOf });
      response.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      });
      response.end(JSON.stringify({
        ok: true,
        source: "Yahoo Finance chart endpoint",
        note: "로컬 데모용 공개 가격 데이터입니다. 운영 적용 시 KRX/증권사 계약 데이터로 교체하세요.",
        data: features
      }));
    } catch (error) {
      try {
        const cached = JSON.parse(await readFile(cachePath, "utf8"));
        const features = computeFeaturesFromPrices(parseYahooChartResponse(cached), {
          asOf: requestUrl.searchParams.get("asOf") || requestUrl.searchParams.get("date") || undefined
        });
        response.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        });
        response.end(JSON.stringify({
          ok: true,
          source: "Yahoo Finance chart endpoint cache",
          note: `실시간 호출 실패로 캐시 데이터를 사용했습니다: ${error.message}`,
          data: features
        }));
      } catch (cacheError) {
        response.writeHead(502, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        });
        response.end(JSON.stringify({
          ok: false,
          error: `${error.message}; cache unavailable: ${cacheError.message}`,
          fallback: "preset"
        }));
      }
    }
    return;
  }

  if (requestUrl.pathname === "/api/market-news") {
    try {
      const newsContext = await fetchGoogleNewsContext();
      response.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      });
      response.end(JSON.stringify({
        ok: true,
        source: "Google News RSS",
        note: "최근 KOSPI200 관련 공개 뉴스/RSS 결과입니다. 내부 리포트 연계 시 사내 리서치 원천으로 교체하세요.",
        data: newsContext
      }));
    } catch (error) {
      try {
        const cachedXml = await readFile(newsCachePath, "utf8");
        const newsContext = summarizeNewsContext(parseGoogleNewsRss(cachedXml, { limit: 12 }).items);
        response.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        });
        response.end(JSON.stringify({
          ok: true,
          source: "Google News RSS cache",
          note: `실시간 뉴스 호출 실패로 캐시를 사용했습니다: ${error.message}`,
          data: newsContext
        }));
      } catch (cacheError) {
        response.writeHead(502, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        });
        response.end(JSON.stringify({
          ok: false,
          error: `${error.message}; cache unavailable: ${cacheError.message}`,
          fallback: "manual"
        }));
      }
    }
    return;
  }

  const filePath = safePath(request.url || "/");

  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(body);
  } catch (_error) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Market Regime demo: http://127.0.0.1:${port}/market-regime-demo.html`);
});
