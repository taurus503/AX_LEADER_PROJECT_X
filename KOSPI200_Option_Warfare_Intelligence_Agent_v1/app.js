const SECTION_TILES = [
  { id: "hero", key: "Overview", title: "Hero", desc: "현재 국면과 핵심 KPI" },
  { id: "module1", key: "Module 1", title: "Regime", desc: "시장 국면 및 해석" },
  { id: "module2", key: "Module 2", title: "Playbook", desc: "추천 / 비추천 전략" },
  { id: "module3", key: "Module 3", title: "Validation", desc: "검증 결과와 경고" },
  { id: "module4", key: "Module 4", title: "Attribution", desc: "성과 기여도 분석" },
  { id: "committee", key: "Final", title: "Battle Plan", desc: "위원회 의견과 실행안" }
];

const workflowSteps = [
  "Observe",
  "Orient",
  "Decide",
  "Act",
  "Feedback",
  "Update Signal"
];

const metricLabels = [
  ["Current Regime", "Transition"],
  ["Confidence Score", "73%"],
  ["Event Risk", "High"],
  ["Market Outlook", "Narrow leadership"],
  ["Last Update", "2026-06-17 09:20 KST"]
];

async function loadData() {
  const response = await fetch("./sample-data.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`sample-data.json load failed (${response.status})`);
  }
  return response.json();
}

function fmtPct(value) {
  return `${Math.round(value * 100)}%`;
}

function riskClass(value) {
  const lower = String(value).toLowerCase();
  if (lower.includes("low")) return "low";
  if (lower.includes("high") || lower.includes("very")) return "high";
  return "medium";
}

function statusClass(value) {
  return String(value).toLowerCase();
}

function tileMarkup(tile) {
  return `
    <button class="tile" type="button" data-target="${tile.id}">
      <div class="tile__key">${tile.key}</div>
      <div class="tile__title">${tile.title}</div>
      <div class="tile__desc">${tile.desc}</div>
    </button>
  `;
}

function renderTiles() {
  document.getElementById("module-tiles").innerHTML = SECTION_TILES.map(tileMarkup).join("");
}

function renderWorkflow() {
  const band = document.getElementById("workflow-band");
  band.innerHTML = workflowSteps
    .map((step, index) => `
      <div class="workflow-step">
        <div class="step-label">Step ${index + 1}</div>
        <div class="step-value">${step}</div>
      </div>
    `)
    .join("");
}

function renderHeroMetrics(data) {
  const heroMetrics = document.getElementById("hero-metrics");
  heroMetrics.innerHTML = metricLabels
    .map(([label, value]) => `
      <div class="metric-card">
        <div class="label">${label}</div>
        <div class="value">${value}</div>
        <div class="hint">${data.hero.marketOutlook}</div>
      </div>
    `)
    .join("");
}

function renderHero(data) {
  const regime = document.getElementById("hero-regime");
  regime.innerHTML = `
    <div>
      <p class="eyebrow">Current Market Regime</p>
      <div class="regime-name">${data.hero.currentRegime}</div>
      <p class="regime-copy">${data.module1.interpretation}</p>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;">
        <span class="event-pill">Event Risk: ${data.hero.eventRisk}</span>
        <span class="tag-pill medium">Trend: Sideways-to-Down</span>
        <span class="tag-pill low">Defensive Bias</span>
      </div>
    </div>
    <div class="ring" style="--ring-progress:${data.hero.confidenceScore * 100}%"><span>${fmtPct(data.hero.confidenceScore)}</span></div>
  `;

  const summary = document.getElementById("hero-summary");
  summary.innerHTML = `
    <div class="hero-bullets">
      <div class="hero-bullet">
        <strong>Market Outlook</strong>
        <span>${data.hero.marketOutlook}</span>
      </div>
      <div class="hero-bullet">
        <strong>Module Flow</strong>
        <span>${workflowSteps.join(" → ")}</span>
      </div>
      <div class="hero-bullet">
        <strong>Last Update</strong>
        <span>${data.hero.lastUpdate}</span>
      </div>
    </div>
  `;
}

function renderModule1(data) {
  const kpis = [
    ["Regime", data.module1.regime, "Bull / Calm, Bear / Crisis, Transition 중 현재 선택"],
    ["Confidence", `${Math.round(data.module1.confidence * 100)}%`, "시장 데이터의 정합성과 추세 강도"],
    ["Event Filter", data.module1.eventFilter, "FOMC, CPI, 만기 등 이벤트 반영"],
    ["Interpretation", "Readable", data.module1.interpretation],
    ["Defensive", data.module1.defensive, "방어형 옵션 구조"],
    ["Momentum", data.module1.momentum, "추세성 반영 구조"],
    ["Carry", data.module1.carry, "프리미엄 수취 구조"],
    ["Balanced", data.module1.balanced, "방어와 공격의 중립 조합"]
  ];

  document.getElementById("module1-kpis").innerHTML = kpis
    .map(([label, value, desc]) => `
      <div class="kpi-card">
        <div class="label">${label}</div>
        <div class="value">${value}</div>
        <div class="desc">${desc}</div>
      </div>
    `)
    .join("");
}

function renderStrategies(list, targetId, type) {
  const container = document.getElementById(targetId);
  container.innerHTML = list.map((item) => {
    const score = item.strategyScore ? `<span class="score-pill">Score ${item.strategyScore}</span>` : "";
    const reason = type === "recommended" ? item.playbook : item.rejectReason;
    const buttonLabel = type === "recommended" ? "Open Playbook" : "Open Playbook";
    return `
      <article class="strategy-card">
        <div class="strategy-top">
          <div>
            <div class="strategy-title">${item.name}</div>
            <div class="muted" style="margin-top:6px;font-size:13px;line-height:1.5;">${reason}</div>
          </div>
          <div style="display:grid;gap:8px;justify-items:end;">${score}</div>
        </div>
        <div class="strategy-meta">
          <div>
            <span>${type === "recommended" ? "Risk Level" : "Reject Reason"}</span>
            <strong>${item.riskLevel}</strong>
          </div>
          <div>
            <span>${type === "recommended" ? "Expected Return" : "Playbook"}</span>
            <strong>${type === "recommended" ? item.expectedReturn : item.playbook}</strong>
          </div>
          <div>
            <span>Mapping</span>
            <strong>${type === "recommended" ? item.playbook : item.rejectReason}</strong>
          </div>
        </div>
        <button class="playbook-link" type="button" data-playbook="${item.name}">${buttonLabel}</button>
      </article>
    `;
  }).join("");
}

function renderValidation(data) {
  const status = data.module3.status;
  const cells = [
    { label: "Status", value: status, cls: statusClass(status) },
    { label: "Validation Score", value: `${data.module3.validationScore}`, cls: "review" },
    { label: "Risk Warning", value: data.module3.riskWarning, cls: "review" },
    { label: "Validation Comment", value: data.module3.validationComment, cls: "pass" },
    { label: "PASS", value: "Safe to consider if transition signal stays stable", cls: "pass" },
    { label: "REVIEW", value: "Monitor if breadth or event risk weakens", cls: "review" },
    { label: "REJECT", value: "Reject when gap risk or confirmation fails", cls: "reject" },
    { label: "Production Source", value: "TEST_3", cls: "pass" },
    { label: "Update Signal", value: data.module4.updateSignal, cls: "review" }
  ];

  document.getElementById("validation-grid").innerHTML = cells.map((cell) => `
    <article class="validation-card">
      <div class="status-pill ${cell.cls}">${cell.label}</div>
      <div class="value ${cell.label === "Validation Score" ? "large" : ""}">${cell.value}</div>
    </article>
  `).join("");
}

function renderAttribution(data) {
  const items = [
    ["Allocation Effect", `${(data.module4.allocationEffect * 100).toFixed(1)}%`],
    ["Selection Effect", `${(data.module4.selectionEffect * 100).toFixed(1)}%`],
    ["Interaction Effect", `${(data.module4.interactionEffect * 100).toFixed(1)}%`],
    ["Alpha Contribution", `${(data.module4.alphaContribution * 100).toFixed(1)}%`],
    ["Beta Contribution", `${(data.module4.betaContribution * 100).toFixed(1)}%`],
    ["Update Signal", data.module4.updateSignal]
  ];

  document.getElementById("attribution-grid").innerHTML = items.map(([label, value]) => `
    <article class="attrib-card">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
    </article>
  `).join("");
}

function renderCommittee(data) {
  document.getElementById("committee-summary").innerHTML = `
    <h3>Executive Summary</h3>
    <div class="committee-items">
      <div class="committee-item"><span>Recommendation</span><strong>${data.committee.recommendation}</strong></div>
      <div class="committee-item"><span>Key Risk</span><strong>${data.committee.keyRisk}</strong></div>
      <div class="committee-item"><span>Backtest Summary</span><strong>${data.committee.backtestSummary}</strong></div>
      <div class="committee-item"><span>Committee Comment</span><strong>${data.committee.comment}</strong></div>
    </div>
  `;

  document.getElementById("battle-plan").innerHTML = `
    <div class="battle-plan__row">
      <div class="battle-plan__label">Recommended Action</div>
      <div class="battle-plan__value">${data.battlePlan.recommendedAction}</div>
    </div>
    <div class="battle-plan__row">
      <div class="battle-plan__label">Expected Outcome</div>
      <div class="battle-plan__value">${data.battlePlan.expectedOutcome}</div>
    </div>
    <div class="battle-plan__row">
      <div class="battle-plan__label">Worst Case</div>
      <div class="battle-plan__value">${data.battlePlan.worstCase}</div>
    </div>
    <div class="battle-plan__row">
      <div class="battle-plan__label">Capital Allocation</div>
      <div class="battle-plan__value">${data.battlePlan.capitalAllocation}</div>
    </div>
    <div class="battle-plan__row">
      <div class="battle-plan__label">Risk Budget</div>
      <div class="battle-plan__value">${data.battlePlan.riskBudget}</div>
    </div>
  `;
}

function render(data) {
  renderTiles();
  renderWorkflow();
  renderHeroMetrics(data);
  renderHero(data);
  renderModule1(data);
  renderStrategies(data.module2.recommendedStrategies, "recommended-list", "recommended");
  renderStrategies(data.module2.avoidStrategies, "avoid-list", "avoid");
  renderValidation(data);
  renderAttribution(data);
  renderCommittee(data);

  document.getElementById("recommended-count").textContent = `${data.module2.recommendedStrategies.length} items`;
  document.getElementById("avoid-count").textContent = `${data.module2.avoidStrategies.length} items`;
}

function wireNavigation() {
  document.addEventListener("click", (event) => {
    const tile = event.target.closest("[data-target]");
    if (tile) {
      const target = document.getElementById(tile.dataset.target);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const playbook = event.target.closest("[data-playbook]");
    if (playbook) {
      document.getElementById("committee")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

async function main() {
  wireNavigation();
  const data = await loadData();
  render(data);
}

main().catch((error) => {
  const shell = document.querySelector(".app-shell");
  if (shell) {
    shell.innerHTML = `
      <section class="panel">
        <p class="eyebrow">Error</p>
        <h2>Sample data load failed</h2>
        <p class="section-note" style="text-align:left">${String(error?.message || error)}</p>
      </section>
    `;
  }
  console.error(error);
});
