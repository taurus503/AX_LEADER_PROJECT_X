export const DEFAULT_REGISTRY = {
  project: "Option Commander Agent",
  version: "v1",
  agents: [
    {
      id: "market-regime",
      name: "Market Regime Agent",
      alias: "Module 1",
      purpose: "시장 국면과 변동성을 먼저 해석",
      triggers: ["국면", "레짐", "시장", "변동성", "방향", "event risk", "event", "regime"],
      outputs: ["Current Regime", "Confidence Score", "Event Risk", "Market Interpretation", "Regime Reason"],
      sample: {
        regime: "Transition",
        confidence: 0.74,
        eventRisk: "high",
        note: "방향성과 변동성 변화가 함께 움직여 우선 해석이 필요합니다."
      }
    },
    {
      id: "option-playbook",
      name: "Option Playbook Agent",
      alias: "Module 2",
      purpose: "국면에 맞는 옵션 전략군을 추천",
      triggers: ["전략", "추천", "playbook", "옵션", "hedge", "방어", "공격", "trade"],
      outputs: ["Top Recommended 9", "Avoid Now 6", "Strategy Score", "Risk Level", "Expected Return", "Playbook Mapping"],
      sample: {
        top: "Bull Call Spread",
        avoid: "Short Straddle",
        score: 92,
        risk: "Medium",
        return: "+12.4%"
      }
    },
    {
      id: "validation",
      name: "Validation Agent",
      alias: "Module 3",
      purpose: "검증 기준과 백테스트 우위를 점검",
      triggers: ["검증", "validation", "review", "reject", "pass", "backtest", "리스크", "꼬리", "레드팀"],
      outputs: ["PASS", "REVIEW", "REJECT", "Validation Score", "Risk Warning"],
      sample: {
        label: "REVIEW",
        score: 68,
        warning: "방향성은 맞지만 이벤트 이후 변동성 급락 위험을 추가 확인해야 합니다."
      }
    },
    {
      id: "attribution",
      name: "Attribution Agent",
      alias: "Module 4",
      purpose: "성과를 Allocation / Selection / Interaction으로 분해",
      triggers: ["성과", "분해", "attribution", "allocation", "selection", "interaction", "alpha", "beta", "pnl", "기여"],
      outputs: ["Allocation Effect", "Selection Effect", "Interaction Effect", "Alpha Source", "Beta Source", "Update Signal"],
      sample: {
        allocation: 2.4,
        selection: 3.1,
        interaction: -0.6,
        updateSignal: "reduce_leverage"
      }
    }
  ],
  prompts: [
    "지금 추천 전략은?",
    "레짐과 플레이북을 같이 봐줘",
    "이 전략을 검증까지 해줘",
    "성과가 왜 그렇게 나왔는지 분해해줘"
  ]
};

const KEYWORD_RULES = [
  {
    name: "strategy route",
    keywords: ["추천 전략", "추천전략", "전략", "playbook", "옵션"],
    sequence: ["market-regime", "option-playbook", "validation"],
    intent: "Strategy",
    summary: "현재 질문은 전략 도출과 실행 전 검증까지 이어지는 흐름입니다."
  },
  {
    name: "regime route",
    keywords: ["국면", "레짐", "변동성", "시장", "방향", "지금", "today", "now"],
    sequence: ["market-regime", "option-playbook"],
    intent: "Market Regime",
    summary: "질문이 시장 상태 해석을 먼저 요구합니다."
  },
  {
    name: "validation route",
    keywords: ["검증", "validation", "review", "reject", "pass", "backtest", "리스크"],
    sequence: ["validation"],
    intent: "Validation",
    summary: "실행 전 검증 기준과 위험 라벨이 중요합니다."
  },
  {
    name: "attribution route",
    keywords: ["성과", "분해", "attribution", "allocation", "selection", "interaction", "alpha", "beta", "pnl"],
    sequence: ["attribution"],
    intent: "Attribution",
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

function scoreKeywords(question, keywords) {
  const q = normalize(question);
  return keywords.reduce((acc, keyword) => (q.includes(normalize(keyword)) ? acc + 1 : acc), 0);
}

function getAgent(registry, id) {
  return registry.agents.find((agent) => agent.id === id) || null;
}

function unique(list) {
  return [...new Set(list)];
}

function buildSequence(question, registry) {
  const q = normalize(question);
  const matchedRules = KEYWORD_RULES
    .map((rule) => ({ ...rule, hits: scoreKeywords(q, rule.keywords) }))
    .filter((rule) => rule.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  const defaultSequence = ["market-regime", "option-playbook", "validation"];
  const hasBattle = q.includes("battle") || q.includes("종합") || q.includes("한 번") || q.includes("all");
  const hasPerformance = q.includes("성과") || q.includes("분해") || q.includes("attribution");

  let sequence = matchedRules.flatMap((rule) => rule.sequence);
  if (!sequence.length) sequence = defaultSequence.slice(0, q ? 2 : 1);
  if (hasBattle) sequence = unique([...defaultSequence, "attribution"]);
  if (hasPerformance) sequence = unique(["market-regime", "option-playbook", "validation", "attribution"]);

  sequence = unique(sequence);
  sequence = sequence.filter((id) => getAgent(registry, id));
  if (!sequence.length) sequence = ["market-regime", "option-playbook"];
  return { sequence, matchedRules };
}

function computeConfidence(question, sequence, matchedRules) {
  const q = normalize(question);
  const signalCount = [...sequence].length + matchedRules.reduce((sum, rule) => sum + rule.hits, 0);
  const clarityBoost = q.split(" ").filter(Boolean).length > 3 ? 0.05 : 0;
  const score = 0.58 + Math.min(0.32, signalCount * 0.06 + clarityBoost);
  return Math.max(0.55, Math.min(0.94, Number(score.toFixed(2))));
}

function buildReasoning(question, sequence, matchedRules) {
  const lines = [];
  const intentText = matchedRules[0]?.summary || "질문 의도가 넓어서 기본 오케스트레이션을 적용했습니다.";
  lines.push(intentText);

  if (sequence.includes("market-regime")) lines.push("시장 국면 해석이 필요해 Market Regime Agent를 먼저 호출합니다.");
  if (sequence.includes("option-playbook")) lines.push("전략 후보를 고르기 위해 Option Playbook Agent를 연결합니다.");
  if (sequence.includes("validation")) lines.push("실행 전 리스크와 백테스트 우위를 확인하기 위해 Validation Agent를 추가합니다.");
  if (sequence.includes("attribution")) lines.push("성과나 기여도 해석이 필요해 Attribution Agent를 마지막에 붙입니다.");

  return lines;
}

export function planQuestion(question, registry = DEFAULT_REGISTRY) {
  const input = String(question || "").trim();
  const { sequence, matchedRules } = buildSequence(input, registry);
  const confidence = computeConfidence(input, sequence, matchedRules);
  const selectedAgents = sequence.map((id, index) => {
    const agent = getAgent(registry, id);
    return {
      ...agent,
      order: index + 1,
      active: true
    };
  });

  const reasons = buildReasoning(input, sequence, matchedRules);
  const primaryIntent = matchedRules[0]?.intent || (sequence.includes("attribution") ? "Attribution" : sequence.includes("validation") ? "Validation" : "Strategy");

  const battlePlan = [
    {
      title: "Planner route",
      text: sequence.map((id) => getAgent(registry, id)?.name).filter(Boolean).join(" → ")
    },
    {
      title: "Commander action",
      text: primaryIntent === "Attribution"
        ? "성과 분해와 업데이트 신호를 먼저 요약합니다."
        : "국면 해석 → 전략 후보 → 검증 순으로 응답합니다."
    },
    {
      title: "Risk posture",
      text: sequence.includes("validation")
        ? "검증 단계가 포함되어 있어 실행 전 위험 설명을 강화합니다."
        : "검토 포인트 중심으로 빠르게 응답합니다."
    }
  ];

  return {
    question: input,
    intent: primaryIntent,
    confidence,
    selectedAgents,
    selectedAgentIds: sequence,
    reasoning: reasons,
    battlePlan,
    summary: buildSummary(primaryIntent, sequence, confidence, registry),
    updatedAt: new Date().toISOString()
  };
}

function buildSummary(intent, sequence, confidence, registry) {
  const labels = sequence.map((id) => getAgent(registry, id)?.name).filter(Boolean);
  const chain = labels.length ? labels.join(" → ") : "Market Regime Agent";
  return `${intent} 요청으로 해석했고, ${chain} 순서로 호출합니다. Planner confidence는 ${(confidence * 100).toFixed(0)}%입니다.`;
}

export async function loadRegistry() {
  try {
    const response = await fetch("./agent-registry.json", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      if (data?.agents?.length) return data;
    }
  } catch (error) {
    // Fallback to embedded registry for local file:// usage.
  }
  return JSON.parse(JSON.stringify(DEFAULT_REGISTRY));
}
