function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

export function createAgentState(raw) {
  const currentRegime = raw.currentRegime || {};
  const backtestSummary = raw.backtestSummary || {};
  const transitionMonitor = raw.transitionMonitor || {};
  const investmentCommittee = raw.investmentCommittee || {};
  const marketSnapshot = raw.marketSnapshot || {};

  return {
    agentName: String(raw.agentName || "Market Regime Intelligence Agent"),
    asOf: String(raw.asOf || currentRegime.lastUpdate || "-"),
    currentRegime: {
      name: String(currentRegime.name || "Transition"),
      confidenceScore: toNumber(currentRegime.confidenceScore, 0),
      description: String(currentRegime.description || ""),
      lastUpdate: String(currentRegime.lastUpdate || raw.asOf || "-")
    },
    marketSnapshot: {
      dataDate: String(marketSnapshot.dataDate || raw.asOf?.slice(0, 10) || "-"),
      kospi200: String(marketSnapshot.kospi200 || "-"),
      previousTradingDayDate: String(marketSnapshot.previousTradingDayDate || "-"),
      previousTradingDayKospi200: String(marketSnapshot.previousTradingDayKospi200 || "-"),
      dailyChangeRate: toNumber(marketSnapshot.dailyChangeRate, 0),
      historicalVolatility: toNumber(marketSnapshot.historicalVolatility, 0),
      vix: String(marketSnapshot.vix || "-"),
      newsTone: String(marketSnapshot.newsTone || "-"),
      breadth: String(marketSnapshot.breadth || "-")
    },
    transitionMonitor: {
      previousRegime: String(transitionMonitor.previousRegime || "-"),
      currentRegime: String(transitionMonitor.currentRegime || currentRegime.name || "-"),
      transitionProbability: toNumber(transitionMonitor.transitionProbability, 0),
      trendDirection: String(transitionMonitor.trendDirection || "-")
    },
    backtestSummary: {
      cagr: toNumber(backtestSummary.cagr, 0),
      sharpeRatio: toNumber(backtestSummary.sharpeRatio, 0),
      maxDrawdown: toNumber(backtestSummary.maxDrawdown, 0),
      winRate: toNumber(backtestSummary.winRate, 0)
    },
    recommendedStrategies: asArray(raw.recommendedStrategies).slice(0, 9),
    avoidStrategies: asArray(raw.avoidStrategies).slice(0, 6),
    investmentCommittee: {
      marketReasoning: String(investmentCommittee.marketReasoning || ""),
      strategyReasoning: String(investmentCommittee.strategyReasoning || ""),
      riskFactors: asArray(investmentCommittee.riskFactors),
      committeeOpinion: String(investmentCommittee.committeeOpinion || "")
    }
  };
}
