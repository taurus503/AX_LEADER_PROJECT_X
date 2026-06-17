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
      triggers: ["regime", "market", "volatility", "direction", "event risk", "now", "today"],
      outputs: ["Current Regime", "Confidence Score", "Event Risk", "Market Interpretation", "Regime Reason"]
    },
    {
      id: "playbook-agent",
      name: "Playbook Agent",
      agentId: "option-playbook",
      label: "Module 2",
      purpose: "Recommend option playbooks by regime",
      triggers: ["strategy", "playbook", "option", "recommend", "hedge", "trade"],
      outputs: ["Top Recommended 9", "Avoid Now 6", "Strategy Score", "Risk Level", "Expected Return", "Playbook Mapping"]
    },
    {
      id: "reflection-agent",
      name: "Reflection Agent",
      agentId: "reflection",
      label: "Module 2.5",
      purpose: "Self-review the strategy result before final answer",
      triggers: ["reflection", "self review", "review again", "risk high", "recheck", "self-check", "검토", "반성"],
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
    },
    {
      id: "validation-agent",
      name: "Validation Agent",
      agentId: "validation",
      label: "Module 3",
      purpose: "Red-team the candidate and label PASS/REVIEW/REJECT",
      triggers: ["validation", "review", "reject", "pass", "backtest", "risk", "tail"],
      outputs: ["PASS", "REVIEW", "REJECT", "Validation Score", "Risk Warning"]
    },
    {
      id: "attribution-agent",
      name: "Attribution Agent",
      agentId: "attribution",
      label: "Module 4",
      purpose: "Decompose performance into allocation / selection / interaction",
      triggers: ["performance", "attribution", "allocation", "selection", "interaction", "alpha", "beta", "pnl"],
      outputs: ["Allocation Effect", "Selection Effect", "Interaction Effect", "Alpha Source", "Beta Source", "Update Signal"]
    }
  ],
  prompts: [
    "지금 추천 전략은?",
    "추천 결과를 다시 검토해줘",
    "이 전략을 검증까지 해줘",
    "성과가 왜 그렇게 나왔는지 분해해줘"
  ]
};

const ROUTE_RULES = [
  {
    intent: "Strategy",
    keywords: ["추천 전략", "추천전략", "전략", "playbook", "옵션", "포지션", "trade"],
    sequence: ["regime-agent", "playbook-agent", "reflection-agent"],
    summary: "This is a strategy request. Route through regime, playbook, reflection, and validation."
  },
  {
    intent: "Market Regime",
    keywords: ["국면", "레짐", "변동성", "시장", "방향", "now", "지금"],
    sequence: ["regime-agent", "playbook-agent"],
    summary: "This question wants regime interpretation first."
  },
  {
    intent: "Reflection",
    keywords: ["reflection", "self review", "recheck", "다시 검토", "검토", "risk high"],
    sequence: ["reflection-agent", "validation-agent"],
    summary: "This request is asking for a self-review loop."
  },
  {
    intent: "Validation",
    keywords: ["validation", "review", "reject", "pass", "backtest", "리스크"],
    sequence: ["validation-agent"],
    summary: "This request focuses on validation and risk labeling."
  },
  {
    intent: "Attribution",
    keywords: ["성과", "분해", "attribution", "allocation", "selection", "interaction", "alpha", "beta", "pnl"],
    sequence: ["attribution-agent"],
    summary: "This request focuses on performance decomposition."
  },
  {
    intent: "Memory",
    keywords: ["memory", "remember", "저장", "기억", "store", "history"],
    sequence: ["memory-agent"],
    summary: "This request is about storing or recalling JSON memory."
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

function getMemoryCue(memoryRecords, regime, strategy) {
  const normalizedRegime = normalize(regime);
  const normalizedStrategy = normalize(strategy);
  const match = [...memoryRecords]
    .reverse()
    .find((record) => {
      const sameRegime = normalizedRegime && normalize(record.regime) === normalizedRegime;
      const sameStrategy = normalizedStrategy && normalize(record.strategy) === normalizedStrategy;
      return sameRegime || sameStrategy;
    });

  if (!match) return null;

  const result = normalize(match.result);
  const loss = ["loss", "reject", "fail"].includes(result);

  if (!loss) {
    return {
      match,
      shouldCaution: false,
      note: `Previous memory shows ${match.regime || "unknown regime"} / ${match.strategy || "unknown strategy"} ended in ${match.result || "unknown"}.`
    };
  }

  return {
    match,
    shouldCaution: true,
    note: `Previous memory shows ${match.regime || "unknown regime"} / ${match.strategy || "unknown strategy"} ended in ${match.result || "unknown"}.`
  };
}

function getGenericMemoryCue(memoryRecords) {
  const lastLoss = [...memoryRecords].reverse().find((record) => ["loss", "reject", "fail"].includes(normalize(record.result)));
  if (!lastLoss) return null;

  return {
    match: lastLoss,
    shouldCaution: true,
    note: `Earlier memory shows ${lastLoss.regime || "unknown regime"} / ${lastLoss.strategy || "unknown strategy"} ended in ${lastLoss.result || "loss"}.`
  };
}

function selectRoute(question, registry) {
  const q = normalize(question);
  const matched = ROUTE_RULES
    .map((rule) => ({ ...rule, hits: scoreKeywords(q, rule.keywords) }))
    .filter((rule) => rule.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  const wantsPerformance = q.includes("성과") || q.includes("분해") || q.includes("attribution");
  const wantsReflection = q.includes("reflection") || q.includes("self review") || q.includes("검토") || q.includes("recheck");
  const wantsMemory = q.includes("memory") || q.includes("remember") || q.includes("저장") || q.includes("기억");

  let sequence = matched.flatMap((rule) => rule.sequence);
  if (!sequence.length) sequence = q ? ["regime-agent", "playbook-agent"] : ["regime-agent"];
  if (wantsPerformance) sequence = ["regime-agent", "playbook-agent", "reflection-agent", "validation-agent", "attribution-agent"];
  if (wantsReflection) sequence = unique(["regime-agent", "playbook-agent", "reflection-agent", "validation-agent"]);
  if (wantsMemory) sequence = ["memory-agent"];

  sequence = unique(sequence).filter((id) => getTool(registry, id));
  if (!sequence.length) sequence = ["regime-agent", "playbook-agent"];

  return { sequence, matched };
}

function computeConfidence(question, sequence, matched) {
  const q = normalize(question);
  const signalCount = sequence.length + matched.reduce((sum, rule) => sum + rule.hits, 0);
  const clarityBoost = q.split(" ").filter(Boolean).length > 3 ? 0.05 : 0;
  const score = 0.58 + Math.min(0.32, signalCount * 0.06 + clarityBoost);
  return Math.max(0.55, Math.min(0.94, Number(score.toFixed(2))));
}

function buildReasoning(sequence, matched, memoryCue) {
  const lines = [];
  const intentText = matched[0]?.summary || "The question is broad, so we apply the default planner path.";
  lines.push(intentText);
  if (sequence.includes("regime-agent")) lines.push("We start with Regime Agent to anchor the market state.");
  if (sequence.includes("playbook-agent")) lines.push("We then call Playbook Agent to get strategy candidates.");
  if (sequence.includes("reflection-agent")) lines.push("Reflection Agent self-checks the strategy result before finalizing.");
  if (sequence.includes("memory-agent")) lines.push("Memory Agent stores or recalls the JSON record.");
  if (sequence.includes("validation-agent")) lines.push("Validation Agent is used to re-check risk and label the plan.");
  if (sequence.includes("attribution-agent")) lines.push("Attribution Agent decomposes the outcome into component effects.");
  if (memoryCue?.note) lines.push(memoryCue.note);
  return lines;
}

function buildRegimeCall() {
  return {
    currentRegime: "Transition",
    confidenceScore: 0.74,
    eventRisk: "high",
    marketInterpretation: "Direction is mixed and volatility is changing, so a cautious read is needed.",
    regimeReason: "Recent market behavior is dominated by shifting volatility rather than clean trend."
  };
}

function buildPlaybookCall(question) {
  const riskLevel = /high|risk|volatile/i.test(question) ? "High" : "Medium";
  const strategyScore = riskLevel === "High" ? 86 : 92;
  return {
    topRecommended: riskLevel === "High"
      ? ["Iron Condor", "Covered Call", "Calendar Spread"]
      : ["Bull Call Spread", "Call Backspread", "Covered Call"],
    avoidNow: ["Short Straddle", "Short Put", "Reverse Calendar"],
    strategyScore,
    riskLevel,
    expectedReturn: riskLevel === "High" ? "+9.8%" : "+12.4%",
    playbookMapping: `Strategy intent mapped from "${question}"`
  };
}

function buildReflectionCall(question, playbookOutput, memoryCue) {
  const risky =
    (playbookOutput?.riskLevel || "Medium") !== "Low" ||
    (playbookOutput?.strategyScore || 0) < 95 ||
    /risk|위험|리스크/i.test(question) ||
    Boolean(memoryCue?.shouldCaution);

  return {
    selfReview: risky ? "Risk is high. Recheck with Validation Agent." : "Risk is acceptable. Finalize with light validation.",
    shouldRevalidate: risky,
    reflectionNote: risky
      ? `The strategy has edge, but tail risk and event sensitivity need one more pass.${memoryCue?.note ? ` Memory cue: ${memoryCue.note}` : ""}`
      : "The strategy looks balanced enough to move forward."
  };
}

function buildValidationCall(stage, reflectionOutput, memoryCue) {
  const label = reflectionOutput?.shouldRevalidate ? "REVIEW" : "PASS";
  return {
    label,
    validationScore: reflectionOutput?.shouldRevalidate ? 69 : 82,
    riskWarning: reflectionOutput?.shouldRevalidate
      ? `Risk is elevated. Validate tail risk and event sensitivity again.${memoryCue?.shouldCaution ? " Memory suggests a prior loss." : ""}`
      : "Risk is acceptable with current evidence.",
    validationComment: stage === "recheck"
      ? "This is the re-run after Reflection Agent flagged risk."
      : "Initial validation pass for the candidate strategy."
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

function buildMemoryCall(memoryRecords) {
  return {
    storedCount: memoryRecords.length,
    recent: memoryRecords.slice(0, 3)
  };
}

function invokeTool(tool, question, context) {
  const base = {
    id: tool.id,
    name: tool.name,
    label: tool.label,
    status: "called",
    purpose: tool.purpose
  };

  if (tool.id === "regime-agent") return { ...base, output: buildRegimeCall() };
  if (tool.id === "playbook-agent") return { ...base, output: buildPlaybookCall(question) };
  if (tool.id === "reflection-agent") {
    const playbookCall = context.calls.find((call) => call.id === "playbook-agent");
    const output = buildReflectionCall(question, playbookCall?.output, context.memoryCue);
    return { ...base, output };
  }
  if (tool.id === "memory-agent") return { ...base, output: buildMemoryCall(context.memoryRecords || []) };
  if (tool.id === "validation-agent") {
    const reflectionCall = context.calls.find((call) => call.id === "reflection-agent");
    const stage = context.stage || "initial";
    return { ...base, output: buildValidationCall(stage, reflectionCall?.output, context.memoryCue) };
  }
  if (tool.id === "attribution-agent") return { ...base, output: buildAttributionCall() };
  return { ...base, output: { message: "No handler available" } };
}

function buildSummary(intent, sequence, confidence, registry, revisionNote = "", memoryCue = null) {
  const labels = sequence.map((id) => getTool(registry, id)?.name).filter(Boolean);
  const chain = labels.length ? labels.join(" → ") : "Regime Agent";
  const base = `${intent} request routed through ${chain}. Planner confidence is ${(confidence * 100).toFixed(0)}%.`;
  const memoryNote = memoryCue?.note ? ` Memory: ${memoryCue.note}` : "";
  return `${base}${revisionNote ? ` ${revisionNote}` : ""}${memoryNote}`;
}

function buildBattlePlan(sequence, intent) {
  return [
    { title: "Planner route", text: sequence.map((id) => id.replace(/-agent$/, "").replace(/-/g, " ")).join(" → ") },
    { title: "Commander action", text: intent === "Attribution" ? "Summarize performance decomposition and update signal." : "Route market view → strategy → reflection → validation." },
    { title: "Risk posture", text: sequence.includes("validation-agent") ? "Validation is included, so risk commentary is explicit." : "Light routing is enough for this question." }
  ];
}

export function planQuestion(question, registry = DEFAULT_TOOL_REGISTRY, memoryRecords = []) {
  const input = String(question || "").trim();
  const { sequence, matched } = selectRoute(input, registry);
  const confidence = computeConfidence(input, sequence, matched);
  const intent = matched[0]?.intent || (sequence.includes("attribution-agent") ? "Attribution" : sequence.includes("validation-agent") ? "Validation" : "Strategy");

  const selectedTools = sequence
    .map((id, index) => {
      const tool = getTool(registry, id);
      return tool ? { ...tool, order: index + 1 } : null;
    })
    .filter(Boolean);

  const calls = [];
  const routeContext = { intent, confidence, sequence, calls, memoryRecords, memoryCue: null };

  for (const tool of selectedTools) {
    const call = invokeTool(tool, input, routeContext);
    calls.push(call);

    if (tool.id === "playbook-agent") {
      const regimeCall = calls.find((item) => item.id === "regime-agent");
      const topStrategy = call.output?.topRecommended?.[0] || "";
      routeContext.memoryCue = getMemoryCue(memoryRecords, regimeCall?.output?.currentRegime, topStrategy) || getGenericMemoryCue(memoryRecords);
    }
  }

  const reflectionCall = calls.find((call) => call.id === "reflection-agent");
  const memoryCue = routeContext.memoryCue;
  const needsValidationRecheck = Boolean(reflectionCall?.output?.shouldRevalidate);

  if (needsValidationRecheck) {
    const validationTool = getTool(registry, "validation-agent");
    if (validationTool) {
      calls.push({
        ...invokeTool(validationTool, input, { ...routeContext, stage: "recheck" }),
        id: "validation-agent-recheck",
        name: "Validation Agent (Recheck)",
        label: "Module 3"
      });
    }
  }

  const validationCall = [...calls].reverse().find((call) => String(call.id).includes("validation-agent"));
  const revisionNote = needsValidationRecheck
    ? "Reflection Agent flagged risk and triggered a second validation pass."
    : "Reflection Agent accepted the strategy with no extra validation pass.";

  return {
    question: input,
    intent,
    confidence,
    selectedTools,
    selectedToolIds: sequence,
    reasoning: buildReasoning(sequence, matched, memoryCue),
    toolCalls: calls,
    reflection: reflectionCall?.output || null,
    validation: validationCall?.output || null,
    memoryCue,
    battlePlan: buildBattlePlan(sequence, intent),
    summary: buildSummary(intent, sequence, confidence, registry, revisionNote, memoryCue),
    finalAnswer: needsValidationRecheck
      ? "Revised answer: the strategy should be treated as REVIEW until the rechecked validation clears the risk."
      : "Revised answer: the strategy can move forward with current risk controls.",
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
