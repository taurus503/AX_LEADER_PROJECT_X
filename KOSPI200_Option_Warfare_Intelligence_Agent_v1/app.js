import { analyzeRegime, SCENARIOS } from "./src/market-regime-engine.mjs";
import {
  computeFeaturesFromPrices,
  fetchYahooMarketFeatures,
  getDefaultTradingDate,
  normalizeDateInput,
  parseYahooChartResponse
} from "./src/market-data-provider.mjs";
import {
  fetchGoogleNewsContext,
  parseGoogleNewsRss,
  summarizeNewsContext
} from "./src/market-news-provider.mjs";
import { answerBeginnerQuestion } from "./src/beginner-question.mjs";
import { copyTextWithFallback } from "./src/clipboard-copy.mjs";

const nodes = {};
let sampleData = null;
let marketState = null;
let newsState = null;
let analysis = null;
let currentScenario = "transition";
let newsOffset = 0;

function byId(id) {
  nodes[id] ||= document.getElementById(id);
  return nodes[id];
}

function formatPercent(value, digits = 1) {
  const number = Number(value || 0);
  return `${number.toFixed(digits)}%`;
}

function setText(id, value) {
  const node = byId(id);
  if (node) node.textContent = value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function scenarioTiles() {
  return [
    ["bullCalm", "Bull/Calm", "방향성 우위, 변동성 안정"],
    ["bearCrisis", "Bear/Crisis", "하락 압력, 방어 우선"],
    ["transition", "Transition", "방향 불명확, 검토 필요"],
    ["custom", "Custom", "직접 입력 / 수정"]
  ];
}

function getScenarioPreset(key) {
  if (key === "custom") return null;
  return sampleData?.scenarios?.[key] || SCENARIOS[key] || SCENARIOS.transition;
}

function applyScenarioInputs(key) {
  const preset = getScenarioPreset(key);
  if (!preset) {
    currentScenario = "custom";
    setText("scenario-status", "Custom");
    return;
  }
  currentScenario = key;
  byId("input-oneDay").value = preset.returns.oneDay;
  byId("input-oneWeek").value = preset.returns.oneWeek;
  byId("input-oneMonth").value = preset.returns.oneMonth;
  byId("input-volatility20d").value = preset.volatility20d;
  byId("input-trendStrength").value = preset.trendStrength;
  byId("input-eventRisk").value = preset.eventRisk;
  byId("input-newsSentiment").value = preset.newsSentiment;
  byId("input-breadth").value = preset.breadth;
  byId("input-slem").value = preset.slem;
  byId("input-gelmanRubin").value = preset.gelmanRubin;
  byId("input-tradabilityMaskValid").checked = preset.tradabilityMaskValid;
  if (preset.asOf) byId("market-date-input").value = preset.asOf;
  setText("scenario-status", preset.label || key);
  renderScenarioButtons();
}

function renderScenarioButtons() {
  const container = byId("scenario-tiles");
  if (!container) return;
  container.innerHTML = scenarioTiles().map(([key, title, desc]) => `
    <button class="scenario-button ${currentScenario === key ? "active" : ""}" type="button" data-scenario="${key}">
      <div>${title}</div>
      <small>${desc}</small>
    </button>
  `).join("");
}

function buildInputState() {
  return {
    symbol: "^KS200",
    label: currentScenario === "custom" ? "Custom" : (getScenarioPreset(currentScenario)?.label || "Transition"),
    asOf: normalizeDateInput(byId("market-date-input")?.value) || getDefaultTradingDate(),
    latestClose: marketState?.latestClose ?? sampleData?.market?.latestClose ?? null,
    previousClose: marketState?.previousTradingDayClose ?? sampleData?.market?.previousTradingDayClose ?? null,
    historicalVolatility: marketState?.historicalVolatility ?? sampleData?.market?.historicalVolatility ?? null,
    returns: {
      oneDay: Number(byId("input-oneDay")?.value || 0),
      oneWeek: Number(byId("input-oneWeek")?.value || 0),
      oneMonth: Number(byId("input-oneMonth")?.value || 0)
    },
    volatility20d: Number(byId("input-volatility20d")?.value || 0),
    trendStrength: Number(byId("input-trendStrength")?.value || 0),
    eventRisk: byId("input-eventRisk")?.value || "medium",
    newsSentiment: byId("input-newsSentiment")?.value || "neutral",
    breadth: byId("input-breadth")?.value || "neutral",
    slem: Number(byId("input-slem")?.value || 0),
    gelmanRubin: Number(byId("input-gelmanRubin")?.value || 0),
    tradabilityMaskValid: Boolean(byId("input-tradabilityMaskValid")?.checked),
    newsContext: newsState
  };
}

function renderHeroMetrics(data) {
  const metrics = [
    ["Current Regime", data.regime.label],
    ["Confidence Score", formatPercent(data.confidence.score * 100, 0)],
    ["Event Risk", data.input.eventRisk],
    ["Market Outlook", data.marketInterpretation],
    ["Last Update", data.marketMeta?.lastUpdate || data.input.asOf]
  ];

  byId("hero-metrics").innerHTML = metrics.map(([label, value]) => `
    <div class="metric-card">
      <div class="label">${label}</div>
      <div class="value">${escapeHtml(value)}</div>
      <div class="hint">${escapeHtml(data.regime.tone)}</div>
    </div>
  `).join("");
}

function renderHero(data) {
  byId("hero-regime").innerHTML = `
    <div>
      <p class="eyebrow">Current Regime</p>
      <div class="regime-name">${escapeHtml(data.regime.label)}</div>
      <p class="regime-copy">${escapeHtml(data.marketInterpretation)}</p>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;">
        <span class="event-pill">Event Risk: ${escapeHtml(data.input.eventRisk)}</span>
        <span class="tag-pill medium">Trend: ${data.input.returns.oneWeek >= 0 ? "Sideways / Up" : "Sideways / Down"}</span>
        <span class="tag-pill low">${escapeHtml(data.regime.badge)}</span>
      </div>
    </div>
    <div class="ring" style="--ring-progress:${data.confidence.score * 100}%"><span>${formatPercent(data.confidence.score * 100, 0)}</span></div>
  `;

  byId("hero-summary").innerHTML = `
    <div class="hero-bullets">
      <div class="hero-bullet">
        <strong>Regime Reason</strong>
        <span>${escapeHtml(data.regimeReason)}</span>
      </div>
      <div class="hero-bullet">
        <strong>Module Flow</strong>
        <span>${escapeHtml(data.workflow.join(" → "))}</span>
      </div>
      <div class="hero-bullet">
        <strong>Last Update</strong>
        <span>${escapeHtml(data.marketMeta?.lastUpdate || data.input.asOf)}</span>
      </div>
    </div>
  `;
}

function renderMarketSnapshot(data) {
  const meta = data.marketMeta || {};
  const items = [
    ["기준일", meta.asOf || data.input.asOf, "시장 기준일"],
    ["KOSPI200 종가", meta.latestClose ?? "N/A", "직전 거래일 기준 자동 반영"],
    ["전일 종가", meta.previousTradingDayClose ?? "N/A", "변화율 계산 기준"],
    ["1일 증감률", meta.returns?.oneDay ?? data.input.returns.oneDay, "전일 대비 변화"],
    ["20일 변동성", meta.volatility20d ?? data.input.volatility20d, "역사적 변동성"],
    ["뉴스 심리", meta.newsSentiment || data.input.newsSentiment, "최근 리포트 톤"],
    ["Breadth", meta.breadth || data.input.breadth, "시장 확산도"],
    ["출처", meta.source || "Sample / Live", "자동 업데이트 상태"]
  ];

  byId("market-as-of").textContent = meta.asOf || data.input.asOf;
  byId("market-snapshot").innerHTML = items.map(([label, value, desc]) => `
    <div class="snapshot-card">
      <div class="label">${label}</div>
      <div class="value">${escapeHtml(String(value))}</div>
      <div class="desc">${escapeHtml(desc)}</div>
    </div>
  `).join("");

  const dataStatus = data.marketMeta?.note
    ? `${data.marketMeta.note}`
    : data.marketMeta?.source
      ? `${data.marketMeta.source} 기준으로 ${data.marketMeta.asOf} 데이터를 반영했습니다.`
      : "데이터를 불러오는 중입니다.";
  byId("data-status").textContent = dataStatus;
}

function renderModule1Kpis(data) {
  const kpis = [
    ["Regime", data.regime.label, "시장 국면"],
    ["Confidence", formatPercent(data.confidence.score * 100, 0), "확신도 점수"],
    ["Event Filter", data.input.eventRisk, "이벤트 리스크"],
    ["Interpretation", "Readable", data.marketInterpretation],
    ["Defensive", data.strategy.defensive.join(", "), "방어형 후보"],
    ["Momentum", data.strategy.momentum.join(", "), "추세형 후보"],
    ["Carry", data.strategy.carry.join(", "), "캐리형 후보"],
    ["Balanced", data.strategy.balanced.join(", "), "균형형 후보"]
  ];

  byId("module1-kpis").innerHTML = kpis.map(([label, value, desc]) => `
    <div class="kpi-card">
      <div class="label">${label}</div>
      <div class="value">${escapeHtml(String(value))}</div>
      <div class="desc">${escapeHtml(desc)}</div>
    </div>
  `).join("");
}

function renderConfidence(data) {
  byId("confidence-score-pill").textContent = `${formatPercent(data.confidence.score * 100, 0)} / ${data.confidence.label}`;
  byId("confidence-summary").textContent = data.confidence.summary;
  byId("confidence-label").textContent = data.confidence.label;
  byId("confidence-list").innerHTML = data.confidence.reasons.map((reason) => `
    <div class="reason-card">
      <div class="status-pill ${reason.impact === "plus" ? "pass" : reason.impact === "minus" ? "reject" : "review"}">${reason.impact}</div>
      <div class="title">${escapeHtml(reason.title)}</div>
      <div class="text">${escapeHtml(reason.text)}</div>
    </div>
  `).join("");
}

function renderNews(newsContext) {
  if (!newsContext) {
    byId("news-status").textContent = "뉴스 없음";
    byId("news-keywords").innerHTML = "";
    byId("news-list").innerHTML = "";
    byId("news-sentiment-tag").textContent = "news";
    return;
  }

  const pageInfo = newsContext.pageInfo || {};
  byId("news-sentiment-tag").textContent = newsContext.sentiment || "neutral";
  byId("news-status").textContent = pageInfo.total
    ? `${newsContext.asOf} 기준 ${pageInfo.startRank}-${pageInfo.endRank} / 전체 ${pageInfo.total}`
    : `${newsContext.asOf} 기준 최신 뉴스`;
  byId("news-keywords").innerHTML = (newsContext.keywords || []).slice(0, 8)
    .map((keyword) => `<span class="keyword-chip">${escapeHtml(keyword)}</span>`)
    .join("");
  byId("news-list").innerHTML = (newsContext.topItems || []).map((item, index) => `
    <div class="news-card">
      <div class="meta">Top ${pageInfo.startRank + index}</div>
      <div class="title">${escapeHtml(item.title)}</div>
      <div class="text">${escapeHtml(item.source || "Google News")} · ${escapeHtml(item.publishedAt || "")}</div>
    </div>
  `).join("");
}

function renderValidation(data) {
  const cells = [
    { label: "PASS", value: data.validation.status === "PASS" ? "PASS" : "PASS 후보", cls: "pass" },
    { label: "REVIEW", value: data.validation.status === "REVIEW" ? "REVIEW" : "검토 필요", cls: "review" },
    { label: "REJECT", value: data.validation.status === "REJECT" ? "REJECT" : "대체로 비권장", cls: "reject" },
    { label: "Validation Score", value: `${data.validation.score}`, cls: "review" },
    { label: "Risk Warning", value: data.validation.riskWarning, cls: "reject" },
    { label: "Validation Comment", value: data.validation.comment, cls: "pass" },
    { label: "Production Source", value: "TEST_3", cls: "pass" },
    { label: "Update Signal", value: data.attribution.updateSignal, cls: "review" },
    { label: "Committee Hint", value: data.committee.recommendation, cls: "review" }
  ];

  byId("validation-grid").innerHTML = cells.map((cell) => `
    <article class="validation-card">
      <div class="status-pill ${cell.cls}">${escapeHtml(cell.label)}</div>
      <div class="value ${cell.label === "Validation Score" ? "large" : ""}">${escapeHtml(String(cell.value))}</div>
    </article>
  `).join("");
}

function renderAttribution(data) {
  const items = [
    ["Allocation Effect", `${data.attribution.allocationEffect.toFixed(1)}%`],
    ["Selection Effect", `${data.attribution.selectionEffect.toFixed(1)}%`],
    ["Interaction Effect", `${data.attribution.interactionEffect.toFixed(1)}%`],
    ["Alpha Contribution", `${data.attribution.alphaContribution.toFixed(1)}%`],
    ["Beta Contribution", `${data.attribution.betaContribution.toFixed(1)}%`],
    ["Update Signal", data.attribution.updateSignal]
  ];

  byId("attribution-grid").innerHTML = items.map(([label, value]) => `
    <article class="attrib-card">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(String(value))}</div>
    </article>
  `).join("");
}

function renderCommittee(data) {
  byId("committee-summary").innerHTML = `
    <h3>Investment Committee</h3>
    <div class="committee-items">
      <div class="committee-item"><span>Recommendation</span><strong>${escapeHtml(data.committee.recommendation)}</strong></div>
      <div class="committee-item"><span>Key Risk</span><strong>${escapeHtml(data.committee.keyRisk)}</strong></div>
      <div class="committee-item"><span>Backtest Summary</span><strong>${escapeHtml(data.committee.backtestSummary)}</strong></div>
      <div class="committee-item"><span>Committee Comment</span><strong>${escapeHtml(data.committee.comment)}</strong></div>
    </div>
  `;

  byId("battle-plan").innerHTML = `
    <div class="battle-plan__row">
      <div class="battle-plan__label">Recommended Action</div>
      <div class="battle-plan__value">${escapeHtml(data.battlePlan.recommendedAction)}</div>
    </div>
    <div class="battle-plan__row">
      <div class="battle-plan__label">Expected Outcome</div>
      <div class="battle-plan__value">${escapeHtml(data.battlePlan.expectedOutcome)}</div>
    </div>
    <div class="battle-plan__row">
      <div class="battle-plan__label">Worst Case</div>
      <div class="battle-plan__value">${escapeHtml(data.battlePlan.worstCase)}</div>
    </div>
    <div class="battle-plan__row">
      <div class="battle-plan__label">Capital Allocation</div>
      <div class="battle-plan__value">${escapeHtml(data.battlePlan.capitalAllocation)}</div>
    </div>
    <div class="battle-plan__row">
      <div class="battle-plan__label">Risk Budget</div>
      <div class="battle-plan__value">${escapeHtml(data.battlePlan.riskBudget)}</div>
    </div>
  `;
}

function renderReport(data) {
  byId("report-box").textContent = [
    `[${data.regime.label}] 국면, 확신도 ${formatPercent(data.confidence.score * 100, 0)}`,
    `현재 시장은 ${data.marketInterpretation} 구간입니다.`,
    `근거: ${data.regimeReason}`,
    `추천 전략: ${data.strategy.top.slice(0, 3).join(", ")}`,
    `비추천 전략: ${data.strategy.avoid.slice(0, 3).join(", ")}`,
    `위원회 의견: ${data.committee.comment}`
  ].join("\n\n");
}

function renderMain() {
  if (!analysis) return;
  renderScenarioButtons();
  renderHeroMetrics(analysis);
  renderHero(analysis);
  renderMarketSnapshot(analysis);
  renderConfidence(analysis);
  renderModule1Kpis(analysis);
  renderNews(newsState);
  renderValidation(analysis);
  renderAttribution(analysis);
  renderCommittee(analysis);
  renderReport(analysis);
}

function readQuestionAnswer() {
  const question = byId("beginner-question")?.value || "";
  const answer = answerBeginnerQuestion(question, analysis);
  byId("beginner-answer").textContent = answer;
  return answer;
}

function buildAnalysis(input) {
  return analyzeRegime(input);
}

async function loadSampleData() {
  const response = await fetch("./sample-data.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`sample-data.json load failed (${response.status})`);
  return response.json();
}

async function loadMarket(asOf, { useSampleFallback = true } = {}) {
  const date = normalizeDateInput(asOf) || getDefaultTradingDate();
  try {
    const response = await fetch(`/api/market-data?symbol=%5EKS200&asOf=${encodeURIComponent(date)}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || `market data failed (${response.status})`);
    marketState = {
      ...payload.data,
      source: payload.source,
      note: payload.note || ""
    };
    byId("market-date-input").value = marketState.asOf;
    byId("data-status").textContent = payload.note || `${payload.source} 기준으로 ${marketState.asOf} 데이터를 반영했습니다.`;
    return marketState;
  } catch (error) {
    if (!useSampleFallback) throw error;
    const sample = sampleData?.market || sampleData?.marketData || null;
    if (!sample) throw error;
    marketState = {
      ...sample,
      asOf: date,
      source: "Sample market data",
      note: `실제 데이터 호출 실패로 sample-data.json을 사용했습니다. (${error.message})`
    };
    byId("data-status").textContent = marketState.note;
    byId("market-date-input").value = marketState.asOf;
    return marketState;
  }
}

async function loadNews(offset = 0, { useSampleFallback = true } = {}) {
  try {
    const response = await fetch(`/api/market-news?offset=${offset}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || `market news failed (${response.status})`);
    newsState = {
      ...payload.data,
      source: payload.source,
      note: payload.note || ""
    };
    newsOffset = offset;
    return newsState;
  } catch (error) {
    if (!useSampleFallback) throw error;
    const sampleNews = sampleData?.news || {};
    const items = Array.isArray(sampleNews.items) ? sampleNews.items : [];
    const pageSize = 3;
    const topItems = items.slice(offset, offset + pageSize);
    newsState = summarizeNewsContext(topItems, { offset, pageSize });
    newsState.allItems = items;
    newsState.keywords = sampleNews.keywords || newsState.keywords;
    newsState.asOf = sampleNews.asOf || getDefaultTradingDate();
    newsState.note = `실제 뉴스 호출 실패로 sample-data.json을 사용했습니다. (${error.message})`;
    newsOffset = offset;
    return newsState;
  }
}

function syncFieldsFromMarket(market) {
  byId("market-date-input").value = market.asOf || getDefaultTradingDate();
  byId("input-oneDay").value = market.returns?.oneDay ?? 0;
  byId("input-oneWeek").value = market.returns?.oneWeek ?? 0;
  byId("input-oneMonth").value = market.returns?.oneMonth ?? 0;
  byId("input-volatility20d").value = market.volatility20d ?? 0;
  byId("input-trendStrength").value = market.trendStrength ?? 0;
  byId("input-eventRisk").value = market.eventRisk ?? "medium";
  byId("input-newsSentiment").value = market.newsSentiment ?? "neutral";
  byId("input-breadth").value = market.breadth ?? "neutral";
  byId("input-slem").value = market.slem ?? 0;
  byId("input-gelmanRubin").value = market.gelmanRubin ?? 1;
  byId("input-tradabilityMaskValid").checked = market.tradabilityMaskValid ?? true;
}

async function runAgent() {
  const input = buildInputState();
  analysis = buildAnalysis(input);
  analysis.marketMeta = marketState;
  analysis.workflow = ["Observe", "Orient", "Decide", "Act", "Feedback", "Update Signal"];
  analysis.input = input;
  renderMain();
  readQuestionAnswer();
}

function wireEvents() {
  document.addEventListener("click", async (event) => {
    const scenario = event.target.closest("[data-scenario]");
    if (scenario) {
      applyScenarioInputs(scenario.dataset.scenario);
      await runAgent();
      return;
    }

    if (event.target.closest("#run-agent-button")) {
      currentScenario = "custom";
      setText("scenario-status", "Custom");
      await runAgent();
      return;
    }

    if (event.target.closest("#live-data-button") || event.target.closest("#manual-update-button")) {
      const before = byId("market-date-input").value;
      await loadMarket(before, { useSampleFallback: true });
      syncFieldsFromMarket(marketState);
      await loadNews(newsOffset, { useSampleFallback: true });
      await runAgent();
      return;
    }

    if (event.target.closest("#reset-date-button")) {
      const defaultDate = getDefaultTradingDate();
      byId("market-date-input").value = defaultDate;
      await loadMarket(defaultDate, { useSampleFallback: true });
      syncFieldsFromMarket(marketState);
      await loadNews(0, { useSampleFallback: true });
      await runAgent();
      return;
    }

    if (event.target.closest("#news-next-button")) {
      const total = newsState?.pageInfo?.total || (newsState?.allItems || []).length || 0;
      if (!total) return;
      const nextOffset = (newsOffset + 3) >= total ? 0 : newsOffset + 3;
      await loadNews(nextOffset, { useSampleFallback: true });
      renderNews(newsState);
      return;
    }

    if (event.target.closest("#question-button")) {
      readQuestionAnswer();
      return;
    }

    if (event.target.closest("#copy-button")) {
      await copyTextWithFallback(byId("report-box")?.textContent || "");
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.matches("#market-date-input")) {
      currentScenario = "custom";
      setText("scenario-status", "Custom");
      renderScenarioButtons();
    }
  });

  document.addEventListener("keydown", async (event) => {
    if (event.key === "Enter" && event.target?.id === "beginner-question") {
      event.preventDefault();
      readQuestionAnswer();
    }
  });
}

async function boot() {
  sampleData = await loadSampleData();
  byId("market-date-input").value = getDefaultTradingDate();
  applyScenarioInputs("transition");
  wireEvents();
  renderScenarioButtons();

  await loadMarket(byId("market-date-input").value, { useSampleFallback: true });
  syncFieldsFromMarket(marketState);
  await loadNews(0, { useSampleFallback: true });
  await runAgent();

  if (sampleData?.beginnerExamples?.length) {
    byId("beginner-question").value = sampleData.beginnerExamples[0];
    readQuestionAnswer();
  }
}

boot().catch((error) => {
  console.error(error);
  const shell = document.querySelector(".app-shell");
  if (shell) {
    shell.innerHTML = `
      <section class="panel">
        <p class="eyebrow">Error</p>
        <h2>앱을 불러오지 못했습니다</h2>
        <p class="section-note" style="text-align:left">${escapeHtml(error.message || String(error))}</p>
      </section>
    `;
  }
});
