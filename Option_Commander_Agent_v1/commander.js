const els = {
  transcript: document.getElementById("transcript"),
  agentList: document.getElementById("agentList"),
  toolCallList: document.getElementById("toolCallList"),
  reflectionLoop: document.getElementById("reflectionLoop"),
  executionTrace: document.getElementById("executionTrace"),
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
  asOfDateInput: document.getElementById("asOfDateInput"),
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

const MEMORY_KEY = "option-commander-memory-v1";

const state = {
  registry: null,
  memory: loadMemoryRecords(),
  history: [],
  lastResponse: null
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

function extractDateHint(value = "") {
  const text = String(value || "");
  const iso = text.match(/(20\d{2}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const dotted = text.match(/(20\d{2})[./](\d{1,2})[./](\d{1,2})/);
  if (dotted) {
    const [, year, month, day] = dotted;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const korean = text.match(/(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (korean) {
    const [, year, month, day] = korean;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return "";
}

function getDefaultTradingDate(referenceDate = new Date()) {
  const date = new Date(referenceDate);
  date.setDate(date.getDate() - 1);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() - 1);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function postDateSync(asOfDate, source = "Commander") {
  const normalized = extractDateHint(asOfDate) || getDefaultTradingDate();
  window.parent?.postMessage(
    {
      type: "commander-date-sync",
      asOfDate: normalized,
      source
    },
    "*"
  );
  return normalized;
}

function applyDateInput(value, { broadcast = true, source = "Commander" } = {}) {
  const normalized = extractDateHint(value) || getDefaultTradingDate();
  if (els.asOfDateInput) {
    els.asOfDateInput.value = normalized;
  }
  if (broadcast) {
    postDateSync(normalized, source);
  }
  return normalized;
}

function loadMemoryRecords() {
  try {
    const raw = window.localStorage.getItem(MEMORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMemoryRecord(record) {
  const next = [
    {
      regime: String(record?.regime || "").trim(),
      strategy: String(record?.strategy || "").trim(),
      result: String(record?.result || "").trim(),
      validation_label: String(record?.validation_label || "").trim(),
      timestamp: record?.timestamp || new Date().toISOString()
    },
    ...loadMemoryRecords()
  ]
    .filter((item) => item.regime || item.strategy || item.result)
    .slice(0, 20);

  window.localStorage.setItem(MEMORY_KEY, JSON.stringify(next));
  return next;
}

async function loadRegistry() {
  try {
    const response = await fetch("./tool-registry.json", { cache: "no-store" });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // fallback below
  }

  return {
    tools: [
      { id: "regime-agent", name: "Regime Agent", label: "Module 1", purpose: "Analyze market regime first", outputs: ["Current Regime", "Confidence Score", "Event Risk"] },
      { id: "playbook-agent", name: "Playbook Agent", label: "Module 2", purpose: "Recommend option playbooks by regime", outputs: ["Top Recommended 9", "Avoid Now 6", "Strategy Score"] },
      { id: "validation-agent", name: "Validation Agent", label: "Module 3", purpose: "Red-team the candidate and label PASS/REVIEW/REJECT", outputs: ["PASS", "REVIEW", "REJECT"] },
      { id: "reflection-agent", name: "Reflection Agent", label: "Reflection", purpose: "Self-review strategy result and trigger recheck when needed", outputs: ["Risk Review", "Validation Trigger", "Revised Answer"] },
      { id: "memory-agent", name: "Memory Agent", label: "Memory", purpose: "Persist regime / strategy / result JSON", outputs: ["regime", "strategy", "result"] },
      { id: "attribution-agent", name: "Attribution Agent", label: "Module 4", purpose: "Decompose performance into allocation / selection / interaction", outputs: ["Allocation Effect", "Selection Effect", "Interaction Effect"] }
    ],
    prompts: ["이번 월물 추천", "지금 추천 전략은?", "과거 기준일로 다시 추천해줘"]
  };
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
        <p>질문을 입력하면 Commander API가 Planner와 Agent들을 호출합니다.</p>
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

      const chips = [item.meta?.intent, item.meta?.validation, item.meta?.memory_used ? "memory used" : null].filter(Boolean);
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

function renderRegistry() {
  els.registryMeta.textContent = `${state.registry.tools.length} tools`;
  els.agentList.innerHTML = state.registry.tools
    .map((tool) => {
      const isActive = state.lastResponse?.selected_agents?.includes(tool.name);
      const sampleText =
        tool.id === "regime-agent"
          ? "Current Regime / Confidence"
          : tool.id === "playbook-agent"
            ? "Top Recommended / Avoid Now"
            : tool.id === "validation-agent"
              ? "PASS / REVIEW / REJECT"
              : tool.id === "reflection-agent"
                ? "Recheck / conservative"
                : tool.id === "memory-agent"
                  ? "JSON memory"
                  : "Allocation / Selection / Interaction";

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

function renderToolCalls(response) {
  const toolResults = response?.tool_results || [];
  els.toolCallList.innerHTML = toolResults
    .map((call) => {
      const summary =
        call.agent === "Regime Agent"
          ? `Regime: ${call.output.currentRegime}, Event Risk: ${call.output.eventRisk}, Confidence: ${Math.round((call.output.confidenceScore || 0) * 100)}%`
          : call.agent === "Playbook Agent"
            ? `Top: ${call.output.topRecommended?.[0] || "-"}, Avoid: ${call.output.avoidNow?.[0] || "-"}, Score: ${call.output.strategyScore}`
            : call.agent === "Validation Agent"
              ? `Label: ${call.output.label}, Score: ${call.output.validationScore}`
              : call.agent === "Reflection Agent"
                ? `Self-review: ${call.output.selfReview}`
                : call.agent === "Memory Agent"
                  ? `Stored memory: ${call.output.regime || "-"} / ${call.output.strategy || "-"} / ${call.output.result || "-"}`
                  : `Update signal: ${call.output.updateSignal || "-"}`;
      const source = call.source ? `<p style="margin-top:6px;color:var(--muted);font-size:12px;">source: ${escapeHtml(call.source)}</p>` : "";

      return `
        <article class="trail-card">
          <strong>${escapeHtml(call.agent)}</strong>
          <p>${escapeHtml(summary)}</p>
          ${source}
          <p style="margin-top:6px;color:var(--muted);font-size:12px;">retry ${call.retry_count || 0} / ${call.fallback_used ? "fallback used" : "normal"}</p>
        </article>
      `;
    })
    .join("");
}

function renderReflection(response) {
  const reflection = response?.tool_results?.find((item) => item.agent === "Reflection Agent")?.output;
  const validation = response?.tool_results?.find((item) => item.agent === "Validation Agent")?.output;
  const memory = response?.memory_record;

  els.reflectionLoop.innerHTML = `
    <div class="trail-card">
      <strong>Reflection Summary</strong>
      <p>${escapeHtml(reflection?.selfReview || "No reflection result available.")}</p>
    </div>
    <div class="trail-card">
      <strong>Validation Recheck</strong>
      <p>${escapeHtml(validation ? `${validation.label} / ${validation.validationScore} / ${validation.riskWarning}` : "No validation result available.")}</p>
    </div>
    <div class="trail-card">
      <strong>Memory Cue</strong>
      <p>${escapeHtml(memory ? `${memory.regime} / ${memory.strategy} / ${memory.validation_label}` : "No memory record saved yet.")}</p>
    </div>
    <div class="trail-card">
      <strong>Revised Answer</strong>
      <p>${escapeHtml(response?.final_answer || "No final answer available.")}</p>
    </div>
  `;
}

function renderExecutionTrace(response) {
  const trace = response?.trace || response || {};
  const cards = [
    ["question", trace.question],
    ["intent", trace.intent],
    ["date_hint", trace.date_hint || ""],
    ["historical_mode", String(Boolean(trace.historical_mode))],
    ["question_profile", trace.question_profile ? JSON.stringify(trace.question_profile, null, 2) : ""],
    ["selected_agents", Array.isArray(trace.selected_agents) ? trace.selected_agents.join(" / ") : ""],
    ["tool_results", JSON.stringify((trace.tool_results || []).map((item) => ({
      agent: item.agent,
      retry_count: item.retry_count,
      fallback_used: item.fallback_used
    })), null, 2)],
    ["validation_label", trace.validation_label],
    ["memory_used", String(Boolean(trace.memory_used))],
    ["retry_count", String(trace.retry_count ?? 0)],
    ["fallback_used", String(Boolean(trace.fallback_used))],
    ["failed_tools", Array.isArray(trace.failed_tools) ? trace.failed_tools.join(", ") : ""],
    ["snapshot_source", trace.snapshot_source || ""],
    ["snapshot_used", String(Boolean(trace.snapshot_used))],
    ["final_answer", trace.final_answer]
  ];

  els.executionTrace.innerHTML = cards
    .map(([label, value]) => `
      <article class="trail-card">
        <strong>${escapeHtml(label)}</strong>
        <p>${escapeHtml(value || "-")}</p>
      </article>
    `)
    .join("");
}

function renderMemoryList() {
  els.memoryCount.textContent = `${state.memory.length} saved`;
  els.memoryPreview.textContent = state.memory.length
    ? JSON.stringify(state.memory[0], null, 2)
    : JSON.stringify({ regime: "Momentum", strategy: "Iron Condor", result: "REVIEW" }, null, 2);

  els.memoryList.innerHTML = state.memory.length
    ? state.memory.slice(0, 6).map((entry) => `
        <article class="trail-card">
          <strong>${escapeHtml(entry.regime || "-")} / ${escapeHtml(entry.strategy || "-")}</strong>
          <p>${escapeHtml(`${entry.result || "-"} / ${entry.timestamp ? fmtTime(entry.timestamp) : ""}`)}</p>
        </article>
      `).join("")
    : `
        <article class="trail-card">
          <strong>No memory saved yet</strong>
          <p>Store regime, strategy, and result as JSON so the next recommendation can reuse it.</p>
        </article>
      `;
}

function renderBattlePlan(response) {
  const battlePlan = response?.battle_plan || [];
  els.battlePlan.innerHTML = battlePlan
    .map((step) => `
      <li>
        <strong>${escapeHtml(step)}</strong>
        <p>Commander flow checkpoint</p>
      </li>
    `)
    .join("");
}

function renderDecisionTrail(response) {
  const reason = Array.isArray(response?.reason) ? response.reason.join(" ") : "";
  const executionPlan = Array.isArray(response?.execution_plan) ? response.execution_plan : [];
  els.decisionTrail.innerHTML = `
    <strong>${escapeHtml(response?.final_answer || "Planner standby")}</strong>
    <p>${escapeHtml(reason)}</p>
    <p style="margin-top:10px;color:var(--muted);font-size:12px;white-space:pre-wrap;">${escapeHtml(JSON.stringify({
      intent: response?.intent,
      confidence: response?.confidence,
      question_profile: response?.question_profile,
      selected_agents: response?.selected_agents,
      fallback_plan: response?.fallback_plan,
      execution_plan: executionPlan.map((item) => ({ agent: item.agent, purpose: item.purpose }))
    }, null, 2))}</p>
  `;
}

function renderMetrics(response) {
  const confidencePct = Math.round((response?.confidence || 0.72) * 100);
  const selectedAgents = response?.selected_agents || [];
  els.plannerRing.style.setProperty("--score", confidencePct);
  els.plannerScore.textContent = `${confidencePct}%`;
  els.selectedCount.textContent = String(selectedAgents.length);
  els.currentIntent.textContent = response?.question_profile?.intent || response?.intent || "Strategy";
  els.metricConfidence.textContent = `${confidencePct}%`;
  els.metricConfidenceNote.textContent = response?.question_profile?.answer_focus || response?.reason?.[0] || "Planner confidence based on routing clarity.";
  els.metricDepth.textContent = String(selectedAgents.length);
  els.metricDepthNote.textContent = `${selectedAgents.length} tools are connected.`;
  els.metricReadiness.textContent = response?.validation_label || "REVIEW";
  els.metricReadinessNote.textContent = response?.core_risk || "Validation output not available.";
  els.metricIntent.textContent = response?.question_profile?.intent || response?.intent || "Strategy";
  els.metricIntentNote.textContent = response?.question_profile?.answer_focus || response?.recommended_strategy || response?.final_answer || "Ready";
  els.latencyLabel.textContent = response?.fallback_used ? "Fallback" : "API";
  els.updatedAt.textContent = response?.tool_results?.length ? fmtTime(new Date().toISOString()) : "Ready";
  els.turnHint.textContent = response?.date_hint
    ? `Historical mode enabled for ${response.date_hint}. Natural-language question routed through LLM.`
    : response?.memory_used
      ? "Memory agent referenced prior JSON."
      : "Commander API is driving the flow with LLM question understanding.";
}

function pushConversation(userText, response) {
  state.history.push(
    { role: "user", text: userText },
    {
      role: "assistant",
      text: response.final_answer,
      meta: {
        summary: response.reason?.join(" ") || "",
        intent: response.intent,
        validation: response.validation_label,
        memory_used: response.memory_used
      }
    }
  );
}

function mockFallbackResponse(question) {
  const dateHint = extractDateHint(question) || extractDateHint(els.asOfDateInput?.value || "");
  const isStrategy = /추천|전략|month|monthly|strategy/i.test(question);
  const regime = isStrategy ? "Transition" : "Bull/Calm";
  const strategy = isStrategy ? "Iron Condor" : "Bull Call Spread";
  const validationLabel = isStrategy ? "REVIEW" : "PASS";
  const memoryRecord = {
    regime,
    strategy,
    result: validationLabel,
    validation_label: validationLabel,
    timestamp: new Date().toISOString()
  };

  const finalAnswer = [
    "1. 결론",
    `- 현재 시장 국면은 **${regime}**이며, 추천 전략 검토 대상은 **${strategy}**입니다.`,
    `- 검증 결과는 **${validationLabel}**입니다.`,
    "2. 근거",
    "- Fallback mode에서 생성된 보수적 결과입니다.",
    "- 추가 확인이 필요합니다.",
    "3. 다음 안내",
    "- 투자판단을 대신하지 않고 검토 후보로만 보아야 합니다."
  ].join("\n");

  return {
    question,
    intent: isStrategy ? "Strategy" : "Market Regime",
    confidence: 0.68,
    selected_agents: ["Regime Agent", "Playbook Agent", "Validation Agent", "Reflection Agent", "Memory Agent"],
    reason: ["Fallback mode was used because the API was not reachable."],
    execution_plan: [],
    tool_results: [
      { agent: "Regime Agent", output: { currentRegime: regime, eventRisk: "high", confidenceScore: 0.74 }, retry_count: 0, fallback_used: true },
      { agent: "Playbook Agent", output: { topRecommended: [strategy], avoidNow: ["Short Straddle"], strategyScore: 84 }, retry_count: 0, fallback_used: true },
      { agent: "Validation Agent", output: { label: validationLabel, validationScore: 69, riskWarning: "Fallback validation" }, retry_count: 0, fallback_used: true },
      { agent: "Reflection Agent", output: { selfReview: "Fallback reflection", shouldRevalidate: true }, retry_count: 0, fallback_used: true },
      { agent: "Memory Agent", output: memoryRecord, retry_count: 0, fallback_used: true }
    ],
    validation_label: validationLabel,
    current_regime: regime,
    recommended_strategy: strategy,
    core_risk: "Fallback mode uses a conservative REVIEW stance.",
    memory_used: true,
    memory_record: memoryRecord,
    date_hint: dateHint,
    historical_mode: Boolean(dateHint),
    retry_count: 0,
    fallback_used: true,
    failed_tools: ["commander-api"],
    final_answer: finalAnswer,
    battle_plan: ["User Question", "Planner", "Regime Agent", "Playbook Agent", "Validation Agent", "Reflection Agent", "Memory Agent", "Final Answer"],
    trace: {
      question,
      intent: isStrategy ? "Strategy" : "Market Regime",
      selected_agents: ["Regime Agent", "Playbook Agent", "Validation Agent", "Reflection Agent", "Memory Agent"],
      tool_results: [],
      validation_label: validationLabel,
      memory_used: true,
      date_hint: dateHint,
      historical_mode: Boolean(dateHint),
      retry_count: 0,
      fallback_used: true,
      failed_tools: ["commander-api"],
      final_answer: finalAnswer
    }
  };
}

async function callCommander(question) {
  const questionDateHint = extractDateHint(question);
  const currentDateHint = extractDateHint(els.asOfDateInput?.value || "");
  const dateHint = applyDateInput(questionDateHint || currentDateHint || question, {
    broadcast: true,
    source: "Commander Submit"
  });
  const response = await fetch("./api/commander", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      question,
      memory_records: state.memory,
      hints: {
        as_of_date: questionDateHint || dateHint || null,
        date_hint: questionDateHint || dateHint || null,
        question_date_hint: questionDateHint || null
      }
    })
  });

  if (!response.ok) {
    throw new Error(`API failed with ${response.status}`);
  }

  return response.json();
}

async function runPlan() {
  const question = els.questionInput.value.trim();
  if (!question) return;

  let response;
  try {
    response = await callCommander(question);
  } catch {
    response = mockFallbackResponse(question);
  }

  state.lastResponse = response;
  pushConversation(question, response);

  if (response.memory_record) {
    state.memory = saveMemoryRecord(response.memory_record);
  }

  renderTranscript();
  renderRegistry();
  renderToolCalls(response);
  renderReflection(response);
  renderExecutionTrace(response);
  renderMemoryList();
  renderBattlePlan(response);
  renderDecisionTrail(response);
  renderMetrics(response);
}

async function bootstrap() {
  state.registry = await loadRegistry();
  renderQuickPrompts(state.registry.prompts || []);
  els.questionInput.value = state.registry.prompts?.[0] || "이번 월물 추천";
  applyDateInput(getDefaultTradingDate(), { broadcast: true, source: "Commander Boot" });
  renderMemoryList();
  renderTranscript();
  renderRegistry();
  renderDecisionTrail({});
}

els.composer.addEventListener("submit", (event) => {
  event.preventDefault();
  runPlan();
});

els.questionInput.addEventListener("keydown", (event) => {
  if (event.isComposing) return;
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    els.composer.requestSubmit();
  }
});

els.asOfDateInput.addEventListener("change", (event) => {
  applyDateInput(event.target.value, { broadcast: true, source: "Commander Date Change" });
});

els.resetBtn.addEventListener("click", () => {
  state.history = [];
  els.questionInput.value = "";
  applyDateInput(getDefaultTradingDate(), { broadcast: true, source: "Commander Reset" });
  state.lastResponse = null;
  renderTranscript();
  renderRegistry();
  renderToolCalls({});
  renderReflection({});
  renderExecutionTrace({});
  renderBattlePlan({});
  renderDecisionTrail({});
});

els.memoryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nextMemory = saveMemoryRecord({
    regime: els.memoryRegime.value,
    strategy: els.memoryStrategy.value,
    result: els.memoryResult.value,
    validation_label: els.memoryResult.value
  });
  state.memory = nextMemory;
  renderMemoryList();
});

els.memoryRefreshBtn.addEventListener("click", () => {
  state.memory = loadMemoryRecords();
  renderMemoryList();
});

window.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  if (data.type !== "combined-date-sync" && data.type !== "commander-date-sync" && data.type !== "regime-date-sync") return;
  applyDateInput(data.asOfDate, { broadcast: false, source: "Commander Sync" });
});

bootstrap();
