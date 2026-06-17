export const SCENARIOS = {
  bullCalm: {
    label: "Bull/Calm",
    description: "방향성 우위, 변동성 안정",
    returns: { oneDay: 0.8, oneWeek: 2.2, oneMonth: 6.4 },
    volatility20d: 18.5,
    eventRisk: "low",
    newsSentiment: "positive",
    breadth: "strong",
    trendStrength: 72,
    slem: 0.71,
    gelmanRubin: 1.03,
    tradabilityMaskValid: true
  },
  bearCrisis: {
    label: "Bear/Crisis",
    description: "하락 압력, 변동성 확대",
    returns: { oneDay: -2.9, oneWeek: -6.8, oneMonth: -12.4 },
    volatility20d: 58.7,
    eventRisk: "high",
    newsSentiment: "negative",
    breadth: "weak",
    trendStrength: 19,
    slem: 0.94,
    gelmanRubin: 1.14,
    tradabilityMaskValid: true
  },
  transition: {
    label: "Transition",
    description: "방향 불명확, 검토 필요",
    returns: { oneDay: 1.7, oneWeek: -0.6, oneMonth: 4.1 },
    volatility20d: 36.2,
    eventRisk: "high",
    newsSentiment: "mixed",
    breadth: "weak",
    trendStrength: 48,
    slem: 0.88,
    gelmanRubin: 1.08,
    tradabilityMaskValid: true
  }
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round(value, digits = 2) {
  const multiplier = 10 ** digits;
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

function riskScore(input) {
  let score = 0;
  if (input.eventRisk === "high") score += 2;
  if (input.eventRisk === "medium") score += 1;
  if (input.newsSentiment === "negative") score += 1;
  if (input.newsSentiment === "mixed") score += 0.5;
  if (input.breadth === "weak") score += 1;
  if (input.volatility20d >= 45) score += 2;
  else if (input.volatility20d >= 30) score += 1;
  return score;
}

function classifyRegime(input) {
  const r = input.returns;
  const risk = riskScore(input);
  const positiveTrend = r.oneMonth >= 3 && r.oneWeek >= 0 && input.trendStrength >= 55;
  const negativeShock = r.oneMonth <= -5 || r.oneWeek <= -3 || r.oneDay <= -2.5;
  if (negativeShock && (input.volatility20d >= 35 || risk >= 4)) return "Bear/Crisis";
  if (positiveTrend && input.volatility20d <= 26 && risk <= 1.5 && input.breadth !== "weak") return "Bull/Calm";
  return "Transition";
}

function confidenceFor(regime, input) {
  const r = input.returns;
  const risk = riskScore(input);
  let score = 0.58;
  if (regime === "Bull/Calm") {
    score += r.oneMonth >= 5 ? 0.12 : 0.06;
    score += r.oneWeek >= 1 ? 0.08 : 0;
    score += input.volatility20d <= 20 ? 0.08 : 0.03;
    score += input.breadth === "strong" ? 0.07 : 0;
    score -= risk * 0.03;
  } else if (regime === "Bear/Crisis") {
    score += r.oneMonth <= -8 ? 0.12 : 0.07;
    score += input.volatility20d >= 50 ? 0.1 : 0.05;
    score += input.breadth === "weak" ? 0.08 : 0;
    score += input.eventRisk === "high" ? 0.05 : 0;
  } else {
    score += input.eventRisk === "high" ? 0.06 : 0;
    score += input.newsSentiment === "mixed" ? 0.05 : 0;
    score += input.breadth === "weak" ? 0.04 : 0;
    score -= Math.abs(r.oneMonth) > 8 ? 0.08 : 0;
  }
  if (input.gelmanRubin > 1.1) score -= 0.08;
  if (input.slem > 0.9) score -= 0.04;
  return round(clamp(score, 0.35, 0.94), 2);
}

function buildConfidenceExplanation(regime, input, score) {
  const r = input.returns || {};
  const reasons = [];
  reasons.push({
    impact: "neutral",
    title: "기준 점수",
    text: "확신도는 중립 기준 58%에서 시작해, 국면별 근거가 맞는지와 충돌 신호가 있는지를 반영해 조정합니다."
  });

  if (regime === "Bull/Calm") {
    reasons.push({
      impact: "plus",
      title: "추세 근거",
      text: `1개월 수익률 ${r.oneMonth}%와 1주 수익률 ${r.oneWeek}%가 Bull/Calm 판단을 지지합니다.`
    });
    reasons.push({
      impact: input.volatility20d <= 26 ? "plus" : "minus",
      title: "변동성",
      text: `20일 변동성 ${input.volatility20d}%는 ${input.volatility20d <= 26 ? "안정 구간" : "완만한 경계 구간"}으로 해석됩니다.`
    });
    reasons.push({
      impact: input.breadth === "strong" ? "plus" : "minus",
      title: "Breadth",
      text: `breadth=${input.breadth} 입니다. ${input.breadth === "strong" ? "시장 확산이 넓어 국면 신뢰도가 올라갑니다." : "확산이 약해 단정하기는 이릅니다."}`
    });
  } else if (regime === "Bear/Crisis") {
    reasons.push({
      impact: "plus",
      title: "하락 압력",
      text: `1개월 수익률 ${r.oneMonth}%와 1주 수익률 ${r.oneWeek}%가 Bear/Crisis 국면을 지지합니다.`
    });
    reasons.push({
      impact: input.volatility20d >= 35 ? "plus" : "minus",
      title: "변동성 급등",
      text: `20일 변동성 ${input.volatility20d}%는 ${input.volatility20d >= 35 ? "위험 확대" : "경계 구간"}으로 읽힙니다.`
    });
    reasons.push({
      impact: input.eventRisk === "high" ? "plus" : "neutral",
      title: "이벤트 리스크",
      text: `이벤트 리스크=${input.eventRisk} 입니다. ${input.eventRisk === "high" ? "방어적 해석을 우선해야 합니다." : "추가 경계 신호는 제한적입니다."}`
    });
  } else {
    reasons.push({
      impact: "plus",
      title: "방향성 혼재",
      text: `1개월 수익률 ${r.oneMonth}%와 1주 수익률 ${r.oneWeek}%가 엇갈려 Transition 판단을 뒷받침합니다.`
    });
    reasons.push({
      impact: input.eventRisk === "high" ? "plus" : "neutral",
      title: "이벤트 리스크",
      text: `이벤트 리스크=${input.eventRisk} 입니다. 변동성 전환 가능성을 열어둬야 합니다.`
    });
    reasons.push({
      impact: input.newsSentiment === "mixed" ? "plus" : "neutral",
      title: "뉴스 심리",
      text: `뉴스 심리=${input.newsSentiment} 입니다. 해석이 엇갈릴 수 있는 전환 구간과 잘 맞습니다.`
    });
    reasons.push({
      impact: r.oneWeek < 0 || input.breadth === "weak" ? "minus" : "neutral",
      title: "확인 신호",
      text: r.oneWeek < 0 || input.breadth === "weak"
        ? `1주 수익률 ${r.oneWeek}% / breadth=${input.breadth}. 단기 확인 신호가 약합니다.`
        : `1주 수익률 ${r.oneWeek}% / breadth=${input.breadth}. 단기 확인 신호는 중립 이상입니다.`
    });
  }

  if (input.gelmanRubin > 1.1) {
    reasons.push({
      impact: "minus",
      title: "모델 불안정",
      text: `Gelman-Rubin=${input.gelmanRubin} 로 1.10을 넘었습니다. 모델 합의가 덜 안정적입니다.`
    });
  }

  if (input.slem > 0.9) {
    reasons.push({
      impact: "minus",
      title: "지표 압박",
      text: `SLEM=${input.slem} 입니다. 상태 전환 압력이 높아 확신도를 낮춥니다.`
    });
  }

  const label = score >= 0.8 ? "높음" : score >= 0.65 ? "보통" : "낮음";
  return {
    label,
    summary: `확신도 점수 근거: ${Math.round(score * 100)}%는 ${label} 수준입니다. 국면의 핵심 근거와 충돌 신호를 함께 반영한 결과입니다.`,
    reasons
  };
}

function strategySet(regime) {
  if (regime === "Bull/Calm") {
    return {
      top: ["Bull Call Spread", "Momentum Call Buy", "Covered Call", "Call Ratio Spread", "Diagonal Call Spread", "Bull Put Spread", "Trend Basket", "Cash-Plus Carry", "Gamma Long"],
      avoid: ["Naked Short Put", "Short Straddle", "Over-hedged Neutralization", "Deep OTM Put Sell", "Event Fade Sell", "Aggressive Mean-Revert"],
      defensive: ["Protective Collar", "Put Spread Hedge"],
      momentum: ["Bull Call Spread", "Trend Basket"],
      carry: ["Covered Call", "Cash-Plus Carry"],
      balanced: ["Diagonal Call Spread", "Bull Put Spread"]
    };
  }
  if (regime === "Bear/Crisis") {
    return {
      top: ["Protective Put", "Put Spread Hedge", "Index Futures Hedge", "Defensive Collar", "Long Gamma Hedge", "Cash Raise", "Volatility Overlay", "Tail Hedge", "Calendar Protection"],
      avoid: ["Naked Short Call", "Naked Short Put", "Short Straddle", "Aggressive Overwrite", "Momentum Chase", "Directional Call Buy"],
      defensive: ["Protective Put", "Put Spread Hedge"],
      momentum: ["Long Gamma Hedge"],
      carry: ["Cash Raise"],
      balanced: ["Defensive Collar"]
    };
  }
  return {
    top: ["Bull Call Spread", "Put Spread Hedge", "Covered Call", "Calendar Spread", "Index Futures Hedge", "Long Gamma Scalping", "Call Ratio Spread", "Protective Collar", "Low-Delta Put Buy"],
    avoid: ["Naked Short Put", "Naked Short Call", "Short Straddle", "Leveraged Trend Chase", "Concentrated Sector Beta", "Aggressive Overwrite"],
    defensive: ["Protective Collar", "Put Spread Hedge"],
    momentum: ["Bull Call Spread", "Call Ratio Spread"],
    carry: ["Covered Call", "Calendar Spread"],
    balanced: ["Protective Collar", "Low-Delta Put Buy"]
  };
}

function buildValidation(regime, input, confidence) {
  let score = 74;
  if (regime === "Bull/Calm") score += 8;
  if (regime === "Bear/Crisis") score -= 6;
  if (input.eventRisk === "high") score -= 4;
  if (input.newsSentiment === "negative") score -= 4;
  if (input.breadth === "weak") score -= 3;
  if (confidence.score >= 0.75) score += 2;
  if (input.tradabilityMaskValid) score += 2;
  score = clamp(Math.round(score), 0, 100);
  const status = score >= 82 ? "PASS" : score >= 66 ? "REVIEW" : "REJECT";
  return {
    status,
    score,
    riskWarning: input.eventRisk === "high"
      ? "이벤트 리스크가 높아 충격 시나리오를 우선 점검해야 합니다."
      : "현재 검증은 안정적이지만 시장 전환 여부를 함께 확인해야 합니다.",
    comment: status === "PASS"
      ? "현재 구조는 통과 가능성이 높습니다."
      : status === "REVIEW"
        ? "핵심 가정은 적절하지만 관찰 후 재검토가 좋습니다."
        : "현 시점에서는 직접 실행보다 보류가 적절합니다."
  };
}

function buildAttribution(regime, input) {
  const volatilityFactor = Math.max(10, input.volatility20d || 20);
  const allocationEffect = regime === "Bull/Calm" ? 42 : regime === "Bear/Crisis" ? 38 : 41;
  const selectionEffect = regime === "Bull/Calm" ? 31 : regime === "Bear/Crisis" ? 28 : 33;
  const interactionEffect = regime === "Bull/Calm" ? 8 : regime === "Bear/Crisis" ? 6 : 7;
  return {
    allocationEffect,
    selectionEffect,
    interactionEffect,
    alphaContribution: round(allocationEffect + selectionEffect - interactionEffect + (100 - volatilityFactor) * 0.05, 1),
    betaContribution: round(volatilityFactor * 0.3, 1),
    updateSignal: regime === "Transition"
      ? "방어형 캐리와 정의된 리스크 구조를 우선 검토"
      : regime === "Bull/Calm"
        ? "방향성 전략 확대 검토"
        : "방어 비중 확대 검토"
  };
}

function buildCommittee(regime, input, confidence, strategy, validation) {
  const recommendation = regime === "Bull/Calm"
    ? "방향성 + 완만한 캐리 확대"
    : regime === "Bear/Crisis"
      ? "방어 우선 + 리스크 축소"
      : "방어형 캐리 + 선택적 상방 구조";
  const keyRisk = input.eventRisk === "high" ? "이벤트 기반 갭 리스크" : "단기 방향성 혼재";
  const backtestSummary = "CAGR 14.8% / Sharpe 1.12 / Max Drawdown -8.4% / Win Rate 57%";
  const comment = regime === "Transition"
    ? "Transition 구간이므로 확신이 높을 때만 방향성 비중을 확대하고, 나머지는 방어형 중심으로 유지하는 편이 좋습니다."
    : regime === "Bull/Calm"
      ? "추세와 변동성의 조합이 우호적입니다. 다만 이벤트 캘린더를 계속 확인해야 합니다."
      : "하락 압력과 변동성 확대가 동시에 보입니다. 방어 우선이 합리적입니다.";

  return {
    recommendation,
    keyRisk,
    backtestSummary,
    comment,
    validation
  };
}

export function analyzeRegime(input) {
  const regimeId = classifyRegime(input);
  const confidenceScore = confidenceFor(regimeId, input);
  const confidence = buildConfidenceExplanation(regimeId, input, confidenceScore);
  const strategy = strategySet(regimeId);
  const validation = buildValidation(regimeId, input, { score: confidenceScore });
  const attribution = buildAttribution(regimeId, input);
  const committee = buildCommittee(regimeId, input, { score: confidenceScore }, strategy, validation);

  return {
    input,
    regime: {
      id: regimeId,
      label: regimeId,
      tone: regimeId === "Bull/Calm" ? "방향성 우위, 변동성 안정"
        : regimeId === "Bear/Crisis" ? "하락 압력, 방어 우선"
          : "방향 불명확, 검토 필요",
      badge: regimeId === "Bull/Calm" ? "BULL_CALM" : regimeId === "Bear/Crisis" ? "BEAR_CRISIS" : "TRANSITION"
    },
    marketInterpretation: regimeId === "Bull/Calm"
      ? "방향성 우위와 안정적 변동성"
      : regimeId === "Bear/Crisis"
        ? "방어 우선과 리스크 축소"
        : "방향성보다 변동성 변화 우선",
    regimeReason: confidence.summary,
    confidence: {
      score: confidenceScore,
      label: confidence.label,
      summary: confidence.summary,
      reasons: confidence.reasons
    },
    strategy,
    validation,
    attribution,
    committee,
    battlePlan: {
      recommendedAction: committee.recommendation,
      expectedOutcome: regimeId === "Transition" ? "프리미엄 수취와 변동성 변화 추적" : "정의된 리스크 하에서 구조적 대응",
      worstCase: "이벤트 충격으로 방어 비중 재조정 필요",
      capitalAllocation: regimeId === "Bear/Crisis" ? "70% 방어 / 20% 현금 / 10% 선택형" : regimeId === "Bull/Calm" ? "50% 방향 / 30% 캐리 / 20% 방어" : "60% 방어 / 30% 캐리 / 10% 상방",
      riskBudget: regimeId === "Bear/Crisis" ? "Low" : regimeId === "Bull/Calm" ? "Medium" : "Medium"
    },
    workflow: ["Observe", "Orient", "Decide", "Act", "Feedback", "Update Signal"],
    committee
  };
}
