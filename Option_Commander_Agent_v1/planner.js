export const DEFAULT_TOOL_REGISTRY = {
  project: "Option Commander Agent",
  version: "v1",
  tools: [
    {
      id: "regime-agent",
      name: "Regime Agent",
      agentId: "market-regime",
      label: "Module 1",
      purpose: "시장 국면과 변동성을 먼저 해석",
      triggers: ["국면", "레짐", "시장", "변동성", "방향", "event risk", "event", "regime"],
      outputs: ["Current Regime", "Confidence Score", "Event Risk", "Market Interpretation", "Regime Reason"]
    },
    {
      id: "playbook-agent",
      name: "Playbook Agent",
      agentId: "option-playbook",
      label: "Module 2",
      purpose: "국면에 맞는 옵션 전략군을 추천",
      triggers: ["전략", "추천", "playbook", "옵션", "hedge", "방어", "공격", "trade"],
      outputs: ["Top Recommended 9", "Avoid Now 6", "Strategy Score", "Risk Level", "Expected Return", "Playbook Mapping"]
    },
    {
      id: "validation-agent",
      name: "Validation Agent",
      agentId: "validation",
      label: "Module 3",
      purpose: "검증 기준과 백테스트 우위를 점검",
      triggers: ["검증", "validation", "review", "reject", "pass", "backtest", "리스크", "꼬리", "레드팀"],
      outputs: ["PASS", "REVIEW", "REJECT", "Validation Score", "Risk Warning"]
    },
    {
      id: "attribution-agent",
      name: "Attribution Agent",
      agentId: "attribution",
      label: "Module 4",
      purpose: "성과를 Allocation / Selection / Interaction으로 분해",
      triggers: ["성과", "분해", "attribution", "allocation", "selection", "interaction", "alpha", "beta", "pnl", "기여"],
      outputs: ["Allocation Effect", "Selection Effect", "Interaction Effect", "Alpha Source", "Beta Source", "Update Signal"]
    }
  ],
  prompts: [
    "지금 추천 전략은?",
    "레짐과 플레이북을 같이 봐줘",
    "이 전략을 검증까지 해줘",
    "성과가 왜 그렇게 나왔는지 분해해줘"
  ]
};

const ROUTE_RULES = [
  {
    intent: "Strategy",
    keywords: ["추천 전략", "추천전략", "전략", "playbook", "옵션", "포지션", "trade"],
    sequence: ["regime-agent", "playbook-agent", "validation-agent"],
    summary: "전략 도출과 실행 전 검증까지 이어지는 흐름입니다."
  },
  {
    intent: "Market Regime",
    keywords: ["국면", "레짐", "변동성", "시장", "방향", "now", "지금"],
    sequence: ["regime-agent", "playbook-agent"],
    summary: "질문이 시장 상태 해석을 먼저 요구합니다."
  },
  {
    intent: "Validation",
    keywords: ["검증", "validation", "review", "reject", "pass", "backtest", "리스크"],
    sequence: ["validation-agent"],
    summary: "실행 전 검증 기준과 위험 라벨이 중요합니다."
  },
  {
    intent: "Attribution",
    keywords: ["성과", "분해", "attribution", "allocation", "selection", "interaction", "alpha", "beta", "pnl"],
    sequence: ["attribution-agent"],
    summary: "결과를 효과별로 해석하는 요청입니다."
  }
];

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

function selectRoute(question, registry) {
  const q = normalize(question);
  const matched = ROUTE_RULES
    .map((rule) => ({ ...rule, hits: scoreKeywords(q, rule.keywords) }))
    .filter((rule) => rule.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  const hasBattle = q.includes("battle") || q.includes("종합") || q.includes("all") || q.includes("한 번");
  const hasPerformance = q.includes("성과") || q.includes("분해") || q.includes("attribution");

  let sequence = matched.flatMap((rule) => rule.sequence);
  if (!sequence.length) {
    sequence = q ? ["regime-agent", "playbook-agent"] : ["regime-agent"];
  }
  if (hasBattle) sequence = ["regime-agent", "playbook-agent", "validation-agent", "attribution-agent"];
  if (hasPerformance) sequence = ["regime-agent", "playbook-agent", "validation-agent", "attribution-agent"];

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

function buildReasoning(sequence, matched) {
  const lines = [];
  const intentText = matched[0]?.summary || "질문 의도가 넓어서 기본 오케스트레이션을 적용했습니다.";
  lines.push(intentText);
  if (sequence.includes("regime-agent")) lines.push("시장 국면 해석을 위해 Regime Agent를 우선 호출합니다.");
  if (sequence.includes("playbook-agent")) lines.push("전략 후보를 얻기 위해 Playbook Agent를 연결합니다.");
  if (sequence.includes("validation-agent")) lines.push("실행 전 리스크와 백테스트 우위를 확인하기 위해 Validation Agent를 추가합니다.");
  if (sequence.includes("attribution-agent")) lines.push("성과와 업데이트 신호를 분해하기 위해 Attribution Agent를 호출합니다.");
  return lines;
}

function invokeTool(tool, question, context) {
  const base = {
    id: tool.id,
    name: tool.name,
    label: tool.label,
    status: "called",
    purpose: tool.purpose
  };

  if (tool.id === "regime-agent") {
    return {
      ...base,
      output: {
        currentRegime: "Transition",
        confidenceScore: 0.74,
        eventRisk: "high",
        marketInterpretation: "방향성과 변동성 변화가 함께 움직여 우선 해석이 필요합니다.",
        regimeReason: "최근 시장은 추세보다 변동성 변화가 더 큰 신호입니다."
      }
    };
  }

  if (tool.id === "playbook-agent") {
    return {
      ...base,
      output: {
        topRecommended: ["Bull Call Spread", "Call Backspread", "Covered Call"],
        avoidNow: ["Short Straddle", "Short Put", "Reverse Calendar"],
        strategyScore: 92,
        riskLevel: "Medium",
        expectedReturn: "+12.4%",
        playbookMapping: `${context.intent || "Strategy"} intent mapped from "${question}"`
      }
    };
  }

  if (tool.id === "validation-agent") {
    return {
      ...base,
      output: {
        label: "REVIEW",
        validationScore: 68,
        riskWarning: "방향성은 맞지만 이벤트 이후 변동성 급락 위험을 추가 확인해야 합니다.",
        validationComment: "백테스트 우위는 있으나 꼬리 위험 통제가 추가로 필요합니다."
      }
    };
  }

  if (tool.id === "attribution-agent") {
    return {
      ...base,
      output: {
        allocationEffect: 2.4,
        selectionEffect: 3.1,
        interactionEffect: -0.6,
        alphaSource: "selection",
        betaSource: "market timing",
        updateSignal: "reduce_leverage"
      }
    };
  }

  return {
    ...base,
    output: { message: "No handler available" }
  };
}

function buildSummary(intent, sequence, confidence, registry) {
  const labels = sequence.map((id) => getTool(registry, id)?.name).filter(Boolean);
  const chain = labels.length ? labels.join(" → ") : "Regime Agent";
  return `${intent} 요청으로 해석했고, ${chain} 순서로 호출합니다. Planner confidence는 ${(confidence * 100).toFixed(0)}%입니다.`;
}

export function planQuestion(question, registry = DEFAULT_TOOL_REGISTRY) {
  const input = String(question || "").trim();
  const { sequence, matched } = selectRoute(input, registry);
  const confidence = computeConfidence(input, sequence, matched);
  const intent = matched[0]?.intent || (sequence.includes("attribution-agent") ? "Attribution" : sequence.includes("validation-agent") ? "Validation" : "Strategy");
  const selectedTools = sequence.map((id, index) => {
    const tool = getTool(registry, id);
    return { ...tool, order: index + 1 };
  });
  const reasoning = buildReasoning(sequence, matched);
  const toolCalls = selectedTools.map((tool) => invokeTool(tool, input, { intent, confidence, sequence }));

  const battlePlan = [
    { title: "Planner route", text: selectedTools.map((tool) => tool.name).join(" → ") },
    { title: "Commander action", text: intent === "Attribution" ? "성과 분해와 업데이트 신호를 먼저 요약합니다." : "국면 해석 → 전략 후보 → 검증 순으로 응답합니다." },
    { title: "Risk posture", text: sequence.includes("validation-agent") ? "검증 단계가 포함되어 있어 실행 전 위험 설명을 강화합니다." : "검토 포인트 중심으로 빠르게 응답합니다." }
  ];

  return {
    question: input,
    intent,
    confidence,
    selectedTools,
    selectedToolIds: sequence,
    reasoning,
    toolCalls,
    battlePlan,
    summary: buildSummary(intent, sequence, confidence, registry),
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
    // file:// fallback
  }
  return JSON.parse(JSON.stringify(DEFAULT_TOOL_REGISTRY));
}
