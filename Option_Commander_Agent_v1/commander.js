import { DEFAULT_TOOL_REGISTRY, loadToolRegistry, planQuestion } from "./planner.js";

const els = {
  transcript: document.getElementById("transcript"),
  agentList: document.getElementById("agentList"),
  toolCallList: document.getElementById("toolCallList"),
  reflectionLoop: document.getElementById("reflectionLoop"),
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
  updatedAt: document.getElementById("updatedAt"),
  registryMeta: document.getElementById("registryMeta")
};

const state = {
  registry: DEFAULT_TOOL_REGISTRY,
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
  els.quickPrompts.innerHTML = prompts
    .map((prompt) => `<button type="button" class="prompt-btn" data-prompt="${escapeHtml(prompt)}">${escapeHtml(prompt)}</button>`)
    .join("");

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
        <p>질문을 넣으면 Planner가 Tool Registry를 읽고 필요한 Agent만 호출합니다.</p>
      </div>
    `;
    return;
  }

  els.transcript.innerHTML = state.history.map((item) => {
    const label = item.role === "user" ? "User" : "Commander";
    const className = item.role === "user" ? "message user" : "message";
    return `
      <div class="${className}">
        <div class="label">${label}</div>
        <p>${escapeHtml(item.text)}</p>
      </div>
    `;
  }).join("");

  els.transcript.scrollTop = els.transcript.scrollHeight;
}

function renderRegistry(plan) {
  els.registryMeta.textContent = `${state.registry.tools.length} tools`;
  els.agentList.innerHTML = state.registry.tools.map((tool) => {
    const isActive = plan.selectedToolIds.includes(tool.id);
    const sampleText =
      tool.id === "regime-agent"
        ? "Transition / confidence 74%"
        : tool.id === "playbook-agent"
          ? "Bull Call Spread → Short Straddle"
          : tool.id === "reflection-agent"
            ? "Risk review → validation recheck"
            : tool.id === "validation-agent"
              ? "REVIEW / 69"
              : "allocation 2.4 / selection 3.1";

    return `
      <article class="agent-card ${isActive ? "active" : ""}">
        <div class="agent-card__head">
          <strong>${escapeHtml(tool.name)}</strong>
          <span class="tag ${isActive ? "good" : "warn"}">${isActive ? "selected" : "standby"}</span>
        </div>
        <div class="tag-row">
          <span class="tag">${escapeHtml(tool.label)}</span>
          <span class="tag">${escapeHtml(tool.purpose)}</span>
        </div>
        <div class="tag-row">
          ${tool.outputs.slice(0, 3).map((output) => `<span class="tag">${escapeHtml(output)}</span>`).join("")}
        </div>
        <div class="tag-row">
          <span class="tag ${isActive ? "good" : ""}">${escapeHtml(sampleText)}</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderToolCalls(plan) {
  els.toolCallList.innerHTML = plan.toolCalls.map((call) => {
    const outputLine = call.id === "regime-agent"
      ? `Regime: ${call.output.currentRegime}, Event Risk: ${call.output.eventRisk}, Confidence: ${Math.round(call.output.confidenceScore * 100)}%`
      : call.id === "playbook-agent"
        ? `Top: ${call.output.topRecommended[0]}, Avoid: ${call.output.avoidNow[0]}, Score: ${call.output.strategyScore}`
        : String(call.id).startsWith("validation-agent")
          ? `Label: ${call.output.label}, Score: ${call.output.validationScore}`
          : call.id === "reflection-agent"
            ? `Self-review: ${call.output.selfReview}`
            : `Alpha: ${call.output.alphaSource}, Update: ${call.output.updateSignal}`;

    return `
      <article class="trail-card">
        <strong>${escapeHtml(call.name)}</strong>
        <p>${escapeHtml(outputLine)}</p>
      </article>
    `;
  }).join("");
}

function renderReflection(plan) {
  const reflection = plan.reflection;
  const validation = plan.validation;

  els.reflectionLoop.innerHTML = `
    <div class="trail-card">
      <strong>Reflection Summary</strong>
      <p>${escapeHtml(reflection?.selfReview || "No reflection result available.")}</p>
    </div>
    <div class="trail-card">
      <strong>Validation Recheck</strong>
      <p>${escapeHtml(validation ? `${validation.label} / ${validation.validationScore} / ${validation.riskWarning}` : "No recheck needed.")}</p>
    </div>
    <div class="trail-card">
      <strong>Revised Answer</strong>
      <p>${escapeHtml(plan.finalAnswer)}</p>
    </div>
  `;
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
      ${plan.selectedTools.map((tool) => `<span class="tag">${escapeHtml(tool.name)}</span>`).join("")}
    </div>
  `;
}

function pushConversation(userText, plan) {
  state.history.unshift({
    role: "assistant",
    text: `${plan.summary}\n\n- Selected: ${plan.selectedTools.map((tool) => tool.name).join(" → ")}\n- Reflection: ${plan.reflection?.selfReview || "none"}\n- Result: ${plan.finalAnswer}`
  });
  state.history.unshift({ role: "user", text: userText });
}

function renderMetrics(plan) {
  const confidencePct = Math.round(plan.confidence * 100);
  els.plannerRing.style.setProperty("--score", confidencePct);
  els.plannerScore.textContent = `${confidencePct}%`;
  els.selectedCount.textContent = String(plan.selectedTools.length);
  els.currentIntent.textContent = plan.intent;
  els.metricConfidence.textContent = `${confidencePct}%`;
  els.metricConfidenceNote.textContent = plan.reasoning[0] || "Planner confidence based on routing clarity.";
  els.metricDepth.textContent = String(plan.selectedTools.length);
  els.metricDepthNote.textContent = `${plan.selectedTools.length} tools are connected.`;
  els.metricReadiness.textContent = plan.selectedTools.length >= 3 ? "High" : "Medium";
  els.metricReadinessNote.textContent = plan.selectedTools.length >= 3 ? "Multi-step review is active." : "Light routing is enough for this request.";
  els.metricIntent.textContent = plan.intent;
  els.metricIntentNote.textContent = plan.summary;
  els.latencyLabel.textContent = plan.selectedTools.length >= 3 ? "Planner+" : "Instant";
  els.updatedAt.textContent = fmtTime(plan.updatedAt);
  els.turnHint.textContent = `${plan.selectedTools.length} tools selected.`;
}

function runPlan() {
  const question = els.questionInput.value.trim();
  if (!question) return;
  const plan = planQuestion(question, state.registry);
  pushConversation(question, plan);
  renderTranscript();
  renderMetrics(plan);
  renderRegistry(plan);
  renderToolCalls(plan);
  renderReflection(plan);
  renderBattlePlan(plan);
  renderTrail(plan);
}

async function bootstrap() {
  state.registry = await loadToolRegistry();
  renderQuickPrompts(state.registry.prompts || DEFAULT_TOOL_REGISTRY.prompts);
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
  els.toolCallList.innerHTML = "";
  els.reflectionLoop.innerHTML = "";
  els.battlePlan.innerHTML = "";
  els.decisionTrail.innerHTML = `
    <strong>Planner standby</strong>
    <p>Type a question and the Planner will choose the next tool call.</p>
  `;
});

bootstrap();
