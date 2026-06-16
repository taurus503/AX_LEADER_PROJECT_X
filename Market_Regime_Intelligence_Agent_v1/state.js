function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clampPercent(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
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
      confidenceScore: Number(currentRegime.confidenceScore || 0),
      description: String(currentRegime.description || ""),
      lastUpdate: String(currentRegime.lastUpdate || raw.asOf || "-")
    },
    marketSnapshot: {
      kospi200: String(marketSnapshot.kospi200 || "-"),
      vix: String(marketSnapshot.vix || "-"),
      newsTone: String(marketSnapshot.newsTone || "-"),
      breadth: String(marketSnapshot.breadth || "-")
    },
    transitionMonitor: {
      previousRegime: String(transitionMonitor.previousRegime || "-"),
      currentRegime: String(transitionMonitor.currentRegime || currentRegime.name || "-"),
      transitionProbability: clampPercent((Number(transitionMonitor.transitionProbability || 0) || 0) * 100),
      trendDirection: String(transitionMonitor.trendDirection || "-")
    },
    backtestSummary: {
      cagr: Number(backtestSummary.cagr || 0),
      sharpeRatio: Number(backtestSummary.sharpeRatio || 0),
      maxDrawdown: Number(backtestSummary.maxDrawdown || 0),
      winRate: Number(backtestSummary.winRate || 0)
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
