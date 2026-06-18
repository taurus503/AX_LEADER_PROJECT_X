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

async function readSampleData() {
  const cachePath = path.join(process.cwd(), "sample-data.json");
  const raw = await fs.readFile(cachePath, "utf8");
  return JSON.parse(raw);
}

function buildMemoryRecord(analysis) {
  return {
    regime: analysis?.regime?.label || "",
    strategy: analysis?.strategy?.top?.[0] || "",
    result: analysis?.validation?.status || "REVIEW",
    validation_label: analysis?.validation?.status || "REVIEW",
    timestamp: new Date().toISOString()
  };
}

module.exports = async function handler(req, res) {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
    const symbol = requestUrl.searchParams.get("symbol") || "^KS200";
    const asOf = normalizeDateInput(requestUrl.searchParams.get("asOf")) || getDefaultTradingDate();
    const sampleData = await readSampleData();
    const sampleMarket = sampleData.market || sampleData.marketData || {};
    const sampleNews = sampleData.news || {};

    let market = {
      ...sampleMarket,
      asOf,
      symbol,
      source: "sample-data.json",
      note: "Using sample data"
    };

    try {
      const { fetchYahooMarketFeatures } = await import("../src/market-data-provider.mjs");
      const liveMarket = await fetchYahooMarketFeatures(symbol, fetch, { asOf });
      market = {
        ...liveMarket,
        source: "Yahoo Finance chart endpoint",
        note: liveMarket.note || ""
      };
    } catch (error) {
      market = {
        ...market,
        note: `Live market load failed, using sample data: ${error.message}`
      };
    }

    let news = {
      asOf,
      keywords: Array.isArray(sampleNews.keywords) ? sampleNews.keywords : [],
      sentiment: sampleNews.sentiment || market.newsSentiment || "neutral",
      pageInfo: { offset: 0, pageSize: 3, startRank: 0, endRank: 0, total: 0 },
      topItems: Array.isArray(sampleNews.items) ? sampleNews.items.slice(0, 3) : [],
      source: "sample-data.json",
      note: "Using sample news"
    };

    try {
      const { fetchGoogleNewsContext, summarizeNewsContext } = await import("../src/market-news-provider.mjs");
      const liveNews = await fetchGoogleNewsContext();
      news = {
        ...summarizeNewsContext(liveNews.allItems || [], { offset: 0, pageSize: 3 }),
        source: liveNews.provider || "Google News RSS",
        note: ""
      };
    } catch (error) {
      news = {
        ...news,
        note: `Live news load failed, using sample data: ${error.message}`
      };
    }

    const { analyzeRegime } = await import("../src/market-regime-engine.mjs");
    const input = {
      symbol,
      asOf: market.asOf || asOf,
      latestClose: market.latestClose ?? null,
      previousClose: market.previousTradingDayClose ?? null,
      historicalVolatility: market.historicalVolatility ?? market.volatility20d ?? null,
      returns: market.returns || sampleMarket.returns || { oneDay: 0, oneWeek: 0, oneMonth: 0 },
      volatility20d: market.volatility20d ?? sampleMarket.volatility20d ?? 0,
      trendStrength: market.trendStrength ?? sampleMarket.trendStrength ?? 0,
      eventRisk: market.eventRisk || sampleMarket.eventRisk || "medium",
      newsSentiment: news.sentiment || market.newsSentiment || sampleMarket.newsSentiment || "neutral",
      breadth: market.breadth || sampleMarket.breadth || "neutral",
      slem: market.slem ?? sampleMarket.slem ?? 0,
      gelmanRubin: market.gelmanRubin ?? sampleMarket.gelmanRubin ?? 1,
      tradabilityMaskValid: market.tradabilityMaskValid ?? sampleMarket.tradabilityMaskValid ?? true
    };

    const analysis = analyzeRegime(input);
    const payload = {
      ok: true,
      source: market.source || "sample-data.json",
      asOf: input.asOf,
      input,
      market,
      news,
      analysis,
      current_regime: analysis.regime.label,
      confidence_score: analysis.confidence.score,
      event_risk: input.eventRisk,
      market_interpretation: analysis.marketInterpretation,
      regime_reason: analysis.regimeReason,
      recommended_strategy: analysis.strategy.top?.[0] || "",
      top_recommended: analysis.strategy.top || [],
      avoid_now: analysis.strategy.avoid || [],
      strategy_score: analysis.strategy.displayTopNine?.[0]?.strategyScore || analysis.strategy.recommended?.[0]?.strategyScore || 0,
      risk_level: analysis.strategy.displayTopNine?.[0]?.riskLevel || analysis.strategy.recommended?.[0]?.riskLevel || "Medium",
      expected_return: analysis.strategy.displayTopNine?.[0]?.expectedReturn || analysis.strategy.recommended?.[0]?.expectedReturn || "",
      playbook_mapping: analysis.strategy.displayTopNine?.[0]?.playbookMapping || analysis.strategy.recommended?.[0]?.playbookMapping || "",
      validation_label: analysis.validation.status,
      validation_score: analysis.validation.score,
      risk_warning: analysis.validation.riskWarning,
      validation_comment: analysis.validation.comment,
      validation_details: analysis.validation.details || analysis.validation,
      attribution: analysis.attribution,
      committee: analysis.committee,
      battle_plan: analysis.battlePlan,
      report: [
        `[${analysis.regime.label}] regime snapshot`,
        `confidence=${Math.round(analysis.confidence.score * 100)}%`,
        `strategy=${analysis.strategy.top?.[0] || ""}`,
        `validation=${analysis.validation.status}`
      ].join(" | "),
      memory_record: buildMemoryRecord(analysis),
      beginner_examples: sampleData.beginnerExamples || [],
      generated_at: new Date().toISOString()
    };

    res.status(200).json(payload);
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message || "agent snapshot unavailable" });
  }
};
