import {
  DEFAULT_TOOL_REGISTRY,
  buildAttributionOutput,
  buildFinalAnswer,
  buildMemoryRecord,
  buildPlannerDecision,
  buildPlaybookOutput,
  buildReflectionOutput,
  buildRegimeOutput,
  buildValidationOutput,
  extractDateHint
} from "../lib/commander-core-clean.js";
function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function safeParseJSON(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}

function extractJsonPayload(text = "") {
  const raw = String(text || "").trim();
  if (!raw) return "";

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return raw.slice(start, end + 1);
  }

  return raw;
}

function normalizeQuestionProfile(profile = {}) {
  const selectedAgents = Array.isArray(profile.selected_agents)
    ? profile.selected_agents.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const reasons = Array.isArray(profile.reason)
    ? profile.reason.map((item) => String(item).trim()).filter(Boolean)
    : [];

  return {
    intent: String(profile.intent || "Unknown"),
    confidence: Number.isFinite(Number(profile.confidence)) ? Math.max(0, Math.min(1, Number(profile.confidence))) : 0,
    selected_agents: selectedAgents,
    reason: reasons,
    response_tone: String(profile.response_tone || "brief"),
    answer_focus: String(profile.answer_focus || ""),
    date_hint: String(profile.date_hint || ""),
    historical_mode: Boolean(profile.historical_mode),
    needs_reflection: Boolean(profile.needs_reflection),
    follow_up: String(profile.follow_up || ""),
    raw: profile
  };
}

function mergePlannerWithQuestionProfile(planner, questionProfile) {
  if (!questionProfile) return planner;

  const merged = { ...planner };
  if (questionProfile.intent && questionProfile.intent !== "Unknown") {
    merged.intent = questionProfile.intent;
  }
  if (questionProfile.confidence > 0) {
    merged.confidence = Math.max(planner.confidence || 0, questionProfile.confidence);
  }
  if (questionProfile.selected_agents.length) {
    merged.selected_agents = questionProfile.selected_agents;
  }
  if (questionProfile.reason.length) {
    merged.reason = questionProfile.reason;
  }
  if (questionProfile.date_hint) {
    merged.date_hint = questionProfile.date_hint;
    merged.historical_mode = true;
  }
  if (questionProfile.historical_mode) {
    merged.historical_mode = true;
  }
  if (questionProfile.needs_reflection && !merged.selected_agents.includes("Reflection Agent")) {
    merged.selected_agents = [...merged.selected_agents, "Reflection Agent"];
  }
  return merged;
}

async function readBody(req) {
  return await new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => resolve(raw));
  });
}

async function runWithRetry(agentName, producer, fallbackProducer) {
  let retryCount = 0;
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const output = await producer();
      return { agent: agentName, output, retry_count: retryCount, fallback_used: false, error: null };
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        retryCount += 1;
        continue;
      }
    }
  }

  const fallbackOutput = await fallbackProducer(lastError);
  return {
    agent: agentName,
    output: fallbackOutput,
    retry_count: retryCount,
    fallback_used: true,
    error: lastError?.message || "Unknown error"
  };
}

function resolveKospi200SnapshotUrl(hints = {}) {
  const raw = String(process.env.KOSPI200_AGENT_JSON_URL || process.env.KOSPI200_AGENT_BASE_URL || "").trim();
  if (!raw) return "";

  const dateHint = String(hints.as_of_date || hints.date_hint || "").trim();

  try {
    const url = new URL(raw);
    if (!/\/api\/agent-result\/?$/.test(url.pathname)) {
      url.pathname = `${url.pathname.replace(/\/+$/, "")}/api/agent-result`;
    }
    if (dateHint) url.searchParams.set("asOf", dateHint);
    url.searchParams.set("symbol", "^KS200");
    return url.toString();
  } catch {
    const base = raw.replace(/\/+$/, "");
    const url = new URL(`${base}/api/agent-result`);
    if (dateHint) url.searchParams.set("asOf", dateHint);
    url.searchParams.set("symbol", "^KS200");
    return url.toString();
  }
}

async function fetchKospi200Snapshot(hints = {}) {
  const endpoint = resolveKospi200SnapshotUrl(hints);
  if (!endpoint) {
    throw new Error("KOSPI200_AGENT_JSON_URL is not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`KOSPI200 snapshot request failed with status ${response.status}`);
    }

    const payload = await response.json();
    if (!payload || (!payload.ok && !payload.analysis && !payload.data)) {
      throw new Error("Invalid KOSPI200 snapshot payload");
    }

    return payload;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeKospi200Snapshot(payload = {}) {
  const root = payload?.data && typeof payload.data === "object" ? payload.data : payload;
  const analysis = root.analysis || {};
  const regime = root.regime || analysis.regime || {};
  const strategy = root.strategy || analysis.strategy || {};
  const validation = root.validation || analysis.validation || {};
  const attribution = root.attribution || analysis.attribution || {};
  const committee = root.committee || analysis.committee || {};
  const battlePlan = root.battle_plan || analysis.battlePlan || {};
  const memoryRecord = root.memory_record || buildMemoryRecord(regime, strategy, validation);

  const topRecommended = Array.isArray(strategy.top)
    ? strategy.top
    : Array.isArray(root.top_recommended)
      ? root.top_recommended
      : [];
  const avoidNow = Array.isArray(strategy.avoid)
    ? strategy.avoid
    : Array.isArray(root.avoid_now)
      ? root.avoid_now
      : [];

  const strategyScore = root.strategy_score ?? strategy.displayTopNine?.[0]?.strategyScore ?? strategy.recommended?.[0]?.strategyScore ?? 0;
  const riskLevel = root.risk_level ?? strategy.displayTopNine?.[0]?.riskLevel ?? strategy.recommended?.[0]?.riskLevel ?? "Medium";
  const expectedReturn = root.expected_return ?? strategy.displayTopNine?.[0]?.expectedReturn ?? strategy.recommended?.[0]?.expectedReturn ?? "";
  const playbookMapping = root.playbook_mapping ?? strategy.displayTopNine?.[0]?.playbookMapping ?? strategy.recommended?.[0]?.playbookMapping ?? "";

  return {
    source: root.source || payload.source || "KOSPI200 Agent JSON",
    asOf: root.asOf || root.input?.asOf || analysis.input?.asOf || "",
    input: root.input || analysis.input || {},
    regime: {
      currentRegime: root.current_regime || regime.label || regime.currentRegime || "",
      confidenceScore: root.confidence_score ?? analysis.confidence?.score ?? 0,
      eventRisk: root.event_risk || analysis.input?.eventRisk || "",
      asOfDate: root.asOf || analysis.input?.asOf || "",
      marketInterpretation: root.market_interpretation || analysis.marketInterpretation || "",
      regimeReason: root.regime_reason || analysis.regimeReason || ""
    },
    playbook: {
      topRecommended,
      avoidNow,
      strategyScore,
      riskLevel,
      expectedReturn,
      asOfDate: root.asOf || analysis.input?.asOf || "",
      playbookMapping
    },
    validation: {
      label: root.validation_label || validation.status || "REVIEW",
      validationScore: root.validation_score ?? validation.score ?? 0,
      asOfDate: root.asOf || analysis.input?.asOf || "",
      riskWarning: root.risk_warning || validation.riskWarning || "",
      validationComment: root.validation_comment || validation.comment || "",
      evidence: validation.details || validation.evidence || []
    },
    reflection: root.reflection || null,
    attribution,
    committee,
    battlePlan,
    memory_record: memoryRecord,
    report: root.report || "",
    beginner_examples: root.beginner_examples || []
  };
}

async function generateLLMFinalAnswer(context) {
  const apiKey = process.env.BIZROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || "";
  if (!apiKey) return "";

  const baseUrl = String(process.env.BIZROUTER_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.bizrouter.ai/v1").replace(/\/+$/, "");
  const model = process.env.BIZROUTER_MODEL || process.env.OPENAI_MODEL || process.env.LLM_MODEL || "openai/gpt-5.4.mini";
  const prompt = [
    "You are the final answer synthesizer for Option Commander Agent.",
    "Use only the provided JSON context. Do not invent tool outputs, market data, or conclusions.",
    "Answer the user's exact question in Korean and make the answer feel natural rather than canned.",
    "Use question_profile, if present, to match the user's intent, tone, and depth.",
    "Write with these exact section labels:",
    "결론:",
    "근거:",
    "다음 안내:",
    "Rules:",
    "- Base the answer only on planner, tool_results, validation_label, memory_record, and llmContext fields.",
    "- Mention current market regime, recommended strategy, validation label, core risk, memory usage, and next review action when relevant.",
    "- If the user asks a broad natural-language question, answer the most relevant interpretation instead of defaulting to a canned line.",
    "- If validation is REVIEW or REJECT, or if memory indicates caution, use conservative wording.",
    "- Keep the answer short and readable.",
    "- Do not present the output as investment instruction; present it as review support only.",
    "- If the context is insufficient, say that additional confirmation is needed."
  ].join("\\n");

  const response = await fetch(baseUrl + "/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: JSON.stringify(context, null, 2) }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`LLM request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

async function generateQuestionProfile(context) {
  const apiKey = process.env.BIZROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || "";
  if (!apiKey) return null;

  const baseUrl = String(process.env.BIZROUTER_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.bizrouter.ai/v1").replace(/\/+$/, "");
  const model = process.env.BIZROUTER_MODEL || process.env.OPENAI_MODEL || process.env.LLM_MODEL || "openai/gpt-5.4.mini";
  const prompt = [
    "You are the natural-language router for Option Commander Agent.",
    "Interpret the user's question with semantic understanding, not keyword matching.",
    "Return strict JSON only, no markdown, no code fences, no extra commentary.",
    "Allowed agent names: Regime Agent, Playbook Agent, Validation Agent, Attribution Agent, Reflection Agent, Memory Agent.",
    "If the question is broad or ambiguous, still choose the most useful review path and explain it briefly.",
    "If the user asks in Korean, answer the JSON fields in Korean except for agent names.",
    "Schema:",
    "{",
    '  "intent": "Strategy | Validation | Attribution | Memory | Reflection | Unknown",',
    '  "confidence": 0.0,',
    '  "selected_agents": ["Regime Agent"],',
    '  "reason": ["..."],',
    '  "response_tone": "brief | explainer | technical | beginner",',
    '  "answer_focus": "short natural-language description of what the final answer should emphasize",',
    '  "date_hint": "YYYY-MM-DD or empty string",',
    '  "historical_mode": true,',
    '  "needs_reflection": false,',
    '  "follow_up": "optional short follow-up guidance or empty string"',
    "}",
    "Rules:",
    "- Keep selected_agents aligned to the user's actual request.",
    "- Use Reflection Agent when the question is ambiguous, beginner-oriented, or risk-sensitive.",
    "- Use Attribution Agent for performance or post-mortem questions.",
    "- Use Memory Agent when the user asks about history, remember, or saving context.",
    "- Use Regime -> Playbook -> Validation as the default route for strategy questions.",
    "- Do not invent market data."
  ].join("\\n");

  const response = await fetch(baseUrl + "/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.15,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: JSON.stringify(context, null, 2) }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Question profile request failed with status ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return normalizeQuestionProfile(safeParseJSON(extractJsonPayload(content), {}));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  let body = {};
  try {
    body = safeParseJSON(await readBody(req), {});
  } catch {
    body = {};
  }

  const question = String(body.question || "").trim();
  const memoryRecords = Array.isArray(body.memory_records) ? body.memory_records : [];
  const hints = safeParseJSON(body.hints, body.hints || {});
  const questionDateHint = extractDateHint(question);
  const normalizedHints = {
    ...hints
  };
  if (questionDateHint) {
    normalizedHints.as_of_date = questionDateHint;
    normalizedHints.date_hint = questionDateHint;
    normalizedHints.question_date_hint = questionDateHint;
  } else if (hints.question_date_hint) {
    const hintDate = String(hints.question_date_hint || "").trim();
    if (hintDate) {
      normalizedHints.as_of_date = hintDate;
      normalizedHints.date_hint = hintDate;
    }
  }

  if (!question) {
    return json(res, 400, { error: "question is required" });
  }

  let questionProfile = null;
  try {
    questionProfile = await generateQuestionProfile({
      question,
      memory_records: memoryRecords.slice(0, 8),
      hints: normalizedHints
    });
  } catch {
    questionProfile = null;
  }

  if (questionDateHint) {
    questionProfile = normalizeQuestionProfile({
      ...(questionProfile?.raw || questionProfile || {}),
      date_hint: questionDateHint,
      historical_mode: true
    });
  }

  const planner = mergePlannerWithQuestionProfile(
    buildPlannerDecision(question, DEFAULT_TOOL_REGISTRY, memoryRecords, {
      ...normalizedHints,
      question_profile: questionProfile
    }),
    questionProfile
  );
  const toolResults = [];
  const failedTools = [];
  let retryCount = 0;
  let fallbackUsed = false;

  const remoteSnapshotResult = await runWithRetry(
    "KOSPI200 Agent Snapshot",
    async () => fetchKospi200Snapshot(normalizedHints),
    async () => null
  );
  retryCount += remoteSnapshotResult.retry_count;
  if (remoteSnapshotResult.fallback_used) {
    fallbackUsed = true;
    failedTools.push("kospi200-agent-snapshot");
  }

  const remoteSnapshot = remoteSnapshotResult.output ? normalizeKospi200Snapshot(remoteSnapshotResult.output) : null;
  const useRemoteSnapshot = Boolean(remoteSnapshot?.regime?.currentRegime && remoteSnapshot?.playbook?.topRecommended?.length && remoteSnapshot?.validation?.label);

  let regimeResult;
  let playbookResult;
  let validationResult;
  let reflectionResult;
  let memoryResult;
  let attributionResult;

  if (useRemoteSnapshot) {
    regimeResult = { agent: "Regime Agent", output: remoteSnapshot.regime, retry_count: 0, fallback_used: false, error: null };
    playbookResult = { agent: "Playbook Agent", output: remoteSnapshot.playbook, retry_count: 0, fallback_used: false, error: null };
    validationResult = { agent: "Validation Agent", output: remoteSnapshot.validation, retry_count: 0, fallback_used: false, error: null };
    attributionResult = { agent: "Attribution Agent", output: remoteSnapshot.attribution || buildAttributionOutput(), retry_count: 0, fallback_used: false, error: null };
    reflectionResult = await runWithRetry(
      "Reflection Agent",
      async () => buildReflectionOutput(playbookResult.output, validationResult.output, planner.memoryCue),
      async () => buildReflectionOutput(playbookResult.output, validationResult.output, planner.memoryCue)
    );
    memoryResult = {
      agent: "Memory Agent",
      output: remoteSnapshot.memory_record || buildMemoryRecord(regimeResult.output, playbookResult.output, validationResult.output),
      retry_count: 0,
      fallback_used: false,
      error: null
    };

    toolResults.push(
      {
        agent: "Regime Agent",
        input: planner.execution_plan.find((item) => item.agent === "Regime Agent")?.input || {},
        output: regimeResult.output,
        retry_count: regimeResult.retry_count,
        fallback_used: regimeResult.fallback_used,
        source: "KOSPI200 Agent JSON"
      },
      {
        agent: "Playbook Agent",
        input: planner.execution_plan.find((item) => item.agent === "Playbook Agent")?.input || {},
        output: playbookResult.output,
        retry_count: playbookResult.retry_count,
        fallback_used: playbookResult.fallback_used,
        source: "KOSPI200 Agent JSON"
      },
      {
        agent: "Validation Agent",
        input: planner.execution_plan.find((item) => item.agent === "Validation Agent")?.input || {},
        output: validationResult.output,
        retry_count: validationResult.retry_count,
        fallback_used: validationResult.fallback_used,
        source: "KOSPI200 Agent JSON"
      },
      {
        agent: "Attribution Agent",
        input: planner.execution_plan.find((item) => item.agent === "Attribution Agent")?.input || {},
        output: attributionResult.output,
        retry_count: attributionResult.retry_count,
        fallback_used: attributionResult.fallback_used,
        source: "KOSPI200 Agent JSON"
      },
      {
        agent: "Reflection Agent",
        input: planner.execution_plan.find((item) => item.agent === "Reflection Agent")?.input || {},
        output: reflectionResult.output,
        retry_count: reflectionResult.retry_count,
        fallback_used: reflectionResult.fallback_used,
        source: "local fallback"
      },
      {
        agent: "Memory Agent",
        input: planner.execution_plan.find((item) => item.agent === "Memory Agent")?.input || {},
        output: memoryResult.output,
        retry_count: memoryResult.retry_count,
        fallback_used: memoryResult.fallback_used,
        source: "KOSPI200 Agent JSON"
      }
    );
  } else {
    regimeResult = await runWithRetry(
      "Regime Agent",
      async () => buildRegimeOutput(question, planner),
      async () => buildRegimeOutput(question, planner)
    );
    toolResults.push({
      agent: "Regime Agent",
      input: planner.execution_plan.find((item) => item.agent === "Regime Agent")?.input || {},
      output: regimeResult.output,
      retry_count: regimeResult.retry_count,
      fallback_used: regimeResult.fallback_used,
      source: "local fallback"
    });
    retryCount += regimeResult.retry_count;
    if (regimeResult.fallback_used) {
      fallbackUsed = true;
      failedTools.push("regime-agent");
    }

    playbookResult = await runWithRetry(
      "Playbook Agent",
      async () => buildPlaybookOutput(question, regimeResult.output, planner),
      async () => buildPlaybookOutput(question, regimeResult.output, planner)
    );
    toolResults.push({
      agent: "Playbook Agent",
      input: planner.execution_plan.find((item) => item.agent === "Playbook Agent")?.input || {},
      output: playbookResult.output,
      retry_count: playbookResult.retry_count,
      fallback_used: playbookResult.fallback_used,
      source: "local fallback"
    });
    retryCount += playbookResult.retry_count;
    if (playbookResult.fallback_used) {
      fallbackUsed = true;
      failedTools.push("playbook-agent");
    }

    validationResult = await runWithRetry(
      "Validation Agent",
      async () => buildValidationOutput(playbookResult.output, regimeResult.output, planner.memoryCue),
      async () => buildValidationOutput(playbookResult.output, regimeResult.output, planner.memoryCue)
    );
    toolResults.push({
      agent: "Validation Agent",
      input: planner.execution_plan.find((item) => item.agent === "Validation Agent")?.input || {},
      output: validationResult.output,
      retry_count: validationResult.retry_count,
      fallback_used: validationResult.fallback_used,
      source: "local fallback"
    });
    retryCount += validationResult.retry_count;
    if (validationResult.fallback_used) {
      fallbackUsed = true;
      failedTools.push("validation-agent");
    }

    attributionResult = { agent: "Attribution Agent", output: buildAttributionOutput(), retry_count: 0, fallback_used: false, error: null };
    toolResults.push({
      agent: "Attribution Agent",
      input: planner.execution_plan.find((item) => item.agent === "Attribution Agent")?.input || {},
      output: attributionResult.output,
      retry_count: attributionResult.retry_count,
      fallback_used: attributionResult.fallback_used,
      source: "local fallback"
    });

    reflectionResult = await runWithRetry(
      "Reflection Agent",
      async () => buildReflectionOutput(playbookResult.output, validationResult.output, planner.memoryCue),
      async () => buildReflectionOutput(playbookResult.output, validationResult.output, planner.memoryCue)
    );
    toolResults.push({
      agent: "Reflection Agent",
      input: planner.execution_plan.find((item) => item.agent === "Reflection Agent")?.input || {},
      output: reflectionResult.output,
      retry_count: reflectionResult.retry_count,
      fallback_used: reflectionResult.fallback_used,
      source: "local fallback"
    });
    retryCount += reflectionResult.retry_count;
    if (reflectionResult.fallback_used) {
      fallbackUsed = true;
      failedTools.push("reflection-agent");
    }

    memoryResult = await runWithRetry(
      "Memory Agent",
      async () => buildMemoryRecord(regimeResult.output, playbookResult.output, validationResult.output),
      async () => buildMemoryRecord(regimeResult.output, playbookResult.output, validationResult.output)
    );
    toolResults.push({
      agent: "Memory Agent",
      input: planner.execution_plan.find((item) => item.agent === "Memory Agent")?.input || {},
      output: memoryResult.output,
      retry_count: memoryResult.retry_count,
      fallback_used: memoryResult.fallback_used,
      source: "local fallback"
    });
    retryCount += memoryResult.retry_count;
    if (memoryResult.fallback_used) {
      fallbackUsed = true;
      failedTools.push("memory-agent");
    }
  }

  if (useRemoteSnapshot) {
    retryCount += reflectionResult.retry_count;
    if (reflectionResult.fallback_used) {
      fallbackUsed = true;
      failedTools.push("reflection-agent");
    }
  }

  const llmContext = {
    question,
    planner,
    question_profile: questionProfile,
    tool_results: toolResults,
    validation_label: validationResult.output.label,
    current_regime: regimeResult.output.currentRegime,
    recommended_strategy: playbookResult.output.topRecommended?.[0] || "",
    core_risk: validationResult.output.riskWarning,
    memory_used: memoryRecords.length > 0 || Boolean(memoryResult.output),
    memory_record: memoryResult.output,
    date_hint: questionDateHint || planner.date_hint || regimeResult.output.asOfDate || playbookResult.output.asOfDate || "",
    historical_mode: Boolean(questionDateHint || planner.date_hint || regimeResult.output.asOfDate || playbookResult.output.asOfDate)
  };

  let llmAnswer = "";
  let llmFailed = false;
  try {
    llmAnswer = await generateLLMFinalAnswer(llmContext);
  } catch {
    llmFailed = true;
    fallbackUsed = true;
    failedTools.push("final-answer-llm");
  }

  const finalAnswer = buildFinalAnswer(
    question,
    planner,
    {
      regime: regimeResult.output,
      playbook: playbookResult.output,
      validation: validationResult.output,
      reflection: reflectionResult.output,
      attribution: attributionResult.output,
      memory_record: memoryResult.output
    },
    memoryRecords,
    llmAnswer
  );

  const response = {
    question,
    intent: planner.intent,
    confidence: planner.confidence,
    date_hint: questionDateHint || planner.date_hint || "",
    historical_mode: Boolean(questionDateHint || planner.historical_mode),
    question_profile: questionProfile,
    selected_agents: planner.selected_agents,
    reason: planner.reason,
    execution_plan: planner.execution_plan,
    tool_results: toolResults,
    validation_label: validationResult.output.label,
    current_regime: regimeResult.output.currentRegime,
    recommended_strategy: playbookResult.output.topRecommended?.[0] || "",
    core_risk: validationResult.output.riskWarning,
    memory_used: memoryRecords.length > 0 || Boolean(memoryResult.output),
    memory_record: memoryResult.output,
    llm_answer: llmAnswer,
    retry_count: retryCount,
    fallback_used: fallbackUsed || llmFailed,
    failed_tools: failedTools,
    final_answer: finalAnswer,
    snapshot_source: remoteSnapshot?.source || "",
    snapshot_used: useRemoteSnapshot,
    battle_plan: [
      "User Question",
      "Planner",
      "Regime Agent",
      "Playbook Agent",
      "Validation Agent",
      "Reflection Agent",
      "Memory Agent",
      "Final Answer"
    ],
    trace: {
      question,
      intent: planner.intent,
      confidence: planner.confidence,
      date_hint: questionDateHint || planner.date_hint || "",
      historical_mode: Boolean(questionDateHint || planner.historical_mode),
      question_profile: questionProfile,
      selected_agents: planner.selected_agents,
      tool_results: toolResults,
      validation_label: validationResult.output.label,
      memory_used: memoryRecords.length > 0 || Boolean(memoryResult.output),
      retry_count: retryCount,
      fallback_used: fallbackUsed || llmFailed,
      failed_tools: failedTools,
      final_answer: finalAnswer,
      snapshot_source: remoteSnapshot?.source || "",
      snapshot_used: useRemoteSnapshot
    }
  };

  return json(res, 200, response);
}
