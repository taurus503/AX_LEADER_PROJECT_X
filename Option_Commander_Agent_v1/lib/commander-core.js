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
      triggers: ["regime", "market", "volatility", "direction", "event risk", "current", "today", "now"],
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
    },
    {
      id: "reflection-agent",
      name: "Reflection Agent",
      agentId: "reflection",
      label: "Reflection",
      purpose: "Self-review strategy result and trigger recheck when needed",
      triggers: ["reflection", "self review", "review again", "risk high", "recheck", "self-check"],
      outputs: ["Risk Review", "Validation Trigger", "Revised Answer", "Residual Risk"]
    },
    {
      id: "memory-agent",
      name: "Memory Agent",
      agentId: "memory",
      label: "Memory",
      purpose: "Persist regime / strategy / result JSON",
      triggers: ["memory", "remember", "save", "history", "store"],
      outputs: ["regime", "strategy", "result", "timestamp"]
    }
  ],
\ \ prompts:\ \[\n\ \ \ \ "지금\ 추천\ 전략",\n\ \ \ \ "현재\ 시장\ 국면",\n\ \ \ \ "검증\ 결과를\ 다시\ 확인",\n\ \ \ \ "성과가\ 왜\ 이렇게\ 나왔는지",\n\ \ \ \ "다시\ 검토해줘"\n\ \ ]\n};

export const MEMORY_STORAGE_KEY = "option-commander-memory-v1";

export function normalize(text = "") {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function unique(list) {
  return [...new Set(list)];
}

export function extractDateHint(value = "") {
  const text = String(value || "");

  const iso = text.match(/(20\d{2}-\d{2}-\d{2})/);
  if (iso) return iso[1];

  const dotted = text.match(/(20\d{2})[./](\d{1,2})[./](\d{1,2})/);
  if (dotted) {
    const [, year, month, day] = dotted;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const korean = text.match(/(20\d{2})\s*??s*(\d{1,2})\s*??s*(\d{1,2})\s*??);
  if (korean) {
    const [, year, month, day] = korean;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return "";
}

export function getTool(registry, id) {
  return registry.tools.find((tool) => tool.id === id) || null;
}

export function hasLossRecord(memoryRecords = []) {
  return [...memoryRecords].reverse().some((record) => ["loss", "reject", "fail"].includes(normalize(record.result)));
}

export function getMostRelevantMemory(memoryRecords = [], regime, strategy) {
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

export function scoreKeywords(question, keywords) {
  const q = normalize(question);
  return keywords.reduce((sum, keyword) => (q.includes(normalize(keyword)) ? sum + 1 : sum), 0);
}

export function buildPlannerDecision(question, registry = DEFAULT_TOOL_REGISTRY, memoryRecords = [], hints = {}) {
  const input = String(question || "").trim();
  const q = normalize(input);
  const dateHint = extractDateHint(hints.as_of_date || hints.date_hint || input);
  const historicalMode = Boolean(dateHint);

\ \ const\ routeRules\ =\ \[\n\ \ \ \ \{\n\ \ \ \ \ \ intent:\ "Strategy",\n\ \ \ \ \ \ keywords:\ \["strategy",\ "playbook",\ "option",\ "trade",\ "recommend",\ "hedge",\ "suggest",\ "전략",\ "추천"],\n\ \ \ \ \ \ sequence:\ \["regime-agent",\ "playbook-agent",\ "validation-agent"],\n\ \ \ \ \ \ summary:\ "Strategy\ request:\ route\ through\ regime,\ playbook,\ then\ validation\."\n\ \ \ \ },\n\ \ \ \ \{\n\ \ \ \ \ \ intent:\ "Validation",\n\ \ \ \ \ \ keywords:\ \["validation",\ "review",\ "reject",\ "pass",\ "backtest",\ "risk",\ "tail",\ "검증",\ "재검토"],\n\ \ \ \ \ \ sequence:\ \["validation-agent"],\n\ \ \ \ \ \ summary:\ "Validation\ request:\ focus\ on\ risk\ labeling\ and\ evidence\."\n\ \ \ \ },\n\ \ \ \ \{\n\ \ \ \ \ \ intent:\ "Attribution",\n\ \ \ \ \ \ keywords:\ \["performance",\ "attribution",\ "allocation",\ "selection",\ "interaction",\ "alpha",\ "beta",\ "pnl",\ "성과",\ "분해"],\n\ \ \ \ \ \ sequence:\ \["attribution-agent"],\n\ \ \ \ \ \ summary:\ "Attribution\ request:\ decompose\ performance\ and\ generate\ update\ signal\."\n\ \ \ \ },\n\ \ \ \ \{\n\ \ \ \ \ \ intent:\ "Reflection",\n\ \ \ \ \ \ keywords:\ \["reflection",\ "self\ review",\ "recheck",\ "재검토",\ "검토",\ "다시"],\n\ \ \ \ \ \ sequence:\ \["reflection-agent",\ "validation-agent"],\n\ \ \ \ \ \ summary:\ "Reflection\ request:\ self-review\ first,\ then\ recheck\ risk\."\n\ \ \ \ },\n\ \ \ \ \{\n\ \ \ \ \ \ intent:\ "Memory",\n\ \ \ \ \ \ keywords:\ \["memory",\ "remember",\ "save",\ "history",\ "store",\ "메모리",\ "기억"],\n\ \ \ \ \ \ sequence:\ \["memory-agent"],\n\ \ \ \ \ \ summary:\ "Memory\ request:\ store\ or\ recall\ JSON\ memory\."\n\ \ \ \ },\n\ \ \ \ \{\n\ \ \ \ \ \ intent:\ "Market\ Regime",\n\ \ \ \ \ \ keywords:\ \["regime",\ "market",\ "volatility",\ "direction",\ "current",\ "today",\ "now",\ "국면",\ "시장"],\n\ \ \ \ \ \ sequence:\ \["regime-agent",\ "playbook-agent"],\n\ \ \ \ \ \ summary:\ "Regime\ request:\ interpret\ the\ market\ first\."\n\ \ \ \ }\n\ \ ];\n\n\ \ const\ matched\ =\ routeRules
    .map((rule) => ({ ...rule, hits: scoreKeywords(q, rule.keywords) }))
    .filter((rule) => rule.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  let sequence = matched.flatMap((rule) => rule.sequence);
  const wantsPerformance = q.includes("?깃낵") || q.includes("attribution");
  const wantsValidation = q.includes("寃利?) || q.includes("review") || q.includes("reject") || q.includes("pass");
  const wantsMemory = q.includes("memory") || q.includes("remember") || q.includes("???) || q.includes("history");
  const wantsReflection = q.includes("reflection") || q.includes("?ъ젏寃") || q.includes("recheck") || q.includes("寃??);
  const hasHighEventRisk = normalize(hints.event_risk_hint) === "high" || q.includes("由ъ뒪??);

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

  if (sequence.length && !sequence.includes("reflection-agent") && !sequence.includes("memory-agent")) {
    sequence.push("reflection-agent", "memory-agent");
  } else if (sequence.includes("reflection-agent") && !sequence.includes("memory-agent")) {
    sequence.push("memory-agent");
  }

  sequence = unique(sequence).filter((id) => getTool(registry, id));
  if (!sequence.length) sequence = ["regime-agent", "playbook-agent", "validation-agent"];

  const confidence = computeConfidence(input, sequence, matched, hints);
  const intent = inferIntent(input, matched, sequence);
  const memoryCue = previousLoss
    ? {
        match: [...memoryRecords].reverse().find((record) => ["loss", "reject", "fail"].includes(normalize(record.result))) || null,
        shouldCaution: true,
        note: "Previous memory contains a loss/reject/fail signal, so the planner should behave more conservatively."
      }
    : null;

  const selectedTools = sequence
    .map((id, index) => {
      const tool = getTool(registry, id);
      return tool ? { ...tool, order: index + 1 } : null;
    })
    .filter(Boolean);

  const executionPlan = sequence
    .map((id) => {
      const tool = getTool(registry, id);
      if (!tool) return null;
      return {
        agent: tool.name,
        input: buildRouteInput(input, id, { memoryCue, hints, confidence, sequence, registry, memoryRecords }),
        purpose: tool.purpose
      };
    })
    .filter(Boolean);

  return {
    question: input,
    intent,
    confidence,
    date_hint: dateHint,
    historical_mode: historicalMode,
    selected_agents: selectedTools.map((tool) => tool.name),
    selectedTools,
    selectedToolIds: sequence,
    reason: buildReasoning(sequence, matched, memoryCue, hints),
    execution_plan: executionPlan,
    fallback_plan: buildFallbackPlan(sequence, confidence, memoryCue),
    memoryCue,
    hasHighEventRisk
  };
}

function inferIntent(question, matched, sequence) {
  if (matched[0]?.intent) return matched[0].intent;
  if (sequence.includes("attribution-agent")) return "Attribution";
  if (sequence.includes("validation-agent")) return "Validation";
  if (sequence.includes("memory-agent")) return "Memory";
  if (sequence.includes("reflection-agent")) return "Reflection";
  return question ? "Strategy" : "Unknown";
}

function computeConfidence(question, sequence, matched, hints = {}) {
  const q = normalize(question);
  const signalCount = sequence.length + matched.reduce((sum, rule) => sum + rule.hits, 0);
  const clarityBoost = q.split(" ").filter(Boolean).length > 4 ? 0.06 : 0;
  const eventPenalty = normalize(hints.event_risk_hint) === "high" ? -0.08 : 0;
  const score = 0.58 + Math.min(0.3, signalCount * 0.06 + clarityBoost + eventPenalty);
  return Math.max(0.45, Math.min(0.94, Number(score.toFixed(2))));
}

function buildReasoning(sequence, matched, memoryCue, hints = {}) {
  const lines = [];
  const intentText = matched[0]?.summary || "Question is broad, so apply the default planner path.";
  lines.push(intentText);
  const dateHint = extractDateHint(hints.as_of_date || hints.date_hint);
  if (dateHint) {
    lines.push(`Historical mode is enabled for the requested reference date ${dateHint}.`);
  }
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
  const dateHint = extractDateHint(context.hints?.as_of_date || context.hints?.date_hint || question);
  const base = {
    question,
    memory_cue: context.memoryCue?.note || null,
    current_regime_hint: context.hints?.current_regime_hint || null,
    event_risk_hint: context.hints?.event_risk_hint || null,
    confidence_hint: context.confidence,
    date_hint: dateHint || null,
    as_of_date: dateHint || null,
    historical_mode: Boolean(dateHint)
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
      date_hint: dateHint || null,
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

function buildFallbackPlan(sequence, confidence, memoryCue) {
  const fallback = [];
  if (!sequence.includes("regime-agent")) fallback.push({ if: "regime_agent_missing", then: "Start from Regime Agent with a conservative default regime." });
  if (confidence < 0.7) fallback.push({ if: "low_confidence", then: "Insert Reflection Agent before final answer." });
  if (memoryCue?.shouldCaution) fallback.push({ if: "memory_loss_signal", then: "Force Validation Agent and keep result as REVIEW unless cleared." });
  if (!fallback.length) fallback.push({ if: "agent_failure_or_low_confidence", then: "Fall back to Regime -> Playbook -> Validation and return REVIEW if uncertain." });
  return fallback;
}

export function buildMockAgentOutputs(question, planner, memoryRecords = []) {
  const regime = buildRegimeOutput(question, planner);
  const playbook = buildPlaybookOutput(question, regime, planner);
  const validation = buildValidationOutput(playbook, regime, planner.memoryCue);
  const reflection = buildReflectionOutput(playbook, validation, planner.memoryCue);
  const attribution = buildAttributionOutput();
  const memory_record = buildMemoryRecord(regime, playbook, validation);
  return { regime, playbook, validation, reflection, attribution, memory_record };
}

export function buildRegimeOutput(question, planner = {}) {
  const dateHint = planner.date_hint || extractDateHint(question);
  const highRisk = Boolean(planner.hasHighEventRisk) || Boolean(planner.memoryCue?.shouldCaution) || /risk|由ъ뒪??warning/i.test(question);

  return {
    currentRegime: highRisk ? "Transition" : "Bull/Calm",
    confidenceScore: highRisk ? 0.74 : 0.82,
    eventRisk: highRisk ? "high" : "medium",
    asOfDate: dateHint,
    marketInterpretation: highRisk
      ? "Direction is mixed and event risk is elevated, so caution is needed."
      : "Trend is stable and risk is relatively manageable.",
    regimeReason: highRisk
      ? "The market shows mixed direction, rising volatility, or event sensitivity."
      : "The market shows stable direction and lower near-term turbulence."
  };
}

export function buildPlaybookOutput(question, regimeOutput = {}, planner = {}) {
  const highRisk = regimeOutput?.eventRisk === "high";
  return {
    topRecommended: highRisk
      ? ["Iron Condor", "Covered Call", "Calendar Spread"]
      : ["Bull Call Spread", "Call Backspread", "Covered Call"],
    avoidNow: ["Short Straddle", "Short Put", "Reverse Calendar"],
    strategyScore: highRisk ? 86 : 92,
    riskLevel: highRisk ? "High" : "Medium",
    expectedReturn: highRisk ? "+9.8%" : "+12.4%",
    asOfDate: regimeOutput?.asOfDate || planner.date_hint || extractDateHint(question),
    playbookMapping: `Strategy intent mapped from "${question}"`
  };
}

export function buildValidationOutput(playbookOutput = {}, regimeOutput = {}, memoryCue = null) {
  const risky =
    (playbookOutput?.riskLevel || "Medium") !== "Low" ||
    (playbookOutput?.strategyScore || 0) < 95 ||
    regimeOutput?.eventRisk === "high" ||
    Boolean(memoryCue?.shouldCaution);

  return {
    label: risky ? "REVIEW" : "PASS",
    validationScore: risky ? 69 : 84,
    asOfDate: regimeOutput?.asOfDate || playbookOutput?.asOfDate || "",
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

export function buildReflectionOutput(playbookOutput = {}, validationOutput = {}, memoryCue = null) {
  const risky = validationOutput?.label === "REVIEW" || Boolean(memoryCue?.shouldCaution) || (playbookOutput?.strategyScore || 0) < 90;
  return {
    selfReview: risky ? "Risk is high enough to justify a recheck." : "Risk is acceptable after the first pass.",
    shouldRevalidate: risky,
    asOfDate: validationOutput?.asOfDate || playbookOutput?.asOfDate || "",
    revisedDirection: risky ? "Keep the plan in REVIEW until the risk points are cleared." : "Proceed with current risk controls.",
    residualRisk: risky ? ["Tail risk", "Event sensitivity", "Memory-triggered caution"] : ["Normal market drift"]
  };
}

export function buildAttributionOutput() {
  return {
    allocationEffect: 2.4,
    selectionEffect: 3.1,
    interactionEffect: -0.6,
    alphaSource: "selection",
    betaSource: "market timing",
    updateSignal: "reduce_leverage"
  };
}

export function buildMemoryRecord(regimeOutput = {}, playbookOutput = {}, validationOutput = {}) {
  return {
    regime: regimeOutput.currentRegime || "",
    strategy: playbookOutput.topRecommended?.[0] || "",
    result: validationOutput.label || "REVIEW",
    validation_label: validationOutput.label || "REVIEW",
    timestamp: new Date().toISOString()
  };
}

function buildStructuredFinalAnswer({ regime, strategy, validationLabel, risk, memoryUsed, dateHint, nextAction, memoryNote, attribution, historicalMode }) {
  const dateLead = dateHint
    ? `- 湲곗???${dateHint} 湲곗???寃??寃곌낵?낅땲?? ?꾩옱 ?쒖젏怨??ㅻ? ???덉쑝??李멸퀬?⑹쑝濡?蹂댁븘???⑸땲??`
    : "- ?꾩옱 湲곗???寃??寃곌낵?낅땲??";

  const lines = [
    "1. 寃곕줎",
    `- ?꾩옱 ?쒖옣 援?㈃? **${regime}**?대ŉ, 異붿쿇 ?꾨왂 寃????곸? **${strategy}**?낅땲??`,
    `- 寃利?寃곌낵??**${validationLabel}**?낅땲??`,
    "2. 洹쇨굅",
    dateLead,
    `- ?듭떖 由ъ뒪?? ${risk}.`,
    `- Memory 李멸퀬 ?щ?: ${memoryUsed ? "?덉쓬" : "?놁쓬"}. ${memoryNote}`
  ];

  if (historicalMode) {
    lines.push("- 怨쇨굅 湲곗??쇱씠 ?낅젰?섏뼱, ?꾩옱媛 ?꾨땶 ?대떦 ?쒖젏??寃??愿?먯쑝濡??댁꽍?덉뒿?덈떎.");
  }

  if (attribution) {
    lines.push(`- ?깃낵 ?댁꽍? Allocation ${attribution.allocationEffect}, Selection ${attribution.selectionEffect}, Interaction ${attribution.interactionEffect}瑜??④퍡 遊먯빞 ?⑸땲??`);
  }

  lines.push(
    "3. ?ㅼ쓬 ?덈궡",
    `- ${nextAction}`,
    "- ?ъ옄?먮떒????좏븯吏 ?딄퀬 寃???꾨낫濡쒕쭔 蹂댁븘???⑸땲??"
  );

  return lines.join("\n");
}

export function buildFinalAnswer(question, planner, agentResults, memoryRecords = [], llmText = "") {
  const regime = agentResults.regime?.currentRegime || "Unknown";
  const strategy = agentResults.playbook?.topRecommended?.[0] || "No clear strategy";
  const validationLabel = agentResults.validation?.label || "REVIEW";
  const risk = agentResults.validation?.riskWarning || "Risk needs review";
  const memoryUsed = memoryRecords.length > 0;
  const memoryNote = memoryUsed
    ? "Memory was referenced from prior JSON records."
    : "No prior memory record was available.";
  const dateHint = planner.date_hint || agentResults.regime?.asOfDate || agentResults.playbook?.asOfDate || "";
  const nextAction =
    planner.intent === "Attribution"
      ? `?ㅼ쓬 寃???됰룞? ${agentResults.attribution?.updateSignal || "recheck"}?낅땲??`
      : `?ㅼ쓬 寃???됰룞? ${agentResults.reflection?.revisedDirection || "risk review"}?낅땲??`;

  const structured = buildStructuredFinalAnswer({
    regime,
    strategy,
    validationLabel,
    risk,
    memoryUsed,
    dateHint,
    nextAction,
    memoryNote,
    attribution: planner.intent === "Attribution" ? agentResults.attribution : null,
    historicalMode: Boolean(dateHint)
  });

  const raw = String(llmText || "").trim();
  if (!raw) return structured;
  return raw;
}
