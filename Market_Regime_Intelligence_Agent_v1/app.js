import { getDefaultTradingDate, loadSampleRegimeData, normalizeDateInput } from "./data-loader.js";
import { createAgentState } from "./state.js";
import {
  renderBacktestSummary,
  renderHeaderMetrics,
  renderCurrentRegime,
  renderCommitteeView,
  renderAvoidStrategies,
  renderMarketSnapshot,
  renderRecommendedStrategies,
  renderTransitionMonitor
} from "./renderers.js";
import { composeCommitteeReport } from "./report-composer.js";

function syncControls(targetDate) {
  const input = document.getElementById("as-of-date");
  if (input) {
    input.value = normalizeDateInput(targetDate);
  }
}

function setControlMessage(text) {
  const hint = document.getElementById("data-control-message");
  if (hint) {
    hint.textContent = text;
  }
}

function showBootError(error) {
  const fallback = document.getElementById("committee-report");
  if (fallback) {
    fallback.textContent = `데이터를 불러오지 못했습니다.\n${String(error?.message || error)}`;
  }

  setControlMessage("입력 데이터 연결에 실패했습니다. 기준일을 바꾸거나 업데이트 버튼으로 다시 계산할 수 있습니다.");
  console.error(error);
}

async function boot(targetDate) {
  const effectiveDate = normalizeDateInput(targetDate) || getDefaultTradingDate();
  const raw = await loadSampleRegimeData(effectiveDate);
  const state = createAgentState(raw);

  renderHeaderMetrics(state);
  renderCurrentRegime(state);
  renderMarketSnapshot(state);
  renderTransitionMonitor(state);
  renderBacktestSummary(state);
  renderRecommendedStrategies(state);
  renderAvoidStrategies(state);
  renderCommitteeView(state);

  const report = composeCommitteeReport(state);
  const reportBox = document.getElementById("committee-report");
  if (reportBox) {
    reportBox.textContent = report;
  }

  const recommendationCount = document.getElementById("recommendation-count");
  if (recommendationCount) {
    recommendationCount.textContent = `Top ${state.recommendedStrategies.length}`;
  }

  const avoidCount = document.getElementById("avoid-count");
  if (avoidCount) {
    avoidCount.textContent = `Top ${state.avoidStrategies.length}`;
  }

  syncControls(effectiveDate);
  setControlMessage(`기준일 ${effectiveDate} 기준으로 종가, 증감율, 역사적 변동성을 다시 계산했습니다. 업데이트 버튼으로 수동 반영할 수 있습니다.`);
}

function wireControls() {
  const applyButton = document.getElementById("apply-date-button");
  const resetButton = document.getElementById("reset-date-button");
  const input = document.getElementById("as-of-date");

  applyButton?.addEventListener("click", () => {
    const value = normalizeDateInput(input?.value);
    boot(value || getDefaultTradingDate()).catch(showBootError);
  });

  resetButton?.addEventListener("click", () => {
    const defaultDate = getDefaultTradingDate();
    if (input) input.value = defaultDate;
    boot(defaultDate).catch(showBootError);
  });

  input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const value = normalizeDateInput(input.value);
      boot(value || getDefaultTradingDate()).catch(showBootError);
    }
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-playbook]");
    if (!button) return;
    document.getElementById("committee-report")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireControls();
  boot().catch(showBootError);
});
