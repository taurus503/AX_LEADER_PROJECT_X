import {
  DEFAULT_TOOL_REGISTRY,
  buildAttributionOutput,
  buildFinalAnswer,
  buildMemoryRecord,
  buildPlannerDecision,
  buildPlaybookOutput,
  buildReflectionOutput,
  buildRegimeOutput,
  buildValidationOutput
} from "../lib/commander-core.js";

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

async function generateLLMFinalAnswer(context) {
  const apiKey = process.env.BIZROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || "";
  if (!apiKey) return "";

  const baseUrl = String(process.env.BIZROUTER_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.bizrouter.ai/v1").replace(/\/+$/, "");
  const model = process.env.BIZROUTER_MODEL || process.env.OPENAI_MODEL || process.env.LLM_MODEL || "openai/gpt-5.4.mini";
  const prompt = [
    "You are the final answer synthesizer for Option Commander Agent.",
    "Write a concise operational response with these exact sections:",
    "1. 현재 시장 국면",
    "2. 추천 전략",
    "3. 검증 결과",
    "4. 핵심 리스크",
    "5. Memory 참고 여부",
    "6. 다음 검토 행동",
    "The answer must say this is for review support, not investment instruction.",
    "Use the provided JSON context only."
  ].join("\n");

  const userPayload = JSON.stringify(context, null, 2);

  const response = await fetch(`${baseUrl}/chat/completions`, {
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
        { role: "user", content: userPayload }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`LLM request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  let body = {};
  try {
    body = safeParseJSON(await new Promise((resolve) => {
      let raw = "";
      req.on("data", (chunk) => {
        raw += chunk;
      });
      req.on("end", () => resolve(raw));
    }), {});
  } catch {
    body = {};
  }

  const question = String(body.question || "").trim();
  const memoryRecords = Array.isArray(body.memory_records) ? body.memory_records : [];
  const hints = safeParseJSON(body.hints, body.hints || {});

  if (!question) {
    return json(res, 400, { error: "question is required" });
  }

  const planner = buildPlannerDecision(question, DEFAULT_TOOL_REGISTRY, memoryRecords, hints);
  const toolResults = [];
  const failedTools = [];
  let retryCount = 0;
  let fallbackUsed = false;

  const regimeResult = await runWithRetry(
    "Regime Agent",
    async () => buildRegimeOutput(question, planner),
    async () => buildRegimeOutput(question, planner)
  );
  toolResults.push({
    agent: "Regime Agent",
    input: planner.execution_plan.find((item) => item.agent === "Regime Agent")?.input || {},
    output: regimeResult.output,
    retry_count: regimeResult.retry_count,
    fallback_used: regimeResult.fallback_used
  });
  retryCount += regimeResult.retry_count;
  if (regimeResult.fallback_used) {
    fallbackUsed = true;
    failedTools.push("regime-agent");
  }

  const playbookResult = await runWithRetry(
    "Playbook Agent",
    async () => buildPlaybookOutput(question, regimeResult.output),
    async () => buildPlaybookOutput(question, regimeResult.output)
  );
  toolResults.push({
    agent: "Playbook Agent",
    input: planner.execution_plan.find((item) => item.agent === "Playbook Agent")?.input || {},
    output: playbookResult.output,
    retry_count: playbookResult.retry_count,
    fallback_used: playbookResult.fallback_used
  });
  retryCount += playbookResult.retry_count;
  if (playbookResult.fallback_used) {
    fallbackUsed = true;
    failedTools.push("playbook-agent");
  }

  const validationResult = await runWithRetry(
    "Validation Agent",
    async () => buildValidationOutput(playbookResult.output, regimeResult.output, planner.memoryCue),
    async () => buildValidationOutput(playbookResult.output, regimeResult.output, planner.memoryCue)
  );
  toolResults.push({
    agent: "Validation Agent",
    input: planner.execution_plan.find((item) => item.agent === "Validation Agent")?.input || {},
    output: validationResult.output,
    retry_count: validationResult.retry_count,
    fallback_used: validationResult.fallback_used
  });
  retryCount += validationResult.retry_count;
  if (validationResult.fallback_used) {
    fallbackUsed = true;
    failedTools.push("validation-agent");
  }

  const reflectionResult = await runWithRetry(
    "Reflection Agent",
    async () => buildReflectionOutput(playbookResult.output, validationResult.output, planner.memoryCue),
    async () => buildReflectionOutput(playbookResult.output, validationResult.output, planner.memoryCue)
  );
  toolResults.push({
    agent: "Reflection Agent",
    input: planner.execution_plan.find((item) => item.agent === "Reflection Agent")?.input || {},
    output: reflectionResult.output,
    retry_count: reflectionResult.retry_count,
    fallback_used: reflectionResult.fallback_used
  });
  retryCount += reflectionResult.retry_count;
  if (reflectionResult.fallback_used) {
    fallbackUsed = true;
    failedTools.push("reflection-agent");
  }

  const memoryResult = await runWithRetry(
    "Memory Agent",
    async () => buildMemoryRecord(regimeResult.output, playbookResult.output, validationResult.output),
    async () => buildMemoryRecord(regimeResult.output, playbookResult.output, validationResult.output)
  );
  toolResults.push({
    agent: "Memory Agent",
    input: planner.execution_plan.find((item) => item.agent === "Memory Agent")?.input || {},
    output: memoryResult.output,
    retry_count: memoryResult.retry_count,
    fallback_used: memoryResult.fallback_used
  });
  retryCount += memoryResult.retry_count;
  if (memoryResult.fallback_used) {
    fallbackUsed = true;
    failedTools.push("memory-agent");
  }

  const llmContext = {
    question,
    planner,
    tool_results: toolResults,
    validation_label: validationResult.output.label,
    current_regime: regimeResult.output.currentRegime,
    recommended_strategy: playbookResult.output.topRecommended?.[0] || "",
    core_risk: validationResult.output.riskWarning,
    memory_used: memoryRecords.length > 0 || Boolean(memoryResult.output),
    memory_record: memoryResult.output
  };

  let llmAnswer = "";
  let llmFailed = false;
  try {
    llmAnswer = await generateLLMFinalAnswer(llmContext);
  } catch (error) {
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
      attribution: buildAttributionOutput(),
      memory_record: memoryResult.output
    },
    memoryRecords,
    llmAnswer
  );

  const response = {
    question,
    intent: planner.intent,
    confidence: planner.confidence,
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
    retry_count: retryCount,
    fallback_used: fallbackUsed || llmFailed,
    failed_tools: failedTools,
    final_answer: finalAnswer,
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
      selected_agents: planner.selected_agents,
      tool_results: toolResults,
      validation_label: validationResult.output.label,
      memory_used: memoryRecords.length > 0 || Boolean(memoryResult.output),
      retry_count: retryCount,
      fallback_used: fallbackUsed || llmFailed,
      failed_tools: failedTools,
      final_answer: finalAnswer
    }
  };

  return json(res, 200, response);
}
