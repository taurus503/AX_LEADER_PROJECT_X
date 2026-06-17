import { DEFAULT_TOOL_REGISTRY, loadMemoryRecords, loadToolRegistry, planQuestion, saveMemoryRecord } from "./planner.js";

const els = {
  transcript: document.getElementById("transcript"),
  agentList: document.getElementById("agentList"),
  toolCallList: document.getElementById("toolCallList"),
  reflectionLoop: document.getElementById("reflectionLoop"),
  memoryForm: document.getElementById("memoryForm"),
  memoryRegime: document.getElementById("memoryRegime"),
  memoryStrategy: document.getElementById("memoryStrategy"),
  memoryResult: document.getElementById("memoryResult"),
  memoryList: document.getElementById("memoryList"),
  memoryPreview: document.getElementById("memoryPreview"),
  memoryCount: document.getElementById("memoryCount"),
  memoryRefreshBtn: document.getElementById("memoryRefreshBtn"),
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
  memory: loadMemoryRecords(),
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

function formatToolName(id) {
  return id.replace(/-agent$/, "").replace(/-/g, " ");
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
        <p>질문을 입력하면 Commander가 Planner를 통해 Regime, Playbook, Validation 순서로 호출합니다.</p>
      </div>
    `;
    return;
  }

  els.transcript.innerHTML = state.history
    .map((item) => {
      if (item.role === "user") {
        return `
          <div class="message user">
            <div class="label">User</div>
            <p>${escapeHtml(item.text)}</p>
          </div>
        `;
      }

      const chips = [
        item.meta?.intent,
        item.meta?.path,
        item.meta?.validation,
        item.meta?.memory
      ].filter(Boolean);

      return `
        <div class="message">
          <div class="label">Commander</div>
          <p>${escapeHtml(item.text)}</p>
          ${item.meta?.summary ? `<p style="margin-top:10px;color:var(--muted)">${escapeHtml(item.meta.summary)}</p>` : ""}
          ${chips.length ? `<div class="tag-row" style="margin-top:10px;">${chips.map((chip) => `<span class="tag">${escapeHtml(chip)}</span>`).join("")}</div>` : ""}
        </div>
      `;
    })
    .join("");

  els.transcript.scrollTop = els.transcript.scrollHeight;
}

function renderRegistry(plan) {
  els.registryMeta.textContent = `${state.registry.tools.length} tools`;
  els.agentList.innerHTML = state.registry.tools
    .map((tool) => {
      const isActive = plan.selectedToolIds.includes(tool.id);
      const sampleText =
        tool.id === "regime-agent"
          ? "Transition / confidence 74%"
          : tool.id === "playbook-agent"
            ? "Bull Call Spread / Iron Condor"
            : tool.id === "validation-agent"
              ? "PASS / REVIEW / REJECT"
              : tool.id === "reflection-agent"
                ? "Risk review / recheck"
                : tool.id === "memory-agent"
                  ? "Memory JSON store / recall"
                  : "allocation / selection / interaction";

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
    })
    .join("");
}

function renderToolCalls(plan) {
  els.toolCallList.innerHTML = plan.toolCalls
    .map((call) => {
      const outputLine = call.id === "regime-agent"
        ? `Regime: ${call.output.currentRegime}, Event Risk: ${call.output.eventRisk}, Confidence: ${Math.round(call.output.confidenceScore * 100)}%`
        : call.id === "playbook-agent"
          ? `Top: ${call.output.topRecommended[0]}, Avoid: ${call.output.avoidNow[0]}, Score: ${call.output.strategyScore}`
          : call.id === "memory-agent"
            ? `Stored: ${call.output.storedCount}, Recent: ${call.output.recent.length}`
            : String(call.id).includes("validation-agent")
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
    })
    .join("");
}

function renderReflection(plan) {
  const reflection = plan.reflection;
  const validation = plan.validation;
  const memoryCue = plan.memoryCue;

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
      <strong>Memory Cue</strong>
      <p>${escapeHtml(memoryCue?.note || "No matching memory found.")}</p>
    </div>
    <div class="trail-card">
      <strong>Revised Answer</strong>
      <p>${escapeHtml(plan.finalAnswer)}</p>
    </div>
  `;
}

function renderMemory() {
  els.memoryCount.textContent = `${state.memory.length} saved`;
  els.memoryPreview.textContent = state.memory.length
    ? JSON.stringify(state.memory[0], null, 2)
    : JSON.stringify({ regime: "Momentum", strategy: "Iron Condor", result: "loss" }, null, 2);

  els.memoryList.innerHTML = state.memory.length
    ? state.memory.slice(0, 6).map((entry) => `
        <article class="trail-card">
          <strong>${escapeHtml(entry.regime || "-")} / ${escapeHtml(entry.strategy || "-")}</strong>
          <p>${escapeHtml(`${entry.result || "-"} · ${entry.timestamp ? fmtTime(entry.timestamp) : ""}`)}</p>
        </article>
      `).join("")
    : `
        <article class="trail-card">
          <strong>No memory saved yet</strong>
          <p>Store regime, strategy, and result as JSON so the next recommendation can reuse it.</p>
        </article>
      `;
}

function renderBattlePlan(plan) {
  els.battlePlan.innerHTML = plan.battlePlan
    .map((step) => `
      <li>
        <strong>${escapeHtml(step.title)}</strong>
        <p>${escapeHtml(step.text)}</p>
      </li>
    `)
    .join("");
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
  const path = plan.selectedTools.map((tool) => tool.name).join(" → ");
  const validationLabel = plan.validation?.label || "PASS";
  const memoryNote = plan.memoryCue?.note || "No memory cue";

  state.history.push(
    { role: "user", text: userText },
    {
      role: "assistant",
      text: plan.finalAnswer,
      meta: {
        summary: plan.summary,
        intent: plan.intent,
        path,
        validation: `${validationLabel} / ${plan.validation?.validationScore ?? "-"}`,
        memory: memoryNote
      }
    }
  );
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

  const plan = planQuestion(question, state.registry, state.memory);
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
  state.memory = loadMemoryRecords();
  renderQuickPrompts(state.registry.prompts || DEFAULT_TOOL_REGISTRY.prompts);
  els.questionInput.value = state.registry.prompts?.[0] || "이번 월물 추천";
  runPlan();
  renderMemory();
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

els.memoryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nextMemory = saveMemoryRecord({
    regime: els.memoryRegime.value,
    strategy: els.memoryStrategy.value,
    result: els.memoryResult.value
  });
  state.memory = nextMemory;
  renderMemory();
  if (els.questionInput.value.trim()) {
    runPlan();
  }
});

els.memoryRefreshBtn.addEventListener("click", () => {
  state.memory = loadMemoryRecords();
  renderMemory();
  if (els.questionInput.value.trim()) {
    runPlan();
  }
});

bootstrap();
