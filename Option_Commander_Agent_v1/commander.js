import { DEFAULT_REGISTRY, loadRegistry, planQuestion } from "./planner.js";

const els = {
  transcript: document.getElementById("transcript"),
  agentList: document.getElementById("agentList"),
  battlePlan: document.getElementById("battlePlan"),
  decisionTrail: document.getElementById("decisionTrail"),
  questionInput: document.getElementById("questionInput"),
  composer: document.getElementById("composer"),
  quickPrompts: document.getElementById("quickPrompts"),
  resetBtn: document.getElementById("resetBtn"),
  plannerRing: document.getElementById("plannerRing"),
  plannerScore: document.getElementById("plannerScore"),
  selectedCount: document.getElementById("selectedCount"),
  currentIntent: document.getElementById("currentIntent"),
  latencyLabel: document.getElementById("latencyLabel"),
  metricConfidence: document.getElementById("metricConfidence"),
  metricConfidenceNote: document.getElementById("metricConfidenceNote"),
  metricDepth: document.getElementById("metricDepth"),
  metricDepthNote: document.getElementById("metricDepthNote"),
  metricReadiness: document.getElementById("metricReadiness"),
  metricReadinessNote: document.getElementById("metricReadinessNote"),
  metricIntent: document.getElementById("metricIntent"),
  metricIntentNote: document.getElementById("metricIntentNote"),
  turnHint: document.getElementById("turnHint"),
  updatedAt: document.getElementById("updatedAt")
};

const state = {
  registry: DEFAULT_REGISTRY,
  history: []
};

function fmtTime(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderQuickPrompts(prompts) {
  els.quickPrompts.innerHTML = prompts.map((prompt) => `<button type="button" class="prompt-btn" data-prompt="${escapeHtml(prompt)}">${escapeHtml(prompt)}</button>`).join("");
  els.quickPrompts.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      els.questionInput.value = button.dataset.prompt || "";
      runPlan();
    });
  });
}

function renderTranscript() {
  if (!state.history.length) {
    els.transcript.innerHTML = `
      <div class="message">
        <div class="label">Commander</div>
        <p>질문을 넣으면 Planner가 필요한 Agent만 조합해서 답합니다. 예시 질문으로 빠르게 흐름을 볼 수 있습니다.</p>
      </div>
    `;
    return;
  }

  els.transcript.innerHTML = state.history.map((item) => {
    if (item.role === "user") {
      return `
        <div class="message user">
          <div class="label">User</div>
          <p>${escapeHtml(item.text)}</p>
        </div>
      `;
    }

    return `
      <div class="message">
        <div class="label">Commander</div>
        <p>${escapeHtml(item.text)}</p>
      </div>
    `;
  }).join("");
  els.transcript.scrollTop = els.transcript.scrollHeight;
}

function renderMetrics(plan) {
  const confidencePct = Math.round(plan.confidence * 100);
  els.plannerRing.style.setProperty("--score", confidencePct);
  els.plannerScore.textContent = `${confidencePct}%`;
  els.selectedCount.textContent = String(plan.selectedAgents.length);
  els.currentIntent.textContent = plan.intent;
  els.metricConfidence.textContent = `${confidencePct}%`;
  els.metricConfidenceNote.textContent = plan.reasoning[0] || "Planner confidence based on routing clarity.";
  els.metricDepth.textContent = String(plan.selectedAgents.length);
  els.metricDepthNote.textContent = `${plan.selectedAgents.length}개의 Agent가 연결됩니다.`;
  els.metricReadiness.textContent = plan.selectedAgents.length >= 3 ? "High" : "Medium";
  els.metricReadinessNote.textContent = plan.selectedAgents.length >= 3 ? "다단계 검토 체계가 구성되었습니다." : "짧은 질의는 라이트 라우팅으로 응답합니다.";
  els.metricIntent.textContent = plan.intent;
  els.metricIntentNote.textContent = plan.summary;
  els.latencyLabel.textContent = plan.selectedAgents.length >= 3 ? "Planner+" : "Instant";
  els.updatedAt.textContent = fmtTime(plan.updatedAt);
  els.turnHint.textContent = `${plan.selectedAgents.length}개 Agent가 선택되었습니다.`;
}

function renderAgents(plan) {
  els.agentList.innerHTML = state.registry.agents.map((agent) => {
    const isActive = plan.selectedAgentIds.includes(agent.id);
    const statusClass = isActive ? "good" : "warn";
    const sample = agent.sample || {};
    const sampleLine =
      agent.id === "market-regime" ? `${sample.regime || "-"} / confidence ${Math.round((sample.confidence || 0) * 100)}%`
        : agent.id === "option-playbook" ? `${sample.top || "-"} · avoid ${sample.avoid || "-"}`
        : agent.id === "validation" ? `${sample.label || "-"} · score ${sample.score || "-"}`
        : `${sample.allocation ?? "-"} / ${sample.selection ?? "-"}`;

    return `
      <article class="agent-card ${isActive ? "active" : ""}">
        <div class="agent-card__head">
          <strong>${escapeHtml(agent.name)}</strong>
          <span class="tag ${statusClass}">${isActive ? "selected" : "standby"}</span>
        </div>
        <div class="tag-row">
          <span class="tag">${escapeHtml(agent.alias)}</span>
          <span class="tag">${escapeHtml(agent.purpose)}</span>
        </div>
        <div class="tag-row">
          ${agent.outputs.slice(0, 3).map((output) => `<span class="tag">${escapeHtml(output)}</span>`).join("")}
        </div>
        <div class="tag-row">
          <span class="tag ${isActive ? "good" : ""}">${escapeHtml(sampleLine)}</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderBattlePlan(plan) {
  els.battlePlan.innerHTML = plan.battlePlan.map((step) => `
    <li>
      <strong>${escapeHtml(step.title)}</strong>
      <p>${escapeHtml(step.text)}</p>
    </li>
  `).join("");
}

function renderTrail(plan) {
  els.decisionTrail.innerHTML = `
    <strong>${escapeHtml(plan.summary)}</strong>
    <p>${escapeHtml(plan.reasoning.join(" "))}</p>
    <div class="tag-row" style="margin-top:8px;">
      ${plan.selectedAgents.map((agent) => `<span class="tag">${escapeHtml(agent.name)}</span>`).join("")}
    </div>
  `;
}

function pushConversation(userText, plan) {
  state.history.unshift({
    role: "assistant",
    text: `${plan.summary}\n\n- Selected: ${plan.selectedAgents.map((agent) => agent.name).join(" → ")}\n- Reason: ${plan.reasoning.join(" ")}\n- Next: ${plan.battlePlan[1]?.text || "검토 포인트 정리"}`
  });
  state.history.unshift({ role: "user", text: userText });
}

function runPlan() {
  const question = els.questionInput.value.trim();
  if (!question) return;

  const plan = planQuestion(question, state.registry);
  pushConversation(question, plan);
  renderTranscript();
  renderMetrics(plan);
  renderAgents(plan);
  renderBattlePlan(plan);
  renderTrail(plan);
}

async function bootstrap() {
  state.registry = await loadRegistry();
  renderQuickPrompts(state.registry.prompts || DEFAULT_REGISTRY.prompts);
  const initialQuestion = state.registry.prompts?.[0] || "지금 추천 전략은?";
  els.questionInput.value = initialQuestion;
  runPlan();
}

els.composer.addEventListener("submit", (event) => {
  event.preventDefault();
  runPlan();
});

els.resetBtn.addEventListener("click", () => {
  state.history = [];
  els.questionInput.value = "";
  renderTranscript();
  els.agentList.innerHTML = "";
  els.battlePlan.innerHTML = "";
  els.decisionTrail.innerHTML = `
    <strong>Planner 대기 상태</strong>
    <p>질문이 들어오면 어떤 Agent를 먼저 호출할지 결정합니다.</p>
  `;
});

bootstrap();
