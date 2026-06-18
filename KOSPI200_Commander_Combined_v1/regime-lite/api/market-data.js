const fs = require("node:fs/promises");
const path = require("node:path");

function normalizeDateInput(value) {
  const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

function getDefaultTradingDate(referenceDate = new Date()) {
  const date = new Date(referenceDate);
  date.setDate(date.getDate() - 1);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() - 1);
  }
  return date.toISOString().slice(0, 10);
}

module.exports = async function handler(req, res) {
  try {
    const { fetchYahooMarketFeatures, computeFeaturesFromPrices, parseYahooChartResponse } = await import("../src/market-data-provider.mjs");
    const requestUrl = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
    const symbol = requestUrl.searchParams.get("symbol") || "^KS200";
    const asOf = normalizeDateInput(requestUrl.searchParams.get("asOf")) || getDefaultTradingDate();

    try {
      const features = await fetchYahooMarketFeatures(symbol, fetch, { asOf });
      res.status(200).json({ ok: true, source: "Yahoo Finance chart endpoint", data: features });
      return;
    } catch (error) {
      const cachePath = path.join(process.cwd(), "sample-data.json");
      const cached = JSON.parse(await fs.readFile(cachePath, "utf8"));
      const market = cached.market || cached.marketData || {};
      const features = {
        ...market,
        asOf,
        source: "sample-data.json",
        note: `Live request failed, using sample data: ${error.message}`
      };
      res.status(200).json({ ok: true, source: "sample-data.json", note: features.note, data: features });
    }
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message || "market data unavailable" });
  }
};
