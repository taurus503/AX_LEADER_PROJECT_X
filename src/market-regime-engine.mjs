export const SCENARIOS = {
  bullCalm: {
    label: "Bull/Calm 예시",
    symbol: "KOSPI200",
    asOf: "2026-06-12",
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
    label: "Bear/Crisis 예시",
    symbol: "KOSPI200",
    asOf: "2026-06-12",
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
    label: "Transition 예시",
    symbol: "KOSPI200",
    asOf: "2026-06-12",
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

const REGIME_META = {
  "Bull/Calm": {
    tone: "방향성 우위, 변동성 안정",
    behavior: "추세 추종형 전략 후보를 우선 검토",
    badge: "BULL_CALM"
  },
  "Bear/Crisis": {
    tone: "하락 압력, 변동성 확대",
    behavior: "방어적 전략과 현금 비중을 우선 검토",
    badge: "BEAR_CRISIS"
  },
  Transition: {
    tone: "방향 불명확, 이벤트 민감도 확대",
    behavior: "낮은 노출과 추가 검토 메시지를 우선",
    badge: "TRANSITION"
  },
  "Fail-Safe": {
    tone: "입력 데이터 또는 거래 가능성 검증 필요",
    behavior: "위험자산 검토를 중단하고 현금 100% 가정",
    badge: "FAIL_SAFE"
  }
};

const TOP_STRATEGIES = {
  "Bull/Calm": [
    "완만한 콜 스프레드 검토",
    "저변동 추세 추종형 합성전략 검토",
    "보유 델타 유지 후보 점검"
  ],
  "Bear/Crisis": [
    "현금 및 헤지 우선 검토",
    "보호적 풋 스프레드 후보 점검",
    "손실 제한형 저노출 전략 검토"
  ],
  Transition: [
    "방향성 노출 축소 후보 검토",
    "이벤트 통과 후 재분류 대기",
    "낮은 베가·낮은 델타 전략 후보 점검"
  ],
  "Fail-Safe": [
    "위험자산 신규 검토 보류",
    "입력 데이터 재검증",
    "담당자 승인 후 재실행"
  ]
};

const AVOID_STRATEGIES = {
  "Bull/Calm": [
    "과도한 하방 헤지 비용 지출",
    "짧은 구간 역추세 베팅",
    "이벤트 리스크 무시한 고레버리지"
  ],
  "Bear/Crisis": [
    "무헤지 방향성 매수",
    "고감마 단기 집중 전략",
    "유동성 낮은 합성전략 확대"
  ],
  Transition: [
    "강한 방향성 단정",
    "이벤트 전 고레버리지 진입",
    "근거 없는 변동성 매도 확대"
  ],
  "Fail-Safe": [
    "자동 전략 실행",
    "데이터 검증 전 보고 확정",
    "거래 가능성 미확인 자산 편입"
  ]
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round(value, digits = 2) {
  const multiplier = 10 ** digits;
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

function isFiniteInput(input) {
  const values = [
    input?.returns?.oneDay,
    input?.returns?.oneWeek,
    input?.returns?.oneMonth,
    input?.volatility20d,
    input?.trendStrength,
    input?.slem,
    input?.gelmanRubin
  ];
  return values.every(Number.isFinite);
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
    text: "확신도는 중립 기준 58%에서 시작한 뒤, 국면별 근거가 맞는지와 충돌 신호가 있는지를 반영해 조정합니다."
  });

  if (regime === "Bull/Calm") {
    reasons.push({
      impact: "plus",
      title: "추세 근거",
      text: `1개월 수익률 ${r.oneMonth}%와 1주 수익률 ${r.oneWeek}%가 Bull/Calm 판단을 뒷받침합니다.`
    });
    reasons.push({
      impact: input.volatility20d <= 26 ? "plus" : "minus",
      title: "변동성 확인",
      text: `20일 변동성은 ${input.volatility20d}%입니다. ${input.volatility20d <= 26 ? "안정 국면 판단에 우호적입니다." : "안정 국면이라고 보기에는 부담 요인입니다."}`
    });
    reasons.push({
      impact: input.breadth === "strong" ? "plus" : "minus",
      title: "시장 폭 확인",
      text: `breadth는 ${input.breadth}입니다. ${input.breadth === "strong" ? "상승 참여가 넓어 Bull/Calm 확신도를 높입니다." : "상승 참여가 충분히 넓지 않아 확신도를 낮춥니다."}`
    });
  } else if (regime === "Bear/Crisis") {
    reasons.push({
      impact: "plus",
      title: "하락 압력",
      text: `1개월 수익률 ${r.oneMonth}%와 1주 수익률 ${r.oneWeek}%가 방어적 Bear/Crisis 판단을 뒷받침합니다.`
    });
    reasons.push({
      impact: input.volatility20d >= 35 ? "plus" : "minus",
      title: "변동성 스트레스",
      text: `20일 변동성은 ${input.volatility20d}%입니다. ${input.volatility20d >= 35 ? "위기 국면 확신도를 높이는 요인입니다." : "위기 국면으로 단정하기에는 약한 요인입니다."}`
    });
    reasons.push({
      impact: input.eventRisk === "high" ? "plus" : "neutral",
      title: "이벤트 리스크",
      text: `이벤트 리스크는 ${input.eventRisk}입니다. ${input.eventRisk === "high" ? "방어적 판단의 확신도를 높입니다." : "추가적인 위기 프리미엄은 크지 않습니다."}`
    });
  } else {
    const mixedDirection = Math.sign(r.oneMonth || 0) !== Math.sign(r.oneWeek || 0) || r.oneWeek < 0;
    reasons.push({
      impact: "plus",
      title: mixedDirection ? "방향성 혼재" : "강한 추세와 전환 위험",
      text: mixedDirection
        ? `1개월 수익률은 ${r.oneMonth}%지만 1주 수익률은 ${r.oneWeek}%입니다. 장단기 방향이 엇갈려 Transition 판단을 뒷받침합니다.`
        : `1개월 수익률 ${r.oneMonth}%와 1주 수익률 ${r.oneWeek}%는 강하지만, 변동성과 이벤트 리스크가 함께 높아 추세 지속보다 전환 위험을 같이 봐야 합니다.`
    });
    reasons.push({
      impact: input.eventRisk === "high" ? "plus" : "neutral",
      title: "이벤트 리스크",
      text: `이벤트 리스크는 ${input.eventRisk}입니다. ${input.eventRisk === "high" ? "이벤트 전후 국면 전환 가능성을 높입니다." : "국면 전환 확신도를 크게 높이지는 않습니다."}`
    });
    reasons.push({
      impact: input.newsSentiment === "mixed" ? "plus" : "neutral",
      title: "뉴스 심리",
      text: `뉴스 심리는 ${input.newsSentiment}입니다. ${input.newsSentiment === "mixed" ? "해석이 엇갈리는 전환 국면 설명과 잘 맞습니다." : "전환 국면 설명과 일부만 맞습니다."}`
    });
    reasons.push({
      impact: r.oneWeek < 0 || input.breadth === "weak" ? "minus" : "neutral",
      title: "확인 신호 부족",
      text: r.oneWeek < 0 || input.breadth === "weak"
        ? `1주 수익률은 ${r.oneWeek}%, breadth는 ${input.breadth}입니다. 단기 확인 신호가 약해 하나의 국면으로 단정하는 확신도는 낮아집니다.`
        : `1주 수익률은 ${r.oneWeek}%, breadth는 ${input.breadth}입니다. 단기 확인 신호는 양호하지만 다른 리스크 요인 때문에 중립적으로 반영합니다.`
    });
    reasons.push({
      impact: Math.abs(r.oneMonth) > 8 ? "minus" : "neutral",
      title: "1개월 급등락",
      text: `1개월 변동폭은 ${r.oneMonth}%입니다. 움직임이 너무 크면 전환 국면보다 명확한 추세 또는 스트레스 국면처럼 보일 수 있어 Transition 확신도를 낮춥니다.`
    });
  }

  if (input.gelmanRubin > 1.1) {
    reasons.push({
      impact: "minus",
      title: "모델 상태",
      text: `Gelman-Rubin 값이 ${input.gelmanRubin}로 1.10을 넘었습니다. 모델 재점검 필요 신호이므로 확신도를 낮춥니다.`
    });
  }

  if (input.slem > 0.9) {
    reasons.push({
      impact: "minus",
      title: "수렴 속도",
      text: `SLEM 값이 ${input.slem}입니다. 수렴이 느린 상태로 해석되어 확신도를 낮춥니다.`
    });
  }

  const label = score >= 0.8 ? "높음" : score >= 0.65 ? "보통" : "낮음";
  return {
    summary: `확신도 점수 근거: ${Math.round(score * 100)}%는 ${label} 수준입니다. 국면을 뒷받침하는 신호에서 충돌 신호와 모델 상태 부담을 차감해 계산했습니다.`,
    reasons
  };
}

function allocationFor(regime) {
  if (regime === "Bull/Calm") {
    return {
      "Directional_Call_Spread": 0.38,
      "Trend_Following_Basket": 0.32,
      "Hedge_Buffer": 0.1,
      Cash: 0.2
    };
  }
  if (regime === "Bear/Crisis") {
    return {
      "Protective_Put_Spread": 0.18,
      "Low_Exposure_Hedge": 0.12,
      "Event_Risk_Buffer": 0.05,
      Cash: 0.65
    };
  }
  if (regime === "Transition") {
    return {
      "Low_Delta_Review": 0.22,
      "Event_Waiting_Basket": 0.18,
      "Hedge_Buffer": 0.15,
      Cash: 0.45
    };
  }
  return { Cash: 1 };
}

function transitionMatrixFor(regime) {
  const templates = {
    "Bull/Calm": [
      [0.78, 0.06, 0.16],
      [0.08, 0.74, 0.18],
      [0.19, 0.14, 0.67]
    ],
    "Bear/Crisis": [
      [0.66, 0.14, 0.2],
      [0.04, 0.83, 0.13],
      [0.12, 0.28, 0.6]
    ],
    Transition: [
      [0.63, 0.11, 0.26],
      [0.1, 0.64, 0.26],
      [0.22, 0.2, 0.58]
    ],
    "Fail-Safe": [
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1]
    ]
  };
  return templates[regime];
}

function buildEvidence(regime, input) {
  if (regime === "Fail-Safe") {
    return [
      "입력값 또는 Tradability Mask가 유효하지 않아 자동 검토를 중단했습니다.",
      "첨부 기준의 Global Fail-Safe Override에 따라 위험자산은 0으로 가정합니다.",
      "담당자 검증 후 재실행해야 보고서 초안으로 사용할 수 있습니다."
    ];
  }

  return [
    `1개월 수익률 ${input.returns.oneMonth}% / 1주 수익률 ${input.returns.oneWeek}%로 방향성을 점검했습니다.`,
    `20일 실현변동성 ${input.volatility20d}%와 이벤트 리스크 ${input.eventRisk}를 함께 반영했습니다.`,
    `breadth는 ${input.breadth}, 뉴스 심리는 ${input.newsSentiment}로 판단 근거를 보강했습니다.`
  ];
}

function buildEvidenceV2(regime, input) {
  if (regime === "Fail-Safe") {
    return [
      "입력값 또는 Tradability Mask가 유효하지 않아 자동 검토를 중단했습니다.",
      "첨부 기준의 Global Fail-Safe Override에 따라 위험자산은 0으로 가정합니다.",
      "담당자 검증 후 재실행해야 보고서 초안으로 사용할 수 있습니다."
    ];
  }

  const newsEvidence = input.newsContext?.keywords?.length
    ? `뉴스/리포트 Top3 키워드는 ${input.newsContext.keywords.slice(0, 5).join(", ")}이며, 뉴스 심리는 ${input.newsContext.sentiment}로 반영했습니다.`
    : `breadth는 ${input.breadth}, 뉴스 심리는 ${input.newsSentiment}로 판단 근거를 보강했습니다.`;

  return [
    `1개월 수익률 ${input.returns.oneMonth}% / 1주 수익률 ${input.returns.oneWeek}%로 방향성을 점검했습니다.`,
    `20일 실현변동성 ${input.volatility20d}%와 이벤트 리스크 ${input.eventRisk}를 함께 반영했습니다.`,
    newsEvidence
  ];
}

function buildReport(regime, confidence, input) {
  if (regime === "Fail-Safe") {
    return {
      headline: "데이터 검증 필요",
      committeeSummary:
        "Fail-Safe가 작동했습니다. 입력 데이터 또는 거래 가능성 검증이 필요하므로 자동 전략 검토를 중단하고 담당자 상담 및 재검증 후 보고서 확정이 필요합니다.",
      onePageBrief:
        "현재 결과는 투자위원회 확정 보고서가 아니라 검증 요청 초안입니다. 데이터 상태, 기준일, Tradability Mask를 먼저 확인해야 합니다."
    };
  }

  const fragments = {
    "Bull/Calm":
      "현재 시장은 Bull/Calm 국면으로 분류됩니다. 방향성은 우호적이고 변동성은 상대적으로 안정되어 있으나, 전략 후보는 검토 우선순위로만 활용해야 합니다.",
    "Bear/Crisis":
      "현재 시장은 Bear/Crisis 국면으로 분류됩니다. 하락 압력과 변동성 확대가 함께 관찰되어 방어 전략, 현금 비중, 리스크 축소 검토가 우선입니다.",
    Transition:
      "현재 시장은 Transition 국면으로 분류됩니다. 방향성보다 이벤트 이후 변동성 변화와 국면 재분류 여부를 먼저 검토해야 합니다."
  };

  return {
    headline: `${regime} 국면, 확신도 ${Math.round(confidence * 100)}%`,
    committeeSummary: fragments[regime],
    onePageBrief:
      `${input.asOf} 기준 ${input.symbol}의 30일 윈도우 데이터를 바탕으로 ${regime} 국면을 제시합니다. 본 결과는 투자판단이 아니라 검토 포인트와 근거 정리용 초안입니다.`
  };
}

function telemetryFor(input) {
  const spectralGap = round(1 - input.slem, 3);
  return {
    rollingWindow: 30,
    standardization: "Cross-sectional Z-score",
    turnoverPenaltyBps: 5,
    gelmanRubin: input.gelmanRubin,
    slem: input.slem,
    spectralGap,
    retrainingFlag: input.gelmanRubin > 1.1,
    convergenceFlag:
      input.slem > 0.9 ? "Slow mix intervention review" : "Within demo tolerance"
  };
}

export function analyzeRegime(input) {
  if (!isFiniteInput(input) || input.tradabilityMaskValid !== true) {
    const regime = "Fail-Safe";
    const allocation = allocationFor(regime);
    return {
      asOf: input?.asOf || "",
      symbol: input?.symbol || "KOSPI200",
      newsContext: input?.newsContext || null,
      regime: { id: regime, ...REGIME_META[regime] },
      confidence: {
        score: 0,
        label: "검증 필요",
        summary: "확신도 점수 근거: Fail-Safe가 작동해 국면 판단을 중단했으므로 0%로 표시합니다.",
        reasons: [
          {
            impact: "minus",
            title: "Fail-Safe",
            text: "입력 데이터 또는 Tradability Mask 검증에 실패했습니다. 데이터와 거래 가능성이 확인될 때까지 확신도는 0%입니다."
          }
        ]
      },
      evidence: buildEvidenceV2(regime, input || {}),
      strategy: {
        top: TOP_STRATEGIES[regime],
        avoid: AVOID_STRATEGIES[regime],
        advisorMessage: "Option Playbook Advisor 연계 전 담당자 검증이 필요합니다."
      },
      allocation: { method: "Fail-safe cash override", weights: allocation },
      constraints: {
        sumOfWeights: 1,
        tradabilityMaskCompliance: false,
        simplexIntegrity: true
      },
      transitionProbabilityMatrix: transitionMatrixFor(regime),
      telemetry: {
        rollingWindow: 30,
        standardization: "Cross-sectional Z-score",
        turnoverPenaltyBps: 5,
        retrainingFlag: true,
        convergenceFlag: "Input validation failed"
      },
      report: buildReport(regime, 0, input || {})
    };
  }

  const regime = classifyRegime(input);
  const confidence = confidenceFor(regime, input);
  const confidenceExplanation = buildConfidenceExplanation(regime, input, confidence);
  const allocation = allocationFor(regime);
  const sumOfWeights = round(Object.values(allocation).reduce((sum, value) => sum + value, 0), 2);

  return {
    asOf: input.asOf,
    symbol: input.symbol,
    newsContext: input.newsContext || null,
    regime: { id: regime, ...REGIME_META[regime] },
    confidence: {
      score: confidence,
      label: confidence >= 0.8 ? "높음" : confidence >= 0.65 ? "보통" : "낮음",
      ...confidenceExplanation
    },
    evidence: buildEvidenceV2(regime, input),
    strategy: {
      top: TOP_STRATEGIES[regime],
      avoid: AVOID_STRATEGIES[regime],
      advisorMessage:
        "Option Playbook Advisor에는 국면, 확신도, 이벤트 리스크를 함께 전달해 전략 후보와 회피 후보를 구분합니다."
    },
    allocation: {
      method: "Demo Dirichlet-style simplex weights",
      weights: allocation
    },
    constraints: {
      sumOfWeights,
      tradabilityMaskCompliance: input.tradabilityMaskValid === true,
      simplexIntegrity: sumOfWeights === 1
    },
    transitionProbabilityMatrix: transitionMatrixFor(regime),
    telemetry: telemetryFor(input),
    report: buildReport(regime, confidence, input)
  };
}
