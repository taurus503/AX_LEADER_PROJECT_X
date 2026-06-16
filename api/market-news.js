const fs = require("node:fs/promises");
const path = require("node:path");

module.exports = async function handler(_req, res) {
  try {
    const { fetchGoogleNewsContext, parseGoogleNewsRss, summarizeNewsContext } = await import("../src/market-news-provider.mjs");

    try {
      const newsContext = await fetchGoogleNewsContext();
      res.status(200).json({
        ok: true,
        source: "Google News RSS",
        data: newsContext
      });
      return;
    } catch (error) {
      const cachePath = path.join(process.cwd(), "data", "kospi200-news-rss.xml");
      const cachedXml = await fs.readFile(cachePath, "utf8");
      const newsContext = summarizeNewsContext(parseGoogleNewsRss(cachedXml, { limit: 12 }).items);
      res.status(200).json({
        ok: true,
        source: "Google News RSS cache",
        note: `Live request failed, using cache: ${error.message}`,
        data: newsContext
      });
    }
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error.message || "market news unavailable"
    });
  }
};
