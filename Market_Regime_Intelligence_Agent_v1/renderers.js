function el(id) {
  return document.getElementById(id);
}

function formatPercent(value, digits = 0) {
  return `${Number(value).toFixed(digits)}%`;
}

function formatDecimal(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function renderCards(targetId, items, mapper) {
  const target = el(targetId);
  if (!target) return;
  target.innerHTML = items.map(mapper).join("");
}

export function renderHeaderMetrics(state) {
  const current = el("kospi200-value");
  const previous = el("kospi200-prev-value");
  const dataDate = el("market-data-date");

  if (current) current.textContent = state.marketSnapshot.kospi200;
  if (previous) previous.textContent = state.marketSnapshot.previousTradingDayKospi200;
  if (dataDate) dataDate.textContent = state.marketSnapshot.dataDate;
}

export function renderCurrentRegime(state) {
  const tag = el("current-regime-tag");
  const name = el("current-regime-name");
  const description = el("current-regime-description");
  const lastUpdate = el("current-regime-last-update");
  const confidenceLabel = el("current-regime-confidence-label");
  const confidenceRing = el("confidence-ring");
  const confidenceValue = el("confidence-value");

  if (tag) tag.textContent = state.currentRegime.name;
  if (name) name.textContent = state.currentRegime.name;
  if (description) description.textContent = state.currentRegime.description;
  if (lastUpdate) lastUpdate.textContent = `Last Update: ${state.currentRegime.lastUpdate}`;
  if (confidenceLabel) confidenceLabel.textContent = `Confidence: ${formatPercent(state.currentRegime.confidenceScore * 100)}`;

  const percent = `${Math.round(state.currentRegime.confidenceScore * 100)}%`;
  if (confidenceRing) confidenceRing.style.setProperty("--confidence", percent);
  if (confidenceValue) confidenceValue.textContent = percent;
}

export function renderMarketSnapshot(state) {
  renderCards("market-snapshot", [
    ["기준일", state.marketSnapshot.dataDate],
    ["KOSPI200 종가", state.marketSnapshot.kospi200],
    ["전일 종가", state.marketSnapshot.previousTradingDayKospi200],
    ["증감율", `${state.marketSnapshot.dailyChangeRate >= 0 ? "+" : ""}${formatDecimal(state.marketSnapshot.dailyChangeRate, 2)}%`],
    ["역사적 변동성", `${formatDecimal(state.marketSnapshot.historicalVolatility, 2)}%`]
  ], ([label, value]) => `
    <div class="kpi">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `);
}

export function renderTransitionMonitor(state) {
  renderCards("transition-monitor", [
    ["Previous Regime", state.transitionMonitor.previousRegime],
    ["Current Regime", state.transitionMonitor.currentRegime],
    ["Transition Probability", formatPercent(state.transitionMonitor.transitionProbability)],
    ["Trend Direction", state.transitionMonitor.trendDirection]
  ], ([label, value]) => `
    <div class="monitor-item">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `);
}

export function renderBacktestSummary(state) {
  renderCards("backtest-summary", [
    ["CAGR", formatPercent(state.backtestSummary.cagr * 100, 1)],
    ["Sharpe Ratio", formatDecimal(state.backtestSummary.sharpeRatio, 2)],
    ["Max Drawdown", formatPercent(state.backtestSummary.maxDrawdown * 100, 1)],
    ["Win Rate", formatPercent(state.backtestSummary.winRate * 100, 1)]
  ], ([label, value]) => `
    <div class="backtest-metric">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `);
}

function renderStrategyCard(strategy, kind) {
  const reasonKey = kind === "avoid" ? "avoidReason" : "marketOutlook";
  const labelClass = kind === "avoid" ? "red" : "green";
  const riskClass = /high|very/i.test(strategy.riskLevel) ? "red" : kind === "avoid" ? "amber" : "green";

  return `
    <article class="${kind === "avoid" ? "avoid-card" : "strategy-card"}">
      <div class="meta-row">
        <span class="tag ${labelClass}">${kind === "avoid" ? "Avoid" : "Recommended"}</span>
        <span class="meta-chip ${riskClass}">Risk Level: ${strategy.riskLevel}</span>
      </div>
      <h4>${strategy.name}</h4>
      <p class="subtle-note">${strategy[reasonKey]}</p>
      ${kind === "avoid" ? "" : `<div class="meta-row"><span class="meta-chip">Expected Return: ${strategy.expectedReturn}</span></div>`}
      <button class="open-playbook" type="button" data-playbook="${strategy.name}">${strategy.openPlaybook}</button>
    </article>
  `;
}

export function renderRecommendedStrategies(state) {
  renderCards("recommended-strategies", state.recommendedStrategies, (strategy) => renderStrategyCard(strategy, "recommended"));
}

export function renderAvoidStrategies(state) {
  renderCards("avoid-strategies", state.avoidStrategies, (strategy) => renderStrategyCard(strategy, "avoid"));
}

export function renderCommitteeView(state) {
  const marketReasoning = el("committee-market-reasoning");
  const strategyReasoning = el("committee-strategy-reasoning");
  const riskList = el("committee-risk-list");
  const opinion = el("committee-opinion");

  if (marketReasoning) marketReasoning.textContent = state.investmentCommittee.marketReasoning;
  if (strategyReasoning) strategyReasoning.textContent = state.investmentCommittee.strategyReasoning;
  if (opinion) opinion.textContent = state.investmentCommittee.committeeOpinion;
  if (riskList) {
    riskList.innerHTML = state.investmentCommittee.riskFactors.map((risk) => `<li>${risk}</li>`).join("");
  }
}
