import { loadSampleRegimeData } from "./data-loader.js";
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

function normalizeDateInput(value) {
  const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

function syncControls(state, targetDate) {
  const input = document.getElementById("as-of-date");
  if (input) {
    input.value = normalizeDateInput(targetDate || state.asOf);
  }
}

function showBootError(error) {
  const fallback = document.getElementById("committee-report");
  if (fallback) {
    fallback.textContent = `데이터를 불러오지 못했습니다.\n${String(error?.message || error)}`;
  }

  const hint = document.getElementById("data-control-message");
  if (hint) {
    hint.textContent = "실패했습니다. 날짜를 선택한 뒤 적용을 눌러 다시 시도하세요.";
  }

  console.error(error);
}

async function boot(targetDate) {
  const raw = await loadSampleRegimeData(targetDate);
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

  syncControls(state, targetDate);

  document.querySelectorAll("[data-playbook]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("committee-report")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function wireControls() {
  const applyButton = document.getElementById("apply-date-button");
  const resetButton = document.getElementById("reset-date-button");
  const input = document.getElementById("as-of-date");

  applyButton?.addEventListener("click", () => {
    const value = normalizeDateInput(input?.value);
    boot(value || undefined).catch(showBootError);
  });

  resetButton?.addEventListener("click", () => {
    if (input) input.value = "";
    boot().catch(showBootError);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireControls();
  boot().catch(showBootError);
});
