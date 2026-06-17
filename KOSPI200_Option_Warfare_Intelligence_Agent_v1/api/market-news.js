const fs = require("node:fs/promises");
const path = require("node:path");

module.exports = async function handler(req, res) {
  try {
    const { fetchGoogleNewsContext, summarizeNewsContext } = await import("../src/market-news-provider.mjs");
    const requestUrl = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
    const offset = Math.max(0, Number(requestUrl.searchParams.get("offset") || 0));

    try {
      const newsContext = await fetchGoogleNewsContext();
      const page = summarizeNewsContext(newsContext.allItems || [], { offset, pageSize: 3 });
      res.status(200).json({ ok: true, source: "Google News RSS", data: page });
      return;
    } catch (error) {
      const cachePath = path.join(process.cwd(), "sample-data.json");
      const cached = JSON.parse(await fs.readFile(cachePath, "utf8"));
      const news = cached.news || {};
      const items = Array.isArray(news.items) ? news.items : [];
      const page = summarizeNewsContext(items, { offset, pageSize: 3 });
      page.keywords = news.keywords || page.keywords;
      page.asOf = news.asOf || page.asOf;
      page.note = `Live request failed, using sample data: ${error.message}`;
      res.status(200).json({ ok: true, source: "sample-data.json", note: page.note, data: page });
    }
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message || "market news unavailable" });
  }
};
