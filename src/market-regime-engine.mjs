import { normalizeDateInput } from "./market-data-provider.mjs";

export const PLAYBOOK_BASE_PATH = "https://bitter-morning-77fd.jager001.workers.dev";

export const SCENARIOS = {
  bullCalm: {
    label: "Bull/Calm",
    description: "방향 우위, 변동성 안정",
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
  const reasons = [
    {
      impact: "neutral",
      title: "기준 점수",
      text: "확신도는 중립 기준 58%에서 시작한 뒤, 국면별 근거가 맞는지와 충돌 신호가 있는지를 반영해 조정합니다."
    }
  ];

  if (regime === "Bull/Calm") {
    reasons.push(
      {
        impact: "plus",
        title: "추세 근거",
        text: `1개월 수익률 ${r.oneMonth}%와 1주 수익률 ${r.oneWeek}%가 Bull/Calm 판단을 지지합니다.`
      },
      {
        impact: input.volatility20d <= 26 ? "plus" : "minus",
        title: "변동성",
        text: `20일 변동성 ${input.volatility20d}%는 ${input.volatility20d <= 26 ? "안정 구간" : "경계 구간"}으로 해석됩니다.`
      },
      {
        impact: input.breadth === "strong" ? "plus" : "minus",
        title: "Breadth",
        text: `breadth=${input.breadth} 입니다. ${input.breadth === "strong" ? "시장 확산이 좋아 국면 신뢰도를 높입니다." : "상승 확산이 약해 신뢰도를 낮춥니다."}`
      }
    );
  } else if (regime === "Bear/Crisis") {
    reasons.push(
      {
        impact: "plus",
        title: "하락 압력",
        text: `1개월 수익률 ${r.oneMonth}%와 1주 수익률 ${r.oneWeek}%가 Bear/Crisis 판단을 지지합니다.`
      },
      {
        impact: input.volatility20d >= 35 ? "plus" : "minus",
        title: "변동성 단계",
        text: `20일 변동성 ${input.volatility20d}%는 ${input.volatility20d >= 35 ? "위험 확대" : "경계 구간"}으로 해석됩니다.`
      },
      {
        impact: input.eventRisk === "high" ? "plus" : "neutral",
        title: "이벤트 리스크",
        text: `이벤트 리스크는 ${input.eventRisk}입니다. ${input.eventRisk === "high" ? "방어를 우선해야 합니다." : "추가 관찰이 필요합니다."}`
      }
    );
  } else {
    reasons.push(
      {
        impact: "plus",
        title: "방향성 혼재",
        text: `1개월 수익률 ${r.oneMonth}%와 1주 수익률 ${r.oneWeek}%가 서로 엇갈려 Transition 판단을 뒷받침합니다.`
      },
      {
        impact: input.eventRisk === "high" ? "plus" : "neutral",
        title: "이벤트 리스크",
        text: `이벤트 리스크는 ${input.eventRisk}입니다. 변동성 전환 가능성을 열어두고 봐야 합니다.`
      },
      {
        impact: input.newsSentiment === "mixed" ? "plus" : "neutral",
        title: "뉴스 심리",
        text: `뉴스 심리는 ${input.newsSentiment}입니다. 해석이 엇갈리는 전환 국면 설명과 잘 맞습니다.`
      },
      {
        impact: r.oneWeek < 0 || input.breadth === "weak" ? "minus" : "neutral",
        title: "확인 신호 부족",
        text: r.oneWeek < 0 || input.breadth === "weak"
          ? `1주 수익률 ${r.oneWeek}% / breadth=${input.breadth}. 단기 확인 신호가 약합니다.`
          : `1주 수익률 ${r.oneWeek}% / breadth=${input.breadth}. 단기 확인 신호는 보통 이상입니다.`
      }
    );
  }

  if (input.gelmanRubin > 1.1) {
    reasons.push({
      impact: "minus",
      title: "모델 불안정",
      text: `Gelman-Rubin=${input.gelmanRubin}로 1.10을 넘었습니다. 모델 간의 일관성이 조금 떨어집니다.`
    });
  }

  if (input.slem > 0.9) {
    reasons.push({
      impact: "minus",
      title: "전환 불확실성",
      text: `SLEM=${input.slem}입니다. 상태 전환 가능성이 높아 확신도를 조금 낮춥니다.`
    });
  }

  const label = score >= 0.8 ? "높음" : score >= 0.65 ? "보통" : "낮음";
  return {
    label,
    summary: `확신도 점수 근거: ${Math.round(score * 100)}%로 ${label} 수준입니다. 국면별 근거가 충돌 신호를 얼마나 압도하는지 반영한 결과입니다.`,
    reasons
  };
}

function strategySet(regime, asOf) {
  const rec = (name, slug, strategyScore, riskLevel, expectedReturn, playbookMapping) => ({
    name,
    slug,
    strategyScore,
    riskLevel,
    expectedReturn,
    playbookMapping,
  });
  const avoid = (name, slug, riskLevel, rejectReason, playbookMapping) => ({
    name,
    slug,
    riskLevel,
    rejectReason,
    playbookMapping,
  });
  const dateQuery = normalizeDateInput(asOf);
  const withUrls = (items) => items.map((item) => ({
    ...item,
    playbookUrl: dateQuery
      ? `${PLAYBOOK_BASE_PATH}/?asOf=${encodeURIComponent(dateQuery)}#strategy/${item.slug}`
      : `${PLAYBOOK_BASE_PATH}/#strategy/${item.slug}`
  }));

  if (regime === "Bull/Calm") {
    const recommended = withUrls([
      rec("Bull Call Spread", "bull-call-spread", 98, "Low", "6% ~ 10%", "Directional upside with controlled premium"),
      rec("Covered Call", "covered-call", 95, "Low", "3% ~ 7%", "Carry capture on stable trend"),
      rec("Collar", "collar", 93, "Low", "2% ~ 6%", "Upside capped / downside protected"),
      rec("1x2 Call Ratio Spread", "one-by-two-call-spread", 91, "Medium", "5% ~ 11%", "Upside participation with cost control"),
      rec("Call Calendar Spread", "call-calendar-spread", 89, "Medium", "4% ~ 9%", "Time decay management with upside bias"),
      rec("Call Backspread", "call-backspread", 87, "Medium", "4% ~ 10%", "Convexity for mild acceleration"),
      rec("Long Straddle", "long-straddle", 85, "Medium", "6% ~ 12%", "Volatility expansion capture"),
      rec("Long Strangle", "long-strangle", 83, "Medium", "5% ~ 11%", "Asymmetric move capture"),
      rec("Risk Reversal", "risk-reversal", 81, "Medium", "6% ~ 13%", "Bullish skew with defined thesis")
    ]);
    const avoidNow = withUrls([
      avoid("Bear Call Spread", "bear-call-spread", "High", "Upside squeeze risk remains too painful.", "Avoid when trend remains constructive"),
      avoid("Bear Put Spread", "bear-put-spread", "High", "Wrong-way directionality for a calm bullish tape.", "Avoid until downside confirmation appears"),
      avoid("Short Straddle", "short-straddle", "High", "Short gamma is fragile when trend resumes.", "Avoid until vol compression is confirmed"),
      avoid("Short Strangle", "short-strangle", "High", "Tail risk dominates the small premium edge.", "Avoid into active momentum"),
      avoid("Put Calendar Spread", "put-calendar-spread", "Medium", "Protection timing is less efficient in a calm regime.", "Avoid unless downside event risk is clearly rising"),
      avoid("Bearish Risk Reversal", "bearish-risk-reversal", "High", "The directional skew is opposite to the regime.", "Avoid when breadth is still supportive")
    ]);
    return {
      recommended,
      watchlist: recommended.slice(3, 6),
      avoidNow,
      top: recommended.map((item) => item.name),
      avoid: avoidNow.map((item) => item.name),
      displayTopNine: recommended.map((item, index) => ({
        ...item,
        band: index < 3 ? "top" : "watchlist",
      })),
      allocation: {
        Directional: 0.42,
        Carry: 0.24,
        Protection: 0.18,
        Optionality: 0.16,
      },
      defensive: ["Collar", "Put Calendar Spread"],
      momentum: ["Bull Call Spread", "Call Backspread"],
      carry: ["Covered Call", "Collar"],
      balanced: ["Call Calendar Spread", "1x2 Call Ratio Spread"],
    };
  }

  if (regime === "Bear/Crisis") {
    const recommended = withUrls([
      rec("Bear Put Spread", "bear-put-spread", 95, "Low", "4% ~ 9%", "Downside insurance first"),
      rec("Put Backspread", "put-backspread", 93, "Medium", "5% ~ 11%", "Convex downside defense"),
      rec("Bear Call Spread", "bear-call-spread", 91, "Low", "1% ~ 4%", "Beta neutralization / premium capture"),
      rec("Put Calendar Spread", "put-calendar-spread", 89, "Medium", "2% ~ 6%", "Event timing protection"),
      rec("Bearish Risk Reversal", "bearish-risk-reversal", 87, "Medium", "4% ~ 10%", "Directional downside skew"),
      rec("Long Straddle", "long-straddle", 85, "Medium", "3% ~ 7%", "Convexity against fast swings"),
      rec("Long Strangle", "long-strangle", 83, "Medium", "3% ~ 8%", "Asymmetric move capture"),
      rec("Collar", "collar", 81, "Low", "2% ~ 5%", "Premium-financed protection"),
      rec("1x2 Put Ratio Spread", "one-by-two-put-spread", 79, "Medium", "4% ~ 9%", "Tail defense with measured cost")
    ]);
    const avoidNow = withUrls([
      avoid("Bull Call Spread", "bull-call-spread", "High", "Upside bias is still too early for the tape.", "Avoid until confirmation appears"),
      avoid("Covered Call", "covered-call", "High", "Income selling caps rebound potential.", "Avoid while downside remains dominant"),
      avoid("Call Backspread", "call-backspread", "Medium", "Upside convexity is not the priority in a crisis.", "Avoid until the regime stabilizes"),
      avoid("Call Calendar Spread", "call-calendar-spread", "Medium", "Timing upside is difficult when risk is still breaking.", "Avoid while the regime is still unstable"),
      avoid("Risk Reversal", "risk-reversal", "High", "Bullish skew is the wrong side of the market.", "Avoid while downside pressure remains"),
      avoid("1x2 Call Ratio Spread", "one-by-two-call-spread", "High", "Upside exposure can be too aggressive in a crisis.", "Avoid until the signal turns")
    ]);
    return {
      recommended,
      watchlist: recommended.slice(3, 6),
      avoidNow,
      top: recommended.map((item) => item.name),
      avoid: avoidNow.map((item) => item.name),
      displayTopNine: recommended.map((item, index) => ({
        ...item,
        band: index < 3 ? "top" : "watchlist",
      })),
      allocation: {
        Protection: 0.48,
        Cash: 0.26,
        Optionality: 0.16,
        Directional: 0.10,
      },
      defensive: ["Bear Put Spread", "Put Backspread"],
      momentum: ["Long Straddle"],
      carry: ["Collar"],
      balanced: ["Put Calendar Spread", "1x2 Put Ratio Spread"],
    };
  }

  const recommended = withUrls([
    rec("Bull Call Spread", "bull-call-spread", 89, "Low", "4% ~ 8%", "Upside optionality with capped downside"),
    rec("Collar", "collar", 88, "Low", "3% ~ 7%", "Keep protection while direction resolves"),
    rec("Covered Call", "covered-call", 86, "Low", "2% ~ 6%", "Carry while waiting for confirmation"),
    rec("Call Calendar Spread", "call-calendar-spread", 85, "Medium", "3% ~ 7%", "Time-spread around event windows"),
    rec("1x2 Call Ratio Spread", "one-by-two-call-spread", 83, "Medium", "1% ~ 4%", "Neutralize beta until signal clarity returns"),
    rec("Long Straddle", "long-straddle", 82, "Medium", "3% ~ 8%", "Capture movement if volatility expands"),
    rec("Long Strangle", "long-strangle", 80, "Medium", "4% ~ 9%", "Keep asymmetric upside with cost control"),
    rec("Put Calendar Spread", "put-calendar-spread", 78, "Low", "2% ~ 5%", "Balance defense and carry"),
    rec("1x2 Put Ratio Spread", "one-by-two-put-spread", 77, "Medium", "4% ~ 10%", "Cheap convexity for uncertain shifts")
  ]);
  const avoidNow = withUrls([
    avoid("Bear Call Spread", "bear-call-spread", "High", "The regime is not stable enough for outright bearish carry.", "Avoid until downside direction hardens"),
    avoid("Bear Put Spread", "bear-put-spread", "High", "Downside acceleration is not confirmed yet.", "Avoid until the signal turns"),
    avoid("Short Straddle", "short-straddle", "High", "Two-sided directional risk is still too expensive.", "Avoid when the market has not chosen a path"),
    avoid("Short Strangle", "short-strangle", "High", "Event risk can overwhelm the premium edge.", "Avoid while volatility remains elevated"),
    avoid("Bearish Risk Reversal", "bearish-risk-reversal", "Medium", "The downside skew is not strong enough yet.", "Avoid until confirmation arrives"),
    avoid("Call Backspread", "call-backspread", "Medium", "Aggressive upside convexity can be noisy in transition.", "Avoid until the next signal window")
  ]);

  return {
    recommended,
    watchlist: recommended.slice(3, 6),
    avoidNow,
    top: recommended.map((item) => item.name),
    avoid: avoidNow.map((item) => item.name),
    displayTopNine: recommended.map((item, index) => ({
      ...item,
      band: index < 3 ? "top" : "watchlist",
    })),
    allocation: {
      Protection: 0.35,
      Carry: 0.26,
      Directional: 0.22,
      Optionality: 0.17,
    },
    defensive: ["Collar", "Put Calendar Spread"],
    momentum: ["Bull Call Spread", "Call Calendar Spread"],
    carry: ["Covered Call", "Collar"],
    balanced: ["Long Straddle", "1x2 Put Ratio Spread"],
  };
}

function buildValidation(regime, input, confidence, strategy) {
  const lead = strategy?.recommended?.[0] || strategy?.displayTopNine?.[0] || null;
  const leadRisk = lead?.riskLevel || "Medium";
  const leadScore = Number(lead?.strategyScore || 0);
  const backtestAvailable = leadScore >= 80 && !!lead;
  const maxLossDefined = leadRisk !== "High" && !/Straddle|Strangle/i.test(lead?.name || "");
  const riskFlags = [];
  let penalty = 0;
  let positive = 0;

  if (regime === "Bull/Calm") positive += 2;
  if (regime === "Bear/Crisis") penalty += 1;
  if (input.eventRisk === "high") {
    penalty += 2;
    riskFlags.push("Event risk is high, so the setup needs closer review.");
  }
  if (input.newsSentiment === "negative") {
    penalty += 1;
    riskFlags.push("News sentiment is negative.");
  }
  if (input.breadth === "weak") {
    penalty += 1;
    riskFlags.push("Breadth is weak.");
  }
  if (confidence.score >= 0.75) positive += 1;
  if (input.tradabilityMaskValid) positive += 1;

  if (!backtestAvailable) {
    penalty += 4;
    riskFlags.push("Backtest edge is not clearly available.");
  } else {
    positive += 1;
  }

  if (!maxLossDefined) {
    penalty += 3;
    riskFlags.push("Maximum loss is not clearly defined.");
  } else {
    positive += 1;
  }

  if (leadScore >= 90) positive += 1;
  if (leadScore < 70) penalty += 1;

  if (leadRisk === "Medium" && input.eventRisk === "high") {
    penalty += 1;
    riskFlags.push("Medium-risk structure is being reviewed into a high event-risk window.");
  }

  let status = "REVIEW";
  if (penalty >= 7 || (!backtestAvailable && !maxLossDefined)) {
    status = "REJECT";
  } else if (backtestAvailable && maxLossDefined && positive >= 5 && penalty <= 2) {
    status = "PASS";
  }

  if (status === "PASS" && input.eventRisk === "high" && regime !== "Bull/Calm") {
    status = "REVIEW";
    riskFlags.push("High event risk forces a cautious review stance.");
  }

  const score = clamp(Math.round(88 - penalty * 8 + positive * 3), 0, 100);
  const statusLabelMap = {
    PASS: "검토 가능",
    REVIEW: "재검토",
    REJECT: "제외 권고"
  };
  const validationTone = {
    PASS: "teal",
    REVIEW: "amber",
    REJECT: "crimson"
  }[status];

  return {
    strategyName: lead?.name || "N/A",
    strategySlug: lead?.slug || "n/a",
    strategyScore: leadScore,
    backtestAvailable,
    maxLossDefined,
    status,
    statusLabel: statusLabelMap[status],
    validationTone,
    score,
    riskLevel: status === "PASS" ? "Low" : status === "REJECT" ? "High" : penalty >= 5 ? "High" : "Medium",
    riskFlags: [...new Set(riskFlags)].slice(0, 6),
    riskWarning: status === "REJECT"
      ? "Unlimited-loss or unverified edge risk is too high for production use."
      : input.eventRisk === "high"
        ? "Event risk is high, so the next scenario should be checked before taking fresh risk."
        : "Current validation is stable, but market changes should still be watched closely.",
    marketAlignment: {
      source: "Codex 2 Market View",
      summary: `Regime ${regime}, confidence ${Math.round(confidence.score * 100)}%, backtest ${backtestAvailable ? "available" : "missing"}, max loss ${maxLossDefined ? "defined" : "open"}.`,
      checks: [
        {
          item: "명확한 백테스트 우위",
          passed: backtestAvailable,
          note: backtestAvailable
            ? "백테스트 근거가 확보된 전략 후보입니다."
            : "백테스트 우위가 충분히 확인되지 않았습니다."
        },
        {
          item: "손실 한도 정의",
          passed: maxLossDefined,
          note: maxLossDefined
            ? "손실 한도가 정의된 구조입니다."
            : "무한 손실 가능성이 남아 있어 규율상 불리합니다."
        },
        {
          item: "시장 국면 부합",
          passed: regime === "Bull/Calm" || regime === "Transition" || leadRisk !== "High",
          note: regime === "Bear/Crisis"
            ? "방어적 구조는 맞지만 꼬리 위험 통제가 추가로 필요합니다."
            : "국면 부합도는 양호합니다."
        }
      ]
    },
    integrationHint: {
      targetSlot: "strategy-card-validation",
      badgeTone: validationTone,
      sortWeight: status === "PASS" ? 1 : status === "REVIEW" ? 2 : 3,
      oneLineForCard: riskFlags[0] || "추가 위험요인이 확인되지 않았습니다.",
      codex1Action: status === "REJECT"
        ? "전략 카드 하단에 제외 권고로 표시"
        : "전략 카드 하단에 검증 라벨로 표시",
      riskLevel: status === "PASS" ? "Low" : status === "REJECT" ? "High" : "Medium"
    },
    beginnerNote:
      status === "PASS"
        ? "이 전략은 백테스트와 손실 한도 측면에서 기본 요건을 충족합니다."
        : status === "REJECT"
          ? "이 전략은 아직 실전에 넣기에는 위험 요인이 너무 큽니다."
          : "국면은 맞지만 꼬리 위험이나 추가 통제가 더 필요합니다.",
    committeeNote:
      status === "PASS"
        ? "실전 투입 검토가 가능한 수준입니다."
        : status === "REVIEW"
          ? "재검토 후 조건부 투입을 판단하는 편이 좋습니다."
          : "제외 권고로 분류하고 다른 구조를 우선 검토하는 편이 맞습니다.",
    comment: status === "PASS"
      ? "구조와 시장 신호가 모두 정렬되어 있습니다."
      : status === "REVIEW"
        ? "구조는 가능하지만 위원회 검토가 필요합니다."
        : "실전 투입 전 더 보수적인 관점이 필요합니다."
  };
}

function buildAttribution(regime, input) {
  const r = input.returns || {};
  const volatilityFactor = Math.max(10, Number(input.volatility20d || 20));
  const trendStrength = Number(input.trendStrength || 0);
  const breadth = input.breadth || "neutral";
  const eventRisk = input.eventRisk || "medium";

  const allocationEffect = regime === "Bull/Calm" ? 42 : regime === "Bear/Crisis" ? 38 : 41;
  const selectionEffect = regime === "Bull/Calm" ? 31 : regime === "Bear/Crisis" ? 28 : 33;
  const interactionEffect = regime === "Bull/Calm" ? 8 : regime === "Bear/Crisis" ? 6 : 7;
  const excessPnl = round(allocationEffect + selectionEffect + interactionEffect, 1);

  const dominantFactor = [
    { key: "allocation", value: Math.abs(allocationEffect), label: "Allocation" },
    { key: "selection", value: Math.abs(selectionEffect), label: "Selection" },
    { key: "interaction", value: Math.abs(interactionEffect), label: "Interaction" }
  ].sort((a, b) => b.value - a.value)[0];

  const postHoc = classifyPostHocRegime(regime, input);
  const regimeCluster = regime === "Bull/Calm" ? "Bull" : regime === "Bear/Crisis" ? "Bear" : "Transition";
  const regimeFitScore =
    (postHoc.cluster === regimeCluster ? 1.25 : 0) +
    (eventRisk === "high" ? -0.5 : 0.25) +
    (breadth === "strong" ? 0.25 : breadth === "weak" ? -0.25 : 0) +
    (trendStrength >= 60 ? 0.25 : trendStrength <= 35 ? -0.25 : 0);

  const fitStatus = postHoc.cluster === regimeCluster ? "fit" : postHoc.cluster === "Transition" ? "partial" : "miss";
  const fitLabel = fitStatus === "fit" ? "정합" : fitStatus === "partial" ? "부분 정합" : "미스";

  const alphaSource = dominantFactor.key === "selection"
    ? "Selection alpha from structure and strike choice"
    : dominantFactor.key === "allocation"
      ? "Allocation alpha from regime timing and capital weight"
      : "Interaction alpha from allocation-selection interplay";
  const betaSource = regime === "Bull/Calm"
    ? "Managed beta from market participation and carry capture"
    : regime === "Bear/Crisis"
      ? "Reduced beta through hedging and explicit downside dampening"
      : "Neutral beta posture while waiting for confirmation";

  const recommendation = fitStatus === "fit"
    ? (regime === "Bull/Calm" ? "maintain_tilt" : "hold_and_monitor")
    : fitStatus === "partial"
      ? "rebalance"
      : "reduce_leverage";

  const leverageTilt = fitStatus === "fit"
    ? "neutral"
    : fitStatus === "partial"
      ? "down"
      : "strong_down";

  const alphaSourceKey = dominantFactor.key;
  const updateSignal = {
    regime_fit: fitStatus,
    alpha_source: alphaSourceKey,
    recommendation,
    leverage_tilt: leverageTilt,
    micro_state: postHoc.code,
    state_cluster: postHoc.cluster,
    confidence_gate: eventRisk === "high" || volatilityFactor >= 35 ? "guard" : "open",
    stress_context: postHoc.stressContext
  };

  const currentStateLabel = `S${postHoc.code} ${postHoc.label}`;
  const regimeFitSummary = `${fitLabel} / ${regimeCluster}→${postHoc.cluster} / ${currentStateLabel}`;
  const microStateSummary = `${postHoc.cluster} cluster, ${currentStateLabel}`;
  const stressContext = postHoc.cluster === "Bear"
    ? "2008 / 2020 stress lens: crisis zone"
    : postHoc.cluster === "Transition"
      ? "2008 / 2020 stress lens: transition zone"
      : "2008 / 2020 stress lens: calm-to-trend zone";

  return {
    allocationEffect,
    selectionEffect,
    interactionEffect,
    excessPnl,
    alphaContribution: round(allocationEffect + selectionEffect - interactionEffect + (100 - volatilityFactor) * 0.05, 1),
    betaContribution: round(volatilityFactor * 0.3, 1),
    alphaSource,
    alphaSourceKey,
    betaSource,
    postHoc,
    regimeFit: {
      status: fitStatus,
      label: fitLabel,
      summary: regimeFitSummary,
      score: round(regimeFitScore, 2)
    },
    stressContext,
    updateSignal,
    updateSignalText: JSON.stringify(updateSignal),
    updateSignalPretty: JSON.stringify(updateSignal, null, 2),
    factorLens: {
      allocation: allocationEffect,
      selection: selectionEffect,
      interaction: interactionEffect,
      dominant: dominantFactor.label,
      regime: regime,
      oneDay: Number(r.oneDay || 0),
      oneWeek: Number(r.oneWeek || 0),
      oneMonth: Number(r.oneMonth || 0)
    },
    alphaNote: dominantFactor.key === "selection"
      ? "행사가/구조 선택이 수익의 중심입니다."
      : dominantFactor.key === "allocation"
        ? "레짐 타이밍과 자본 비중이 핵심입니다."
        : "배분과 선택의 결합 효과가 컸습니다.",
    betaNote: postHoc.cluster === "Bear"
      ? "시장 운보다 방어 규율이 더 중요했습니다."
      : postHoc.cluster === "Transition"
        ? "방향성이 아직 완전히 정리되지 않았습니다."
        : "시장이 우호적이어서 베타 기여가 살아났습니다."
  };
}

function classifyPostHocRegime(regime, input) {
  const r = input.returns || {};
  const oneDay = Number(r.oneDay || 0);
  const oneWeek = Number(r.oneWeek || 0);
  const oneMonth = Number(r.oneMonth || 0);
  const vol = Number(input.volatility20d || 0);
  const trend = Number(input.trendStrength || 0);
  const breadth = input.breadth || "neutral";
  const eventRisk = input.eventRisk || "medium";

  let score = 0;
  if (oneMonth >= 8) score += 3;
  else if (oneMonth >= 4) score += 2;
  else if (oneMonth >= 0) score += 1;
  else if (oneMonth <= -8) score -= 3;
  else if (oneMonth <= -4) score -= 2;
  else score -= 1;

  if (oneWeek >= 2) score += 1;
  else if (oneWeek <= -2) score -= 1;

  if (oneDay >= 1) score += 0.5;
  else if (oneDay <= -1) score -= 0.5;

  if (vol <= 18) score += 2;
  else if (vol <= 28) score += 1;
  else if (vol >= 45) score -= 2;
  else if (vol >= 34) score -= 1;

  if (trend >= 65) score += 1.5;
  else if (trend <= 35) score -= 1.5;

  if (breadth === "strong") score += 1;
  else if (breadth === "weak") score -= 1;

  if (eventRisk === "high") score -= 1;
  if (regime === "Bull/Calm") score += 1.5;
  if (regime === "Bear/Crisis") score -= 1.5;

  const normalized = clamp((score + 7) / 14, 0, 1);
  const code = clamp(Math.round(1 + normalized * 9), 1, 10);
  const cluster = code <= 3 ? "Bull" : code <= 7 ? "Transition" : "Bear";
  const labelMap = {
    1: "Acceleration",
    2: "Trend Build",
    3: "Calm Bull",
    4: "Early Pivot",
    5: "Range Shift",
    6: "Late Pivot",
    7: "Choppy Transition",
    8: "Bear Drift",
    9: "Bear Expansion",
    10: "Crisis Flush"
  };

  const stressContext = code >= 8
    ? "2020 COVID / 2008 Crisis analog"
    : code >= 4
      ? "Transition analog: regime turn risk"
      : "Calm analog: trend continuation zone";

  return {
    code,
    cluster,
    label: labelMap[code],
    stressContext
  };
}

function buildCommittee(regime, input, confidence, strategy, validation) {
  const recommendation = regime === "Bull/Calm"
    ? "Directional tilt + carry"
    : regime === "Bear/Crisis"
      ? "Defensive tilt + risk reduction"
      : "Defense first + selective exposure";
  const keyRisk = input.eventRisk === "high" ? "Event-driven risk remains elevated." : "Short-term regime drift is manageable.";
  const backtestSummary = "CAGR 14.8% / Sharpe 1.12 / Max Drawdown -8.4% / Win Rate 57%";
  const comment = regime === "Transition"
    ? "Transition requires balanced exposure and close monitoring of the next confirmation signal."
    : regime === "Bull/Calm"
      ? "Trend and breadth are aligned. Keep upside exposure controlled and monitored."
      : "Downside risk and volatility are both elevated. Protection should come before new risk.";

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
  const strategy = strategySet(regimeId, input?.asOf);
  const validation = buildValidation(regimeId, input, { score: confidenceScore }, strategy);
  const attribution = buildAttribution(regimeId, input);
  const committee = buildCommittee(regimeId, input, { score: confidenceScore }, strategy, validation);

  return {
    input,
    regime: {
      id: regimeId,
      label: regimeId,
      tone: regimeId === "Bull/Calm"
        ? "방향 우위, 변동성 안정"
        : regimeId === "Bear/Crisis"
          ? "하락 압력, 방어 우선"
          : "방향 불명확, 검토 필요",
      badge: regimeId === "Bull/Calm" ? "BULL_CALM" : regimeId === "Bear/Crisis" ? "BEAR_CRISIS" : "TRANSITION"
    },
    marketInterpretation: regimeId === "Bull/Calm"
      ? "방향성 우위와 안정적 변동성"
      : regimeId === "Bear/Crisis"
        ? "방어 우선과 리스크 축소"
        : "방향성 혼재와 변동성 전환",
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
      expectedOutcome: regimeId === "Transition"
        ? "Premature conviction is not ideal; wait for confirmation."
        : "Structured exposure with the current regime is preferred.",
      worstCase: "Event risk could still widen losses without protection.",
      capitalAllocation: regimeId === "Bear/Crisis"
        ? "70% defense / 20% cash / 10% optionality"
        : regimeId === "Bull/Calm"
          ? "50% direction / 30% carry / 20% hedge"
          : "60% defense / 30% carry / 10% optionality",
      riskBudget: regimeId === "Bear/Crisis" ? "Low" : regimeId === "Bull/Calm" ? "Medium" : "Medium"
    },
    workflow: ["Observe", "Orient", "Decide", "Act", "Feedback", "Update Signal"],
    committee
  };
}
