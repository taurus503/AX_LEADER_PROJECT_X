import { analyzeRegime, SCENARIOS } from "./src/market-regime-engine.mjs";
import {
  computeFeaturesFromPrices,
  getDefaultTradingDate,
  normalizeDateInput,
  parseYahooChartResponse
} from "./src/market-data-provider.mjs";
import { parseGoogleNewsRss, summarizeNewsContext } from "./src/market-news-provider.mjs";
import { copyTextWithFallback, fallbackWriteTextViaTextarea } from "./src/clipboard-copy.mjs";
import { answerBeginnerQuestion } from "./src/beginner-question.mjs";

const fields = {
  oneDay: document.querySelector("#oneDay"),
  oneWeek: document.querySelector("#oneWeek"),
  oneMonth: document.querySelector("#oneMonth"),
  volatility20d: document.querySelector("#volatility20d"),
  trendStrength: document.querySelector("#trendStrength"),
  eventRisk: document.querySelector("#eventRisk"),
  newsSentiment: document.querySelector("#newsSentiment"),
  breadth: document.querySelector("#breadth"),
  slem: document.querySelector("#slem"),
  gelmanRubin: document.querySelector("#gelmanRubin"),
  tradabilityMaskValid: document.querySelector("#tradabilityMaskValid")
};

const nodes = {
  scenarioTabs: document.querySelector("#scenario-tabs"),
  runButton: document.querySelector("#run-button"),
  liveDataButton: document.querySelector("#live-data-button"),
  manualUpdateButton: document.querySelector("#manual-update-button"),
  resetDateButton: document.querySelector("#reset-date-button"),
  marketDateInput: document.querySelector("#market-date-input"),
  dataStatus: document.querySelector("#data-status"),
  marketAsOf: document.querySelector("#market-as-of"),
  marketClose: document.querySelector("#market-close"),
  marketPrevClose: document.querySelector("#market-prev-close"),
  marketChangeRate: document.querySelector("#market-change-rate"),
  marketHistoricalVol: document.querySelector("#market-historical-vol"),
  regimeName: document.querySelector("#regime-name"),
  regimeTone: document.querySelector("#regime-tone"),
  confidenceRing: document.querySelector("#confidence-ring"),
  confidenceValue: document.querySelector("#confidence-value"),
  confidenceLabel: document.querySelector("#confidence-label"),
  confidenceSummary: document.querySelector("#confidence-summary"),
  confidenceList: document.querySelector("#confidence-list"),
  kpiMonth: document.querySelector("#kpi-month"),
  kpiVol: document.querySelector("#kpi-vol"),
  kpiEvent: document.querySelector("#kpi-event"),
  kpiRetrain: document.querySelector("#kpi-retrain"),
  newsButton: document.querySelector("#news-button"),
  newsStatus: document.querySelector("#news-status"),
  newsKeywords: document.querySelector("#news-keywords"),
  newsList: document.querySelector("#news-list"),
  newsSentimentTag: document.querySelector("#news-sentiment-tag"),
  evidenceList: document.querySelector("#evidence-list"),
  topList: document.querySelector("#top-list"),
  avoidList: document.querySelector("#avoid-list"),
  allocationBars: document.querySelector("#allocation-bars"),
  constraintTag: document.querySelector("#constraint-tag"),
  reportBox: document.querySelector("#report-box"),
  telemetryList: document.querySelector("#telemetry-list"),
  matrix: document.querySelector("#matrix"),
  jsonBox: document.querySelector("#json-box"),
  copyButton: document.querySelector("#copy-button"),
  manualCopyPanel: document.querySelector("#manual-copy-panel"),
  manualCopyText: document.querySelector("#manual-copy-text"),
  beginnerQuestion: document.querySelector("#beginner-question"),
  questionButton: document.querySelector("#question-button"),
  beginnerAnswer: document.querySelector("#beginner-answer")
};

const stateLabels = ["Bull", "Bear", "Transition"];
let currentScenario = "transition";
let latestReport = "";
let currentMarketMeta = {
  symbol: "KOSPI200",
  asOf: getDefaultTradingDate(),
  latestClose: null,
  previousClose: null,
  changeRate: null,
  historicalVolatility: null
};
let currentNewsContext = null;
let currentNewsSource = null;
let latestResult = null;

function formatPercent(value, digits = 1) {
  return `${Number(value || 0).toFixed(digits)}%`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setActiveScenario(key) {
  currentScenario = key;
  document.body.classList.toggle("custom-mode", key === "custom");
  nodes.scenarioTabs.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.scenario === key);
  });
}

function syncMarketDateInput(value) {
  if (nodes.marketDateInput) {
    nodes.marketDateInput.value = normalizeDateInput(value) || getDefaultTradingDate();
  }
}

function loadScenario(key) {
  const scenario = SCENARIOS[key] || SCENARIOS.transition;
  currentNewsContext = null;
  currentMarketMeta = {
    symbol: scenario.symbol || "KOSPI200",
    asOf: scenario.asOf || getDefaultTradingDate(),
    latestClose: null,
    previousClose: null,
    changeRate: null,
    historicalVolatility: null
  };

  fields.oneDay.value = scenario.returns.oneDay;
  fields.oneWeek.value = scenario.returns.oneWeek;
  fields.oneMonth.value = scenario.returns.oneMonth;
  fields.volatility20d.value = scenario.volatility20d;
  fields.trendStrength.value = scenario.trendStrength;
  fields.eventRisk.value = scenario.eventRisk;
  fields.newsSentiment.value = scenario.newsSentiment;
  fields.breadth.value = scenario.breadth;
  fields.slem.value = scenario.slem;
  fields.gelmanRubin.value = scenario.gelmanRubin;
  fields.tradabilityMaskValid.checked = scenario.tradabilityMaskValid;

  setActiveScenario(key);
  syncMarketDateInput(currentMarketMeta.asOf);
}

function loadMarketFeatures(features) {
  currentMarketMeta = {
    symbol: features.symbol || "KOSPI200",
    asOf: features.asOf || getDefaultTradingDate(),
    latestClose: features.latestClose ?? null,
    previousClose: features.previousTradingDayClose ?? features.previousClose ?? null,
    changeRate: Number.isFinite(features.returns?.oneDay) ? features.returns.oneDay : null,
    historicalVolatility: Number.isFinite(features.volatility20d) ? features.volatility20d : null
  };

  fields.oneDay.value = features.returns.oneDay;
  fields.oneWeek.value = features.returns.oneWeek;
  fields.oneMonth.value = features.returns.oneMonth;
  fields.volatility20d.value = features.volatility20d;
  fields.trendStrength.value = features.trendStrength;
  fields.eventRisk.value = features.eventRisk;
  fields.newsSentiment.value = features.newsSentiment;
  fields.breadth.value = features.breadth;
  fields.slem.value = features.slem;
  fields.gelmanRubin.value = features.gelmanRubin;
  fields.tradabilityMaskValid.checked = features.tradabilityMaskValid;

  setActiveScenario("custom");
  syncMarketDateInput(currentMarketMeta.asOf);
}

function enterCustomScenario() {
  setActiveScenario("custom");
  nodes.dataStatus.classList.remove("error");
  nodes.dataStatus.textContent =
    "Custom 직접 입력 모드입니다. 왼쪽 입력값을 조정하면 국면, 확신도, 전략이 바로 다시 계산됩니다.";
  fields.oneDay.focus();
  fields.oneDay.select();
}

function pageNewsContext(newsContext, offset = 0) {
  const allItems = (newsContext?.allItems?.length ? newsContext.allItems : newsContext?.topItems) || [];
  const pageContext = summarizeNewsContext(allItems, { offset, pageSize: 3 });
  return {
    ...pageContext,
    provider: newsContext?.provider || pageContext.provider,
    asOf: newsContext?.asOf || pageContext.asOf
  };
}

function loadNewsContext(newsContext, source, offset = 0) {
  currentNewsContext = pageNewsContext(newsContext, offset);
  currentNewsSource = source || newsContext?.provider || currentNewsContext.provider;
  fields.newsSentiment.value = currentNewsContext.sentiment === "neutral"
    ? "neutral"
    : currentNewsContext.sentiment;
  return currentNewsContext;
}

function hasLoadedNewsPages() {
  return (currentNewsContext?.allItems || []).length > 3;
}

function nextNewsOffset() {
  const pageInfo = currentNewsContext?.pageInfo || {};
  const total = pageInfo.total || 0;
  const endRank = pageInfo.endRank || 0;
  if (!total || endRank >= total) return 0;
  return endRank;
}

function readInput() {
  return {
    label: currentScenario === "custom" ? "Custom" : SCENARIOS[currentScenario]?.label,
    symbol: currentMarketMeta.symbol,
    asOf: currentMarketMeta.asOf,
    latestClose: currentMarketMeta.latestClose,
    previousClose: currentMarketMeta.previousClose,
    historicalVolatility: currentMarketMeta.historicalVolatility,
    returns: {
      oneDay: Number(fields.oneDay.value),
      oneWeek: Number(fields.oneWeek.value),
      oneMonth: Number(fields.oneMonth.value)
    },
    volatility20d: Number(fields.volatility20d.value),
    eventRisk: fields.eventRisk.value,
    newsSentiment: fields.newsSentiment.value,
    newsContext: currentNewsContext,
    breadth: fields.breadth.value,
    trendStrength: Number(fields.trendStrength.value),
    slem: Number(fields.slem.value),
    gelmanRubin: Number(fields.gelmanRubin.value),
    tradabilityMaskValid: fields.tradabilityMaskValid.checked
  };
}

function renderList(target, items) {
  if (!target) return;
  target.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderNewsContext(newsContext, source) {
  if (!newsContext) {
    nodes.newsSentimentTag.textContent = "News";
    nodes.newsStatus.textContent = "최근 뉴스/리포트 연결이 아직 없습니다.";
    nodes.newsKeywords.innerHTML = "";
    nodes.newsList.innerHTML = "";
    return;
  }

  nodes.newsSentimentTag.textContent = newsContext.sentiment || "neutral";
  const pageInfo = newsContext.pageInfo || {};
  const rankLabel = pageInfo.total
    ? `${pageInfo.startRank}-${pageInfo.endRank} / 총 ${pageInfo.total}건`
    : "Top3";

  nodes.newsStatus.textContent =
    `${newsContext.asOf} 기준 최근 뉴스/리포트 ${rankLabel}. 출처: ${source || newsContext.provider}.`;
  nodes.newsKeywords.innerHTML = (newsContext.keywords || [])
    .slice(0, 8)
    .map((keyword) => `<span class="keyword-chip">${escapeHtml(keyword)}</span>`)
    .join("");
  nodes.newsList.innerHTML = (newsContext.topItems || [])
    .map((item) => `
      <article class="news-item">
        <a href="${escapeHtml(item.link)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a>
        <div class="news-meta">${escapeHtml(item.source || "")} · ${escapeHtml(item.publishedAt || "")}</div>
      </article>
    `)
    .join("");
}

function renderConfidence(confidence) {
  nodes.confidenceLabel.textContent = confidence.label || "Score";
  nodes.confidenceSummary.textContent = confidence.summary || "";
  nodes.confidenceList.innerHTML = (confidence.reasons || [])
    .map((reason) => `
      <li>
        <span class="impact-dot ${escapeHtml(reason.impact || "neutral")}">${escapeHtml(reason.impact || "neutral")}</span>
        <span>
          <span class="confidence-reason-title">${escapeHtml(reason.title || "")}</span>
          ${escapeHtml(reason.text || "")}
        </span>
      </li>
    `)
    .join("");
}

function renderAllocation(weights) {
  nodes.allocationBars.innerHTML = Object.entries(weights)
    .map(([name, value]) => {
      const percent = Math.round(value * 100);
      return `
        <div class="bar-row">
          <div class="bar-label">
            <span>${escapeHtml(name)}</span>
            <span>${percent}%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="--width: ${percent}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderMatrix(matrix) {
  const cells = [`<div></div>`, ...stateLabels.map((label) => `<div class="head">${label}</div>`)];
  matrix.forEach((row, index) => {
    cells.push(`<div class="head">${stateLabels[index]}</div>`);
    row.forEach((value) => {
      cells.push(`<div>${Math.round(value * 100)}%</div>`);
    });
  });
  nodes.matrix.innerHTML = cells.join("");
}

function renderTelemetry(telemetry) {
  const rows = [
    `Rolling Window: ${telemetry.rollingWindow}일`,
    `Standardization: ${telemetry.standardization}`,
    `Turnover Penalty: ${telemetry.turnoverPenaltyBps}bps`,
    `Gelman-Rubin: ${telemetry.gelmanRubin ?? "N/A"}`,
    `SLEM: ${telemetry.slem ?? "N/A"}`,
    `Spectral Gap: ${telemetry.spectralGap ?? "N/A"}`,
    `Retraining Flag: ${telemetry.retrainingFlag ? "Y" : "N"}`,
    `Convergence: ${telemetry.convergenceFlag}`
  ];
  renderList(nodes.telemetryList, rows);
}

function renderMarketStrip(meta, input) {
  if (nodes.marketAsOf) nodes.marketAsOf.textContent = meta.asOf || input.asOf || "-";
  if (nodes.marketClose) nodes.marketClose.textContent = meta.latestClose == null ? "-" : Number(meta.latestClose).toFixed(2);
  if (nodes.marketPrevClose) nodes.marketPrevClose.textContent = meta.previousClose == null ? "-" : Number(meta.previousClose).toFixed(2);
  if (nodes.marketChangeRate) {
    const value = Number.isFinite(meta.changeRate) ? meta.changeRate : input.returns.oneDay;
    nodes.marketChangeRate.textContent = `${value >= 0 ? "+" : ""}${Number(value || 0).toFixed(2)}%`;
  }
  if (nodes.marketHistoricalVol) {
    const value = Number.isFinite(meta.historicalVolatility) ? meta.historicalVolatility : input.volatility20d;
    nodes.marketHistoricalVol.textContent = `${Number(value || 0).toFixed(2)}%`;
  }
}

function renderReport(result) {
  latestReport = [
    `[${result.report.headline}]`,
    "",
    result.report.committeeSummary,
    "",
    result.report.onePageBrief,
    "",
    "근거:",
    ...result.evidence.map((item, index) => `${index + 1}. ${item}`),
    "",
    "뉴스/리포트 Top3:",
    ...(result.newsContext?.topItems || []).map((item, index) => `${index + 1}. ${item.title} (${item.source}, ${item.publishedAt})`),
    "",
    "확신도 판단 근거:",
    result.confidence.summary || "",
    ...(result.confidence.reasons || []).map((item, index) => `${index + 1}. [${item.impact}] ${item.title}: ${item.text}`),
    "",
    "전략 검토:",
    ...result.strategy.top.map((item, index) => `Top ${index + 1}. ${item}`),
    "",
    "비추천:",
    ...result.strategy.avoid.map((item, index) => `Avoid ${index + 1}. ${item}`)
  ].join("\n");

  nodes.reportBox.textContent = latestReport;
  nodes.manualCopyPanel.style.display = "none";
  nodes.manualCopyText.value = latestReport;
}

function render(result, input) {
  latestResult = result;
  const confidencePercent = Math.round(result.confidence.score * 100);

  nodes.regimeName.textContent = input.label === "Custom" ? "Custom" : result.regime.id;
  nodes.regimeTone.textContent =
    input.label === "Custom"
      ? `Custom 입력 결과: ${result.regime.id} · ${result.regime.tone} · ${result.regime.behavior}`
      : `${result.regime.tone} · ${result.regime.behavior}`;
  nodes.confidenceRing.style.setProperty("--confidence", `${confidencePercent}%`);
  nodes.confidenceValue.textContent = `${confidencePercent}%`;

  nodes.kpiMonth.textContent = formatPercent(input.returns.oneMonth);
  nodes.kpiVol.textContent = formatPercent(input.volatility20d);
  nodes.kpiEvent.textContent = input.eventRisk;
  nodes.kpiRetrain.textContent = result.telemetry.retrainingFlag ? "Y" : "N";

  renderMarketStrip(currentMarketMeta, input);
  renderConfidence(result.confidence);
  renderNewsContext(result.newsContext, currentNewsContext?.provider);
  renderList(nodes.evidenceList, result.evidence);
  renderList(nodes.topList, result.strategy.top);
  renderList(nodes.avoidList, result.strategy.avoid);
  renderAllocation(result.allocation.weights);
  renderMatrix(result.transitionProbabilityMatrix);
  renderTelemetry(result.telemetry);
  renderReport(result);

  nodes.constraintTag.textContent =
    `Sum ${result.constraints.sumOfWeights.toFixed(2)} · Mask ${result.constraints.tradabilityMaskCompliance ? "Y" : "N"}`;
  nodes.constraintTag.className = result.constraints.tradabilityMaskCompliance ? "tag green" : "tag red";
  nodes.jsonBox.textContent = JSON.stringify(result, null, 2);
}

function runAgent() {
  const input = readInput();
  const result = analyzeRegime(input);
  render(result, input);
}

function selectedMarketDate() {
  return normalizeDateInput(nodes.marketDateInput?.value) || getDefaultTradingDate();
}

async function loadMarketDataFromApi(asOf) {
  const response = await fetch(`/api/market-data?symbol=%5EKS200&asOf=${encodeURIComponent(asOf)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || `market data request failed (${response.status})`);
  }
  return payload;
}

async function loadMarketDataFromCache(asOf) {
  const response = await fetch("/data/kospi200-yahoo-chart.json");
  if (!response.ok) {
    throw new Error(`cached market data request failed (${response.status})`);
  }
  const payload = await response.json();
  const parsed = parseYahooChartResponse(payload);
  return {
    ok: true,
    source: "local cache",
    data: computeFeaturesFromPrices(parsed, { asOf })
  };
}

async function loadLiveMarketData() {
  const asOf = selectedMarketDate();
  nodes.liveDataButton.disabled = true;
  nodes.liveDataButton.textContent = "데이터 불러오는 중";
  nodes.dataStatus.classList.remove("error");
  nodes.dataStatus.textContent = `${asOf} 기준 Yahoo Finance chart endpoint에서 KOSPI200 일별 가격을 가져오고 있습니다.`;

  try {
    const payload = await loadMarketDataFromApi(asOf);
    loadMarketFeatures(payload.data);
    runAgent();
    nodes.dataStatus.textContent =
      `${payload.data.asOf} 기준 ${payload.data.symbol} 종가 ${payload.data.latestClose}. 출처: ${payload.source}.`;
  } catch (error) {
    try {
      const fallback = await loadMarketDataFromCache(asOf);
      loadMarketFeatures(fallback.data);
      runAgent();
      nodes.dataStatus.classList.add("error");
      nodes.dataStatus.textContent =
        `실제 데이터 호출에 실패해 로컬 캐시로 수동 업데이트했습니다: ${error.message}. 기준일 ${fallback.data.asOf}, 종가 ${fallback.data.latestClose}.`;
    } catch (fallbackError) {
      nodes.dataStatus.classList.add("error");
      nodes.dataStatus.textContent =
        `실제 데이터 호출에 실패했습니다: ${error.message}. 캐시도 읽지 못했습니다: ${fallbackError.message}.`;
    }
  } finally {
    nodes.liveDataButton.disabled = false;
    nodes.liveDataButton.textContent = "실제 KOSPI200 데이터 불러오기";
  }
}

async function loadManualMarketUpdate() {
  const asOf = selectedMarketDate();
  nodes.manualUpdateButton.disabled = true;
  nodes.manualUpdateButton.textContent = "업데이트 중";
  nodes.dataStatus.classList.remove("error");
  nodes.dataStatus.textContent = `${asOf} 기준 로컬 캐시를 사용해 수동 업데이트를 준비하고 있습니다.`;

  try {
    const fallback = await loadMarketDataFromCache(asOf);
    loadMarketFeatures(fallback.data);
    runAgent();
    nodes.dataStatus.textContent =
      `기준일 ${fallback.data.asOf}로 수동 업데이트했습니다. 종가 ${fallback.data.latestClose}, 증감율 ${fallback.data.returns.oneDay}%, 20일 변동성 ${fallback.data.volatility20d}%.`;
  } catch (error) {
    nodes.dataStatus.classList.add("error");
    nodes.dataStatus.textContent = `수동 업데이트도 실패했습니다: ${error.message}.`;
  } finally {
    nodes.manualUpdateButton.disabled = false;
    nodes.manualUpdateButton.textContent = "업데이트";
  }
}

async function loadMarketNews(options = {}) {
  if (options.advance && hasLoadedNewsPages()) {
    const nextContext = loadNewsContext(currentNewsContext, currentNewsSource, nextNewsOffset());
    runAgent();
    renderNewsContext(nextContext, currentNewsSource);
    return;
  }

  nodes.newsButton.disabled = true;
  nodes.newsButton.textContent = "뉴스 불러오는 중";
  nodes.newsStatus.classList.remove("error");
  nodes.newsStatus.textContent = "Google News RSS에서 KOSPI200 관련 최근 뉴스/리포트 Top3를 가져오고 있습니다.";
  let loadedNewsContext = null;
  let loadedNewsSource = null;

  try {
    const response = await fetch("/api/market-news");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || `market news request failed (${response.status})`);
    }

    const newsContext = loadNewsContext(payload.data, payload.source, 0);
    loadedNewsContext = newsContext;
    loadedNewsSource = payload.source;
    runAgent();
    renderNewsContext(newsContext, payload.source);
    nodes.newsStatus.textContent =
      `${payload.data.asOf} 기준 최근 Top3입니다. 출처: ${payload.source}.`;
  } catch (error) {
    try {
      const response = await fetch("/data/kospi200-news-rss.xml");
      if (!response.ok) {
        throw new Error(`cached news request failed (${response.status})`);
      }
      const xml = await response.text();
      const newsContext = summarizeNewsContext(parseGoogleNewsRss(xml, { limit: 12 }).items);
      const fallbackContext = loadNewsContext(newsContext, "local cache", 0);
      loadedNewsContext = fallbackContext;
      loadedNewsSource = "local cache";
      runAgent();
      renderNewsContext(fallbackContext, loadedNewsSource);
      nodes.newsStatus.textContent =
        `${newsContext.asOf} 기준 최근 Top3입니다. 출처: local cache.`;
    } catch (fallbackError) {
      nodes.newsStatus.classList.add("error");
      nodes.newsStatus.textContent =
        `뉴스/리포트 호출에 실패했습니다: ${error.message}. 캐시도 읽지 못했습니다: ${fallbackError.message}.`;
    }
  } finally {
    if (loadedNewsContext) {
      renderNewsContext(loadedNewsContext, loadedNewsSource);
    }
    nodes.newsButton.disabled = false;
    nodes.newsButton.textContent = "최근 뉴스/리포트 불러오기";
  }
}

function answerCurrentQuestion() {
  nodes.beginnerAnswer.textContent = answerBeginnerQuestion(nodes.beginnerQuestion.value, latestResult);
}

function wireEvents() {
  nodes.scenarioTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.scenario === "custom") {
      enterCustomScenario();
    } else {
      loadScenario(button.dataset.scenario);
    }
    runAgent();
  });

  Object.values(fields).forEach((field) => {
    field.addEventListener("input", () => {
      setActiveScenario("custom");
      runAgent();
    });
    field.addEventListener("change", () => {
      setActiveScenario("custom");
      runAgent();
    });
  });

  nodes.runButton.addEventListener("click", runAgent);
  nodes.liveDataButton.addEventListener("click", loadLiveMarketData);
  nodes.manualUpdateButton.addEventListener("click", loadManualMarketUpdate);
  nodes.resetDateButton.addEventListener("click", () => {
    syncMarketDateInput(getDefaultTradingDate());
    loadLiveMarketData();
  });
  nodes.newsButton.addEventListener("click", () => loadMarketNews({ advance: true }));
  nodes.questionButton.addEventListener("click", answerCurrentQuestion);
  nodes.beginnerQuestion.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      answerCurrentQuestion();
    }
  });

  document.querySelectorAll(".quick-questions button").forEach((button) => {
    button.addEventListener("click", () => {
      nodes.beginnerQuestion.value = button.dataset.question || "";
      answerCurrentQuestion();
    });
  });

  nodes.copyButton.addEventListener("click", async () => {
    const result = await copyTextWithFallback(latestReport, {
      preferFallback: true,
      clipboard: globalThis.navigator?.clipboard,
      fallbackWriteText: (text) => fallbackWriteTextViaTextarea(text, document)
    });

    if (result.ok) {
      nodes.manualCopyPanel.style.display = "none";
      nodes.copyButton.textContent = "복사 완료";
      window.setTimeout(() => {
        nodes.copyButton.textContent = "보고서 문안 복사";
      }, 1200);
      return;
    }

    nodes.manualCopyText.value = latestReport;
    nodes.manualCopyPanel.style.display = "block";
    nodes.manualCopyText.focus();
    nodes.manualCopyText.select();
    nodes.copyButton.textContent = "문안 선택 후 Ctrl+C";
    window.setTimeout(() => {
      nodes.copyButton.textContent = "보고서 문안 복사";
    }, 2400);
  });
}

function initialize() {
  loadScenario("transition");
  syncMarketDateInput(getDefaultTradingDate());
  wireEvents();
  runAgent();
  loadLiveMarketData();
  loadMarketNews();
}

document.addEventListener("DOMContentLoaded", initialize);
