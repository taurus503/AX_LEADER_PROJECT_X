export const DEFAULT_TOOL_REGISTRY = {
  project: "Option Commander Agent",
  version: "v1",
  tools: [
    {
      id: "regime-agent",
      name: "Regime Agent",
      agentId: "market-regime",
      label: "Module 1",
      purpose: "Analyze market regime first",
      triggers: ["regime", "market", "volatility", "direction", "event risk", "now", "today", "current"],
      outputs: ["Current Regime", "Confidence Score", "Event Risk", "Market Interpretation", "Regime Reason"]
    },
    {
      id: "playbook-agent",
      name: "Playbook Agent",
      agentId: "option-playbook",
      label: "Module 2",
      purpose: "Recommend option playbooks by regime",
      triggers: ["strategy", "playbook", "option", "recommend", "hedge", "trade", "추천", "전략"],
      outputs: ["Top Recommended 9", "Avoid Now 6", "Strategy Score", "Risk Level", "Expected Return", "Playbook Mapping"]
    },
    {
      id: "validation-agent",
      name: "Validation Agent",
      agentId: "validation",
      label: "Module 3",
      purpose: "Red-team the candidate and label PASS/REVIEW/REJECT",
      triggers: ["validation", "review", "reject", "pass", "backtest", "risk", "tail", "검증"],
      outputs: ["PASS", "REVIEW", "REJECT", "Validation Score", "Risk Warning"]
    },
    {
      id: "attribution-agent",
      name: "Attribution Agent",
      agentId: "attribution",
      label: "Module 4",
      purpose: "Decompose performance into allocation / selection / interaction",
      triggers: ["performance", "attribution", "allocation", "selection", "interaction", "alpha", "beta", "pnl", "성과"],
      outputs: ["Allocation Effect", "Selection Effect", "Interaction Effect", "Alpha Source", "Beta Source", "Update Signal"]
    },
    {
      id: "reflection-agent",
      name: "Reflection Agent",
      agentId: "reflection",
      label: "Reflection",
      purpose: "Self-review strategy result and trigger recheck when needed",
      triggers: ["reflection", "self review", "review again", "risk high", "recheck", "self-check", "재검토"],
      outputs: ["Risk Review", "Validation Trigger", "Revised Answer", "Residual Risk"]
    },
    {
      id: "memory-agent",
      name: "Memory Agent",
      agentId: "memory",
      label: "Memory",
      purpose: "Persist regime / strategy / result JSON",
      triggers: ["memory", "remember", "save", "history", "store", "저장", "기억"],
      outputs: ["regime", "strategy", "result", "timestamp"]
    }
  ],
  prompts: [
    "이번 월물 추천",
    "지금 추천 전략은?",
    "추천 결과를 다시 검토해줘",
    "이 전략을 검증까지 해줘",
    "성과가 왜 그렇게 나왔는지 분해해줘"
  ]
};

const ROUTE_RULES = [
  {
    intent: "Strategy",
    keywords: ["추천", "전략", "월물", "playbook", "option", "trade", "포지션", "이번 월물", "지금 추천"],
    sequence: ["regime-agent", "playbook-agent", "validation-agent"],
    summary: "Strategy request: route through regime, playbook, then validation."
  },
  {
    intent: "Validation",
    keywords: ["검증", "review", "reject", "pass", "backtest", "risk", "tail", "리스크"],
    sequence: ["validation-agent"],
    summary: "Validation request: focus on risk labeling and evidence."
  },
  {
    intent: "Attribution",
    keywords: ["성과", "분해", "attribution", "allocation", "selection", "interaction", "alpha", "beta", "pnl"],
    sequence: ["attribution-agent"],
    summary: "Attribution request: decompose performance and generate update signal."
  },
  {
    intent: "Reflection",
    keywords: ["reflection", "self review", "재검토", "recheck", "다시 검토", "검토"],
    sequence: ["reflection-agent", "validation-agent"],
    summary: "Reflection request: self-review first, then recheck risk."
  },
  {
    intent: "Memory",
    keywords: ["memory", "remember", "저장", "기억", "store", "history"],
    sequence: ["memory-agent"],
    summary: "Memory request: store or recall JSON memory."
  },
  {
    intent: "Market Regime",
    keywords: ["국면", "레짐", "변동성", "시장", "방향", "current", "now", "today"],
    sequence: ["regime-agent", "playbook-agent"],
    summary: "Regime request: interpret the market first."
  }
];

const MEMORY_STORAGE_KEY = "option-commander-memory-v1";

function normalize(text = "") {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[“”"'.!?,:;()[\]{}]/g, " ")
    .replace(/\s+/g, " ");
}

function unique(list) {
  return [...new Set(list)];
}

function scoreKeywords(question, keywords) {
  const q = normalize(question);
  return keywords.reduce((sum, keyword) => (q.includes(normalize(keyword)) ? sum + 1 : sum), 0);
}

function getTool(registry, id) {
  return registry.tools.find((tool) => tool.id === id) || null;
}

function hasLossRecord(memoryRecords) {
  return [...memoryRecords].reverse().some((record) => ["loss", "reject", "fail"].includes(normalize(record.result)));
}

function getMostRelevantMemory(memoryRecords, regime, strategy) {
  const normalizedRegime = normalize(regime);
  const normalizedStrategy = normalize(strategy);

  return [...memoryRecords]
    .reverse()
    .find((record) => {
      const sameRegime = normalizedRegime && normalize(record.regime) === normalizedRegime;
      const sameStrategy = normalizedStrategy && normalize(record.strategy) === normalizedStrategy;
      return sameRegime || sameStrategy;
    }) || null;
}

export function loadMemoryRecords() {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(MEMORY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMemoryRecord(record) {
  const next = [
    {
      regime: String(record?.regime || "").trim(),
      strategy: String(record?.strategy || "").trim(),
      result: String(record?.result || "").trim(),
      timestamp: record?.timestamp || new Date().toISOString()
    },
    ...loadMemoryRecords()
  ]
    .filter((item) => item.regime || item.strategy || item.result)
    .slice(0, 20);

  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(next));
  }

  return next;
}

function inferIntent(question, matched, sequence) {
  if (matched[0]?.intent) return matched[0].intent;
  if (sequence.includes("attribution-agent")) return "Attribution";
  if (sequence.includes("validation-agent")) return "Validation";
  if (sequence.includes("memory-agent")) return "Memory";
  if (sequence.includes("reflection-agent")) return "Reflection";
  return question ? "Strategy" : "Unknown";
}

function selectRoute(question, registry, memoryRecords = [], hints = {}) {
  const q = normalize(question);
  const matched = ROUTE_RULES
    .map((rule) => ({ ...rule, hits: scoreKeywords(q, rule.keywords) }))
    .filter((rule) => rule.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  let sequence = matched.flatMap((rule) => rule.sequence);
  const wantsPerformance = q.includes("성과") || q.includes("분해") || q.includes("attribution");
  const wantsValidation = q.includes("검증") || q.includes("review") || q.includes("reject") || q.includes("pass");
  const wantsMemory = q.includes("memory") || q.includes("remember") || q.includes("저장") || q.includes("기억");
  const wantsReflection = q.includes("reflection") || q.includes("재검토") || q.includes("recheck") || q.includes("다시 검토");
  const hasHighEventRisk = normalize(hints.event_risk_hint) === "high" || q.includes("리스크");

  if (!sequence.length) sequence = q ? ["regime-agent", "playbook-agent", "validation-agent"] : ["regime-agent"];
  if (wantsPerformance) sequence = ["attribution-agent"];
  if (wantsMemory) sequence = ["memory-agent"];
  if (wantsValidation) sequence = unique(["validation-agent", ...(hasHighEventRisk ? ["reflection-agent"] : [])]);
  if (wantsReflection) sequence = unique(["reflection-agent", "validation-agent"]);

  if (sequence.includes("regime-agent") && sequence.includes("playbook-agent") && !sequence.includes("validation-agent")) {
    sequence.push("validation-agent");
  }

  const previousLoss = hasLossRecord(memoryRecords);
  if (previousLoss && sequence.includes("playbook-agent") && !sequence.includes("reflection-agent")) {
    sequence.splice(sequence.indexOf("validation-agent"), 0, "reflection-agent");
  }
  if (hasHighEventRisk && sequence.includes("playbook-agent") && !sequence.includes("validation-agent")) {
    sequence.push("validation-agent");
  }

  sequence = unique(sequence).filter((id) => getTool(registry, id));
  if (!sequence.length) sequence = ["regime-agent", "playbook-agent", "validation-agent"];

  return { sequence, matched, previousLoss, hasHighEventRisk };
}

function computeConfidence(question, sequence, matched, hints = {}) {
  const q = normalize(question);
  const signalCount = sequence.length + matched.reduce((sum, rule) => sum + rule.hits, 0);
  const clarityBoost = q.split(" ").filter(Boolean).length > 4 ? 0.06 : 0;
  const eventPenalty = normalize(hints.event_risk_hint) === "high" ? -0.08 : 0;
  const score = 0.58 + Math.min(0.30, signalCount * 0.06 + clarityBoost + eventPenalty);
  return Math.max(0.45, Math.min(0.94, Number(score.toFixed(2))));
}

function buildReasoning(sequence, matched, memoryCue, hints = {}) {
  const lines = [];
  const intentText = matched[0]?.summary || "Question is broad, so apply the default planner path.";
  lines.push(intentText);
  if (sequence.includes("regime-agent")) lines.push("Regime Agent anchors the current market state.");
  if (sequence.includes("playbook-agent")) lines.push("Playbook Agent maps regime to candidate strategies.");
  if (sequence.includes("validation-agent")) lines.push("Validation Agent checks tail risk and labeling before final answer.");
  if (sequence.includes("reflection-agent")) lines.push("Reflection Agent adds a recheck because the question is ambiguous or risk is elevated.");
  if (sequence.includes("attribution-agent")) lines.push("Attribution Agent is selected because the request is about performance decomposition.");
  if (sequence.includes("memory-agent")) lines.push("Memory Agent stores or recalls JSON history.");
  if (normalize(hints.event_risk_hint) === "high") lines.push("High event risk increases the weight of validation.");
  if (memoryCue?.note) lines.push(memoryCue.note);
  return lines;
}

function buildRouteInput(question, toolId, context) {
  const base = {
    question,
    memory_cue: context.memoryCue?.note || null,
    current_regime_hint: context.regimeOutput?.currentRegime || null,
    event_risk_hint: context.regimeOutput?.eventRisk || context.hints?.event_risk_hint || null,
    confidence_hint: context.confidence
  };

  if (toolId === "regime-agent") return base;
  if (toolId === "playbook-agent") {
    return {
      ...base,
      regime: context.regimeOutput?.currentRegime || null,
      confidence_score: context.regimeOutput?.confidenceScore ?? context.confidence,
      event_risk: context.regimeOutput?.eventRisk || null,
      market_interpretation: context.regimeOutput?.marketInterpretation || null,
      regime_reason: context.regimeOutput?.regimeReason || null
    };
  }
  if (toolId === "validation-agent") {
    return {
      ...base,
      regime: context.regimeOutput?.currentRegime || null,
      strategy: context.playbookOutput?.topRecommended?.[0] || null,
      event_risk: context.regimeOutput?.eventRisk || null,
      confidence_score: context.regimeOutput?.confidenceScore ?? context.confidence,
      backtest_summary: context.validationInput?.backtest_summary || null,
      memory_cue: context.memoryCue?.note || null
    };
  }
  if (toolId === "reflection-agent") {
    return {
      ...base,
      strategy_recommendation: context.playbookOutput || null,
      validation_result: context.validationOutput || null,
      memory_cue: context.memoryCue?.note || null
    };
  }
  if (toolId === "memory-agent") {
    return {
      regime: context.regimeOutput?.currentRegime || null,
      strategy: context.playbookOutput?.topRecommended?.[0] || null,
      result: context.validationOutput?.label || context.finalLabel || null,
      validation_label: context.validationOutput?.label || context.finalLabel || null,
      confidence_score: context.confidence,
      event_risk: context.regimeOutput?.eventRisk || context.hints?.event_risk_hint || null,
      timestamp: new Date().toISOString()
    };
  }
  if (toolId === "attribution-agent") {
    return {
      question,
      actual_pnl: context.attributionInput?.actual_pnl || null,
      allocation: context.attributionInput?.allocation || null,
      selection: context.attributionInput?.selection || null,
      interaction: context.attributionInput?.interaction || null,
      regime_fit: context.attributionInput?.regime_fit || null,
      market_path: context.attributionInput?.market_path || null
    };
  }
  return base;
}

function buildRegimeCall(question, hints = {}) {
  const highRisk = normalize(hints.event_risk_hint) === "high" || /risk|리스크|위험/i.test(question);
  return {
    currentRegime: highRisk ? "Transition" : "Bull/Calm",
    confidenceScore: highRisk ? 0.74 : 0.82,
    eventRisk: highRisk ? "high" : "medium",
    marketInterpretation: highRisk
      ? "Direction is mixed and event risk is elevated, so caution is needed."
      : "Trend is stable and risk is relatively manageable.",
    regimeReason: highRisk
      ? "The market shows mixed direction, rising volatility, or event sensitivity."
      : "The market shows stable direction and lower near-term turbulence."
  };
}

function buildPlaybookCall(question, regimeOutput) {
  const highRisk = regimeOutput?.eventRisk === "high";
  const strategyScore = highRisk ? 86 : 92;
  return {
    topRecommended: highRisk
      ? ["Iron Condor", "Covered Call", "Calendar Spread"]
      : ["Bull Call Spread", "Call Backspread", "Covered Call"],
    avoidNow: ["Short Straddle", "Short Put", "Reverse Calendar"],
    strategyScore,
    riskLevel: highRisk ? "High" : "Medium",
    expectedReturn: highRisk ? "+9.8%" : "+12.4%",
    playbookMapping: `Strategy intent mapped from "${question}"`,
    selectedReason: highRisk ? "Defensive mapping for elevated risk" : "Directional mapping for stable regime"
  };
}

function buildValidationCall(playbookOutput, regimeOutput, memoryCue) {
  const risky =
    (playbookOutput?.riskLevel || "Medium") !== "Low" ||
    (playbookOutput?.strategyScore || 0) < 95 ||
    regimeOutput?.eventRisk === "high" ||
    Boolean(memoryCue?.shouldCaution);

  return {
    label: risky ? "REVIEW" : "PASS",
    validationScore: risky ? 69 : 84,
    riskWarning: risky
      ? "Risk is elevated. Validate tail risk and event sensitivity again."
      : "Risk is acceptable with current evidence.",
    validationComment: risky
      ? "The plan is usable but needs another review because the risk case is not clean."
      : "The plan passes with no major red flags.",
    evidence: risky
      ? ["Event risk is elevated", "Strategy score is below pass threshold", "Memory suggests caution"]
      : ["Regime and strategy are aligned", "Risk is manageable", "No adverse memory signal"]
  };
}

function buildReflectionCall(playbookOutput, validationOutput, memoryCue) {
  const risky = validationOutput?.label === "REVIEW" || Boolean(memoryCue?.shouldCaution) || (playbookOutput?.strategyScore || 0) < 90;
  return {
    selfReview: risky ? "Risk is high enough to justify a recheck." : "Risk is acceptable after the first pass.",
    shouldRevalidate: risky,
    revisedDirection: risky ? "Keep the plan in REVIEW until the risk points are cleared." : "Proceed with current risk controls.",
    residualRisk: risky ? ["Tail risk", "Event sensitivity", "Memory-triggered caution"] : ["Normal market drift"]
  };
}

function buildAttributionCall() {
  return {
    allocationEffect: 2.4,
    selectionEffect: 3.1,
    interactionEffect: -0.6,
    alphaSource: "selection",
    betaSource: "market timing",
    updateSignal: "reduce_leverage"
  };
}

function buildFallbackPlan(sequence, confidence, memoryCue) {
  const fallback = [];
  if (!sequence.includes("regime-agent")) fallback.push({ if: "regime_agent_missing", then: "Start from Regime Agent with a conservative default regime." });
  if (confidence < 0.7) fallback.push({ if: "low_confidence", then: "Insert Reflection Agent before final answer." });
  if (memoryCue?.shouldCaution) fallback.push({ if: "memory_loss_signal", then: "Force Validation Agent and keep result as REVIEW unless cleared." });
  if (!fallback.length) fallback.push({ if: "agent_failure_or_low_confidence", then: "Fall back to Regime → Playbook → Validation and return REVIEW if uncertain." });
  return fallback;
}

function buildSelectedAgents(sequence, registry) {
  return sequence
    .map((id, index) => {
      const tool = getTool(registry, id);
      return tool ? { ...tool, order: index + 1 } : null;
    })
    .filter(Boolean);
}

function buildExecutionPlan(sequence, registry, question, context) {
  return sequence.map((id) => {
    const tool = getTool(registry, id);
    if (!tool) return null;
    return {
      agent: tool.name,
      input: buildRouteInput(question, id, context),
      purpose: tool.purpose
    };
  }).filter(Boolean);
}

function buildToolCalls(sequence, registry, question, context) {
  const calls = [];
  for (const id of sequence) {
    const tool = getTool(registry, id);
    if (!tool) continue;

    if (id === "regime-agent") {
      context.regimeOutput = buildRegimeCall(question, context.hints);
      calls.push({ ...tool, status: "called", output: context.regimeOutput });
      continue;
    }

    if (id === "playbook-agent") {
      context.playbookOutput = buildPlaybookCall(question, context.regimeOutput);
      context.memoryCue = context.memoryCue || getMostRelevantMemory(context.memoryRecords, context.regimeOutput?.currentRegime, context.playbookOutput?.topRecommended?.[0]) || null;
      calls.push({ ...tool, status: "called", output: context.playbookOutput });
      continue;
    }

    if (id === "reflection-agent") {
      context.reflectionOutput = buildReflectionCall(context.playbookOutput, context.validationOutput, context.memoryCue);
      calls.push({ ...tool, status: "called", output: context.reflectionOutput });
      continue;
    }

    if (id === "validation-agent") {
      context.validationOutput = buildValidationCall(context.playbookOutput, context.regimeOutput, context.memoryCue);
      calls.push({ ...tool, status: "called", output: context.validationOutput });
      if (context.reflectionOutput?.shouldRevalidate && !calls.some((item) => item.id === "validation-agent-recheck")) {
        const recheck = {
          ...tool,
          id: "validation-agent-recheck",
          name: "Validation Agent (Recheck)",
          label: "Module 3",
          status: "called",
          output: buildValidationCall(context.playbookOutput, context.regimeOutput, context.memoryCue)
        };
        recheck.output.validationComment = "This is the re-run after Reflection Agent flagged risk.";
        calls.push(recheck);
      }
      continue;
    }

    if (id === "attribution-agent") {
      context.attributionOutput = buildAttributionCall();
      calls.push({ ...tool, status: "called", output: context.attributionOutput });
      continue;
    }

    if (id === "memory-agent") {
      context.finalLabel = context.validationOutput?.label || "REVIEW";
      calls.push({
        ...tool,
        status: "called",
        output: {
          storedCount: context.memoryRecords.length,
          recent: context.memoryRecords.slice(0, 3),
          nextMemory: {
            regime: context.regimeOutput?.currentRegime || null,
            strategy: context.playbookOutput?.topRecommended?.[0] || null,
            result: context.finalLabel
          }
        }
      });
      continue;
    }

    calls.push({ ...tool, status: "called", output: { message: "No handler available" } });
  }
  return calls;
}

function buildFinalAnswer(intent, regimeOutput, playbookOutput, validationOutput, reflectionOutput, attributionOutput) {
  if (intent === "Attribution") {
    return `Attribution review: Allocation ${attributionOutput?.allocationEffect ?? "-"}, Selection ${attributionOutput?.selectionEffect ?? "-"}, Interaction ${attributionOutput?.interactionEffect ?? "-"}. Update signal: ${attributionOutput?.updateSignal || "check"}.`;
  }

  const regime = regimeOutput?.currentRegime || "Unknown";
  const strategy = playbookOutput?.topRecommended?.[0] || "No clear strategy";
  const label = validationOutput?.label || "REVIEW";
  const risk = validationOutput?.riskWarning || "Risk needs review";
  const reflection = reflectionOutput?.revisedDirection || "Proceed with caution.";

  if (label === "PASS") {
    return `Current regime is ${regime}. Recommended strategy is ${strategy}. Validation is PASS, so this can proceed with current controls.`;
  }

  return `Current regime is ${regime}. Recommended strategy is ${strategy}. Validation is ${label}, so keep it as a review case. ${risk} ${reflection}`;
}

function buildSummary(intent, sequence, confidence, registry, memoryCue) {
  const labels = sequence.map((id) => getTool(registry, id)?.name).filter(Boolean);
  const chain = labels.length ? labels.join(" → ") : "Regime Agent";
  const memoryNote = memoryCue?.note ? ` Memory: ${memoryCue.note}` : "";
  return `${intent} request routed through ${chain}. Planner confidence is ${(confidence * 100).toFixed(0)}%.${memoryNote}`;
}

export function planQuestion(question, registry = DEFAULT_TOOL_REGISTRY, memoryRecords = [], hints = {}) {
  const input = String(question || "").trim();
  const { sequence, matched, previousLoss, hasHighEventRisk } = selectRoute(input, registry, memoryRecords, hints);
  const confidence = computeConfidence(input, sequence, matched, hints);
  const intent = inferIntent(input, matched, sequence);

  const regimeHint = sequence.includes("regime-agent") ? buildRegimeCall(input, hints) : null;
  const memoryCue = previousLoss
    ? {
        match: getMostRelevantMemory(memoryRecords, regimeHint?.currentRegime, null) || [...memoryRecords].reverse().find((record) => ["loss", "reject", "fail"].includes(normalize(record.result))) || null,
        shouldCaution: true,
        note: "Previous memory contains a loss/reject/fail signal, so the planner should behave more conservatively."
      }
    : null;

  const context = {
    memoryRecords,
    memoryCue,
    hints: {
      ...hints,
      event_risk_hint: hints.event_risk_hint || (hasHighEventRisk ? "high" : null)
    },
    confidence,
    regimeOutput: null,
    playbookOutput: null,
    validationOutput: null,
    reflectionOutput: null,
    attributionOutput: null,
    finalLabel: null
  };

  const selectedAgents = buildSelectedAgents(sequence, registry);
  const executionPlan = buildExecutionPlan(sequence, registry, input, context);
  const toolCalls = buildToolCalls(sequence, registry, input, context);

  const validationOutput = context.validationOutput || toolCalls.find((item) => String(item.id).includes("validation-agent"))?.output || null;
  const reflectionOutput = context.reflectionOutput || toolCalls.find((item) => item.id === "reflection-agent")?.output || null;
  const playbookOutput = context.playbookOutput || toolCalls.find((item) => item.id === "playbook-agent")?.output || null;
  const regimeOutput = context.regimeOutput || toolCalls.find((item) => item.id === "regime-agent")?.output || null;
  const attributionOutput = context.attributionOutput || toolCalls.find((item) => item.id === "attribution-agent")?.output || null;
  const finalLabel = validationOutput?.label || context.finalLabel || "REVIEW";

  const plannerJson = {
    intent,
    confidence,
    selected_agents: selectedAgents.map((tool) => tool.name),
    reason: buildReasoning(sequence, matched, memoryCue, hints),
    execution_plan: executionPlan,
    fallback_plan: buildFallbackPlan(sequence, confidence, memoryCue)
  };

  const battlePlan = [
    { title: "Planner route", text: sequence.map((id) => id.replace(/-agent$/, "").replace(/-/g, " ")).join(" → ") },
    { title: "Commander action", text: intent === "Attribution" ? "Summarize performance decomposition and update signal." : "Route regime → strategy → validation and keep reasoning explicit." },
    { title: "Risk posture", text: finalLabel === "PASS" ? "Validation passes, so current controls are acceptable." : "Validation keeps the case under review." }
  ];

  const reasoning = buildReasoning(sequence, matched, memoryCue, hints);

  return {
    ...plannerJson,
    question: input,
    selectedTools: selectedAgents,
    selectedToolIds: sequence,
    toolCalls,
    reasoning,
    regime: regimeOutput,
    playbook: playbookOutput,
    validation: validationOutput,
    reflection: reflectionOutput,
    attribution: attributionOutput,
    memoryCue,
    battlePlan,
    summary: buildSummary(intent, sequence, confidence, registry, memoryCue),
    finalAnswer: buildFinalAnswer(intent, regimeOutput, playbookOutput, validationOutput, reflectionOutput, attributionOutput),
    updatedAt: new Date().toISOString()
  };
}

export async function loadToolRegistry() {
  try {
    const response = await fetch("./tool-registry.json", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      if (data?.tools?.length) return data;
    }
  } catch {
    // Fallback for local file:// usage.
  }
  return JSON.parse(JSON.stringify(DEFAULT_TOOL_REGISTRY));
}
