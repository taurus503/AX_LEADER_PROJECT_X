import { loadSampleRegimeData } from "./data-loader.js";
import { createAgentState } from "./state.js";
import {
  renderBacktestSummary,
  renderCurrentRegime,
  renderCommitteeView,
  renderAvoidStrategies,
  renderMarketSnapshot,
  renderRecommendedStrategies,
  renderTransitionMonitor
} from "./renderers.js";
import { composeCommitteeReport } from "./report-composer.js";

async function boot() {
  const raw = await loadSampleRegimeData();
  const state = createAgentState(raw);

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

  document.querySelectorAll("[data-playbook]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("committee-report")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  boot().catch((error) => {
    const fallback = document.getElementById("committee-report");
    if (fallback) {
      fallback.textContent = `데이터를 불러오지 못했습니다.\n${String(error?.message || error)}`;
    }
    console.error(error);
  });
});
