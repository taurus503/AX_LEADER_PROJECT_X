const fs = require("node:fs/promises");
const path = require("node:path");

module.exports = async function handler(req, res) {
  try {
    const { fetchGoogleNewsContext, summarizeNewsContext } = await import("../src/market-news-provider.mjs");
    const requestUrl = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
    const offset = Math.max(0, Number(requestUrl.searchParams.get("offset") || 0));
    const asOf = String(requestUrl.searchParams.get("asOf") || "").slice(0, 10);

    try {
      const newsContext = await fetchGoogleNewsContext(fetch, { asOf });
      const page = summarizeNewsContext(newsContext.allItems || [], { offset, pageSize: 3, asOf: asOf || newsContext.asOf });
      res.status(200).json({ ok: true, source: "Google News RSS", data: page });
      return;
    } catch (error) {
      const cachePath = path.join(process.cwd(), "sample-data.json");
      const cached = JSON.parse(await fs.readFile(cachePath, "utf8"));
      const news = cached.news || {};
      const items = Array.isArray(news.items) ? news.items : [];
      const fallbackDate = asOf || news.asOf || "";
      const page = summarizeNewsContext(items.map((item) => ({
        ...item,
        publishedAt: fallbackDate || item.publishedAt || ""
      })), { offset, pageSize: 3, asOf: fallbackDate });
      page.keywords = news.keywords || page.keywords;
      page.asOf = fallbackDate || page.asOf;
      page.note = `Live request failed, using sample data: ${error.message}`;
      res.status(200).json({ ok: true, source: "sample-data.json", note: page.note, data: page });
    }
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message || "market news unavailable" });
  }
};
