import { getMarketSnapshot, type MarketSnapshot, type RegimeKey } from "./market";

export const PLAYBOOK_BASE_PATH =
  "https://bitter-morning-77fd.jager001.workers.dev";

export type MarketBias = "bull" | "bear" | "neutral";
export type VolRegime = "high" | "mid" | "low";
export type EventRisk = "high" | "medium" | "low";
export type Conviction = "high" | "medium" | "low";
export type RecommendationBand = "top" | "watchlist" | "avoid";

export interface AdvisorInputOverride {
  selectedDate?: string;
  regimeKey?: RegimeKey;
  regimeSubtitle?: string;
  volScore?: number;
  skewScore?: number;
  confidence?: number;
  eventRisk?: EventRisk;
  sourceLabel?: string;
  codex2Brief?: string;
}

export interface AdvisorState {
  regimeKey: RegimeKey;
  regimeLabel: string;
  regimeSubtitle: string;
  marketBias: MarketBias;
  volRegime: VolRegime;
  eventRisk: EventRisk;
  conviction: Conviction;
  volScore: number;
  skewScore: number;
  confidence: number;
}

export interface ThemeItem {
  title: string;
  date: string;
  url: string;
  keywords: string[];
  source?: string;
}

export interface StrategyTemplate {
  slug: string;
  title: string;
  category: string;
  bias: MarketBias | "neutral";
  vol: "buy" | "sell" | "mixed";
  risk: "defined" | "tail";
  eventFit: "high" | "medium" | "low";
  cost: "low" | "medium" | "high" | "credit" | "income";
  summary: string;
}

export interface ScoredStrategy extends StrategyTemplate {
  score: number;
  band: RecommendationBand;
  rank: number;
  reasons: string[];
  cautions: string[];
  playbookUrl: string;
}

export interface AdvisorSnapshot {
  source: string;
  generatedAt: string;
  selectedDate: string;
  actualDate: string;
  market: MarketSnapshot;
  state: AdvisorState;
  headlineThemes: ThemeItem[];
  reportThemes: ThemeItem[];
  topRecommended: ScoredStrategy[];
  watchlist: ScoredStrategy[];
  avoidNow: ScoredStrategy[];
  displayTopNine: ScoredStrategy[];
  rationale: string[];
  validationNotes: string[];
  opsNotes: string[];
  committeeBrief: string;
  playbookBasePath: string;
  codex2Brief: string | null;
}

const STRATEGY_CATALOG: StrategyTemplate[] = [
  {
    slug: "bull-call-spread",
    title: "Bull Call Spread",
    category: "Directional",
    bias: "bull",
    vol: "buy",
    risk: "defined",
    eventFit: "medium",
    cost: "medium",
    summary: "완만한 상승과 손실 제한을 동시에 노리는 기본 강세 구조입니다.",
  },
  {
    slug: "bull-put-spread",
    title: "Bull Put Spread",
    category: "Directional",
    bias: "bull",
    vol: "sell",
    risk: "defined",
    eventFit: "low",
    cost: "credit",
    summary: "상승/횡보 구간에서 프리미엄을 받는 보수형 강세 구조입니다.",
  },
  {
    slug: "bear-put-spread",
    title: "Bear Put Spread",
    category: "Directional",
    bias: "bear",
    vol: "buy",
    risk: "defined",
    eventFit: "medium",
    cost: "medium",
    summary: "하락 가능성을 제한된 손실로 표현하는 약세 구조입니다.",
  },
  {
    slug: "bear-call-spread",
    title: "Bear Call Spread",
    category: "Directional",
    bias: "bear",
    vol: "sell",
    risk: "defined",
    eventFit: "low",
    cost: "credit",
    summary: "상방 제한 뷰에서 크레딧을 확보하는 약세 구조입니다.",
  },
  {
    slug: "risk-reversal",
    title: "Risk Reversal",
    category: "Directional",
    bias: "bull",
    vol: "mixed",
    risk: "tail",
    eventFit: "high",
    cost: "low",
    summary: "강세 뷰를 저비용으로 표현하지만 하단 tail risk를 동반합니다.",
  },
  {
    slug: "bearish-risk-reversal",
    title: "Bearish Risk Reversal",
    category: "Directional",
    bias: "bear",
    vol: "mixed",
    risk: "tail",
    eventFit: "high",
    cost: "low",
    summary: "약세 방향을 낮은 비용으로 구현하는 비대칭 구조입니다.",
  },
  {
    slug: "long-straddle",
    title: "Long Straddle",
    category: "Volatility",
    bias: "neutral",
    vol: "buy",
    risk: "defined",
    eventFit: "high",
    cost: "high",
    summary: "방향보다 변동성 확대 자체에 베팅하는 대표 구조입니다.",
  },
  {
    slug: "long-strangle",
    title: "Long Strangle",
    category: "Volatility",
    bias: "neutral",
    vol: "buy",
    risk: "defined",
    eventFit: "high",
    cost: "medium",
    summary: "변동성 확대를 저렴하게 추종하는 넓은 범위 구조입니다.",
  },
  {
    slug: "call-backspread",
    title: "Call Backspread",
    category: "Volatility",
    bias: "bull",
    vol: "buy",
    risk: "defined",
    eventFit: "high",
    cost: "medium",
    summary: "급등과 변동성 확장에 유리한 상방 볼록성 구조입니다.",
  },
  {
    slug: "put-backspread",
    title: "Put Backspread",
    category: "Volatility",
    bias: "bear",
    vol: "buy",
    risk: "defined",
    eventFit: "high",
    cost: "medium",
    summary: "급락과 변동성 확대를 동시에 겨냥하는 하방 볼록성 구조입니다.",
  },
  {
    slug: "short-straddle",
    title: "Short Straddle",
    category: "Income",
    bias: "neutral",
    vol: "sell",
    risk: "tail",
    eventFit: "low",
    cost: "credit",
    summary: "강한 횡보를 전제로 하는 프리미엄 수취 구조입니다.",
  },
  {
    slug: "short-strangle",
    title: "Short Strangle",
    category: "Income",
    bias: "neutral",
    vol: "sell",
    risk: "tail",
    eventFit: "low",
    cost: "credit",
    summary: "넓은 범위 횡보를 전제로 하는 보수적 프리미엄 구조입니다.",
  },
  {
    slug: "iron-condor",
    title: "Iron Condor",
    category: "Income",
    bias: "neutral",
    vol: "sell",
    risk: "defined",
    eventFit: "medium",
    cost: "credit",
    summary: "정의된 손실 범위 안에서 횡보 프리미엄을 노리는 구조입니다.",
  },
  {
    slug: "iron-butterfly",
    title: "Iron Butterfly",
    category: "Income",
    bias: "neutral",
    vol: "sell",
    risk: "defined",
    eventFit: "low",
    cost: "credit",
    summary: "중심값 주변의 좁은 횡보를 노리는 고집중 프리미엄 구조입니다.",
  },
  {
    slug: "call-calendar-spread",
    title: "Call Calendar Spread",
    category: "Time Structure",
    bias: "bull",
    vol: "mixed",
    risk: "defined",
    eventFit: "medium",
    cost: "medium",
    summary: "만기 구조 차이를 활용해 완만한 상승을 추종하는 구조입니다.",
  },
  {
    slug: "put-calendar-spread",
    title: "Put Calendar Spread",
    category: "Time Structure",
    bias: "bear",
    vol: "mixed",
    risk: "defined",
    eventFit: "medium",
    cost: "medium",
    summary: "만기 구조 차이를 활용해 완만한 하락을 추종하는 구조입니다.",
  },
  {
    slug: "covered-call",
    title: "Covered Call",
    category: "Income",
    bias: "bull",
    vol: "sell",
    risk: "tail",
    eventFit: "low",
    cost: "income",
    summary: "현물 상방 일부를 포기하고 프리미엄 수익을 얻는 구조입니다.",
  },
  {
    slug: "collar",
    title: "Collar",
    category: "Hedge",
    bias: "bull",
    vol: "mixed",
    risk: "defined",
    eventFit: "high",
    cost: "low",
    summary: "상방 일부를 양보하고 하방을 방어하는 보수형 보호 구조입니다.",
  },
  {
    slug: "one-by-two-call-spread",
    title: "1x2 Call Ratio Spread",
    category: "Ratio",
    bias: "bull",
    vol: "mixed",
    risk: "tail",
    eventFit: "medium",
    cost: "low",
    summary: "목표 구간의 효율은 높지만 상단 과속 시 tail risk가 커집니다.",
  },
  {
    slug: "one-by-two-put-spread",
    title: "1x2 Put Ratio Spread",
    category: "Ratio",
    bias: "bear",
    vol: "mixed",
    risk: "tail",
    eventFit: "medium",
    cost: "low",
    summary: "하락 목표 구간의 효율은 높지만 급락 tail risk가 큽니다.",
  },
];

function googleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function absBand(value: number): EventRisk {
  const magnitude = Math.abs(value);
  if (magnitude >= 45) return "high";
  if (magnitude >= 20) return "medium";
  return "low";
}

function determineMarketBias(market: MarketSnapshot): MarketBias {
  if (market.change21d >= 4 || market.change5d >= 2 || market.change1d >= 0.5) {
    return "bull";
  }

  if (market.change21d <= -4 || market.change5d <= -2 || market.change1d <= -0.5) {
    return "bear";
  }

  return "neutral";
}

function determineVolRegime(market: MarketSnapshot, volScore: number): VolRegime {
  if (market.realizedVol20 >= 28 || Math.abs(volScore) >= 55) return "high";
  if (market.realizedVol20 <= 18 || Math.abs(volScore) <= 20) return "low";
  return "mid";
}

function determineEventRisk(
  market: MarketSnapshot,
  confidence: number,
  volScore: number,
  skewScore: number,
): EventRisk {
  if (
    confidence < 35 ||
    Math.abs(volScore) >= 45 ||
    Math.abs(skewScore) >= 45 ||
    Math.abs(market.change1d) >= 2.5
  ) {
    return "high";
  }

  if (confidence < 65 || Math.abs(volScore) >= 25 || Math.abs(skewScore) >= 25) {
    return "medium";
  }

  return "low";
}

function determineConviction(confidence: number): Conviction {
  if (confidence >= 70) return "high";
  if (confidence >= 40) return "medium";
  return "low";
}

function regimeLabelFromKey(regimeKey: RegimeKey): { label: string; subtitle: string } {
  switch (regimeKey) {
    case "regime_1":
      return { label: "Regime 1", subtitle: "Put skew / High vol" };
    case "regime_2":
      return { label: "Regime 2", subtitle: "Call skew / High vol" };
    case "regime_3":
      return { label: "Regime 3", subtitle: "Put skew / Low vol" };
    case "regime_4":
    default:
      return { label: "Regime 4", subtitle: "Call skew / Low vol" };
  }
}

function resolveAdvisorState(
  market: MarketSnapshot,
  overrides: AdvisorInputOverride = {},
): AdvisorState {
  const regimeKey = overrides.regimeKey ?? market.regimeKey;
  const regime = regimeLabelFromKey(regimeKey);
  const volScore = overrides.volScore ?? market.volScore;
  const skewScore = overrides.skewScore ?? market.skewScore;
  const confidence = overrides.confidence ?? market.confidence;

  return {
    regimeKey,
    regimeLabel: regime.label,
    regimeSubtitle: overrides.regimeSubtitle ?? regime.subtitle,
    marketBias: determineMarketBias(market),
    volRegime: determineVolRegime(market, volScore),
    eventRisk: overrides.eventRisk ?? determineEventRisk(market, confidence, volScore, skewScore),
    conviction: determineConviction(confidence),
    volScore,
    skewScore,
    confidence,
  };
}

function scoreStrategy(strategy: StrategyTemplate, state: AdvisorState): ScoredStrategy {
  let score = 50;
  const reasons: string[] = [];
  const cautions: string[] = [];

  if (state.marketBias === "bull") {
    if (strategy.bias === "bull") {
      score += 18;
      reasons.push("현재 추세가 강세 쪽으로 기울어 있어 방향 정합성이 높습니다.");
    } else if (strategy.bias === "bear") {
      score -= 16;
      cautions.push("현재 추세와 반대 방향 구조라 전술적 이유가 없으면 보수적으로 봐야 합니다.");
    }
  } else if (state.marketBias === "bear") {
    if (strategy.bias === "bear") {
      score += 18;
      reasons.push("현재 추세가 약세 쪽으로 기울어 있어 방향 정합성이 높습니다.");
    } else if (strategy.bias === "bull") {
      score -= 16;
      cautions.push("현재 추세와 반대 방향 구조라 방어 목적이 아니면 비중을 낮추는 편이 낫습니다.");
    }
  } else if (strategy.bias === "neutral") {
    score += 4;
    reasons.push("방향성 확신이 낮은 국면에서 중립 구조가 상대적으로 안정적입니다.");
  }

  if (state.volRegime === "high") {
    if (strategy.vol === "buy") {
      score += 14;
      reasons.push("변동성이 높은 국면이라 변동성 매수 구조가 유리합니다.");
    } else if (strategy.vol === "sell") {
      score -= 12;
      cautions.push("변동성 매도 구조는 급변 리스크가 커져 손익 경로가 불리해질 수 있습니다.");
    } else {
      score += 4;
    }
  } else if (state.volRegime === "low") {
    if (strategy.vol === "sell") {
      score += 14;
      reasons.push("변동성이 낮은 국면이라 시간가치 수취형 구조가 유리합니다.");
    } else if (strategy.vol === "buy") {
      score -= 10;
      cautions.push("변동성 매수 구조는 현재 국면에서 기대값이 낮아질 수 있습니다.");
    } else {
      score += 3;
    }
  } else {
    if (strategy.vol === "mixed") {
      score += 6;
    } else {
      score += 2;
    }
  }

  if (state.eventRisk === "high") {
    if (strategy.eventFit === "high") {
      score += 10;
      reasons.push("이벤트 리스크가 커서 이벤트 적합도가 높은 구조를 우선합니다.");
    } else if (strategy.eventFit === "low") {
      score -= 8;
      cautions.push("이벤트 직전에는 이벤트 적합도가 낮은 구조의 리스크 경로가 불리합니다.");
    }
  } else if (state.eventRisk === "medium") {
    if (strategy.eventFit === "medium") {
      score += 5;
    } else if (strategy.eventFit === "low") {
      score -= 2;
    }
  } else if (strategy.eventFit === "low") {
    score += 4;
  }

  if (state.conviction === "high") {
    if (strategy.risk === "defined") {
      score += 6;
      reasons.push("확신도가 높아 정의된 손실 구조가 선호됩니다.");
    }
  } else if (state.conviction === "low") {
    if (strategy.risk === "tail") {
      score -= 10;
      cautions.push("확신도가 낮은 국면에서 tail risk 구조는 피하는 편이 좋습니다.");
    } else {
      score += 4;
    }
  }

  if (strategy.cost === "income" && state.volRegime === "low") {
    score += 5;
  }
  if (strategy.cost === "credit" && state.volRegime === "high") {
    score -= 3;
  }
  if (strategy.cost === "high" && state.conviction === "low") {
    score -= 4;
  }
  if (strategy.cost === "low" && state.eventRisk === "high") {
    score += 2;
  }

  score = clamp(score, 0, 100);

  return {
    ...strategy,
    score,
    band: "watchlist",
    rank: 0,
    reasons: uniqueText(reasons).slice(0, 3),
    cautions: uniqueText(cautions).slice(0, 2),
    playbookUrl: `${PLAYBOOK_BASE_PATH}#strategy/${strategy.slug}`,
  };
}

function uniqueText(values: string[]): string[] {
  return [...new Set(values)];
}

function buildHeadlineThemes(market: MarketSnapshot, state: AdvisorState): ThemeItem[] {
  const date = market.actualDate;
  const biasTag =
    state.marketBias === "bull" ? "상방" : state.marketBias === "bear" ? "하방" : "중립";
  return [
    {
      title: "반도체/AI 수급: 삼성전자, SK하이닉스, HBM, 외국인 매수",
      date,
      keywords: ["삼성전자", "SK하이닉스", "HBM", "외국인"],
      url: googleSearchUrl(`${date} 코스피200 반도체 AI 삼성전자 SK하이닉스 HBM 외국인`),
    },
    {
      title: "금리/환율 이벤트: 연준, 한국은행, 달러원, 국채금리",
      date,
      keywords: ["연준", "한국은행", "달러원", "국채금리"],
      url: googleSearchUrl(`${date} 코스피200 금리 환율 연준 한국은행 달러원`),
    },
    {
      title: `지수 모멘텀: 코스피200, ${biasTag}, 차익실현, 프로그램 매매`,
      date,
      keywords: ["코스피200", biasTag, "차익실현", "프로그램"],
      url: googleSearchUrl(`${date} 코스피200 지수 모멘텀 신고가 차익실현 프로그램 매매`),
    },
    {
      title: "변동성/옵션 이벤트: VKOSPI, 옵션만기, 변동성, 이벤트 리스크",
      date,
      keywords: ["VKOSPI", "옵션만기", "변동성", "이벤트"],
      url: googleSearchUrl(`${date} VKOSPI 코스피200 옵션만기 변동성 이벤트 리스크`),
    },
    {
      title: "대외 리스크: 미국 증시, 중국 경기, 관세, 지정학",
      date,
      keywords: ["미국 증시", "중국 경기", "관세", "지정학"],
      url: googleSearchUrl(`${date} 코스피200 미국 증시 중국 경기 관세 지정학 리스크`),
    },
  ];
}

function buildReportThemes(market: MarketSnapshot, state: AdvisorState): ThemeItem[] {
  const date = market.actualDate;
  const regimeFocus = state.regimeKey === "regime_1" || state.regimeKey === "regime_2"
    ? "변동성"
    : "시간가치";
  return [
    {
      source: "전략 리포트 검색",
      title: "시장전략 컨센서스: 운용전략, 코스피 전망, 상단/하단, 리스크",
      date,
      keywords: ["운용전략", "코스피 전망", "상단/하단", "리스크"],
      url: googleSearchUrl(`${date} 증권사 운용전략 코스피 전망 상단 하단 리스크`),
    },
    {
      source: "업종 리포트 검색",
      title: "반도체 이익전망: 반도체, AI, 이익전망, 목표주가",
      date,
      keywords: ["반도체", "AI", "이익전망", "목표주가"],
      url: googleSearchUrl(`${date} 증권사 리포트 반도체 AI 이익전망 삼성전자 SK하이닉스`),
    },
    {
      source: "매크로 리포트 검색",
      title: "금리/환율 시나리오: 금리, 환율, 연준, 한국은행",
      date,
      keywords: ["금리", "환율", "연준", "한국은행"],
      url: googleSearchUrl(`${date} 증권사 리포트 금리 환율 연준 한국은행 코스피`),
    },
    {
      source: "수급 리포트 검색",
      title: "외국인/기관 수급: 외국인, 기관, 선물, 프로그램",
      date,
      keywords: ["외국인", "기관", "선물", "프로그램"],
      url: googleSearchUrl(`${date} 증권사 리포트 외국인 기관 수급 선물 프로그램 코스피200`),
    },
    {
      source: "변동성 리포트 검색",
      title: `변동성/파생 포지션: VKOSPI, 옵션, 만기, ${regimeFocus}`,
      date,
      keywords: ["VKOSPI", "옵션", "만기", regimeFocus],
      url: googleSearchUrl(`${date} 증권사 리포트 VKOSPI 옵션 만기 헤지 코스피200`),
    },
  ];
}

function buildRationale(
  market: MarketSnapshot,
  state: AdvisorState,
  topRecommended: ScoredStrategy[],
): string[] {
  const top = topRecommended[0];
  const second = topRecommended[1];
  const third = topRecommended[2];

  return [
    `KOSPI200 종가는 ${market.k200Close.toFixed(2)}pt이고, 21일 변화율은 ${formatSigned(market.change21d)}입니다.`,
    `20일 실현변동성은 ${market.realizedVol20.toFixed(1)}%이며, 현재 변동성 레짐은 ${state.volRegime}입니다.`,
    `현재 레짐은 ${state.regimeLabel} (${state.regimeSubtitle})로 분류되며, 확신도는 ${state.confidence.toFixed(1)}점입니다.`,
    top
      ? `최상위 후보는 ${top.title}로, 점수 ${top.score.toFixed(0)}점과 ${top.reasons[0] ?? "정합성 우위"}를 확보했습니다.`
      : "최상위 후보가 아직 확정되지 않았습니다.",
    second
      ? `2순위 후보는 ${second.title}이며, 현재 시장 상태와의 정합성을 기준으로 watchlist보다 위에 있습니다.`
      : "2순위 후보가 아직 없습니다.",
    third
      ? `3순위 후보는 ${third.title}이며, 예외 이벤트가 커질수록 방어적 구조와 함께 검토할 가치가 있습니다.`
      : "3순위 후보가 아직 없습니다.",
  ];
}

function buildValidationNotes(
  state: AdvisorState,
  scored: ScoredStrategy[],
): string[] {
  const top = scored[0];
  const avoid = scored.slice(-1)[0];
  return [
    `Top 3 전략은 현재 레짐 (${state.regimeLabel})에 정합적인 방향/변동성 조합을 우선하도록 점수화했습니다.`,
    `Avoid 6 전략은 현재 시장 방향 또는 변동성 조건과 충돌하는 구조를 우선적으로 제외했습니다.`,
    `확신도가 낮을수록 tail risk 구조보다 defined-risk 구조를 우선하는 안전장치를 적용했습니다.`,
    `현재 최고점 전략은 ${top?.title ?? "N/A"}(${top?.score.toFixed(0) ?? "0"}점)이며, 최저점 전략은 ${avoid?.title ?? "N/A"}(${avoid?.score.toFixed(0) ?? "0"}점)입니다.`,
    "다음 단계에서는 Codex 3의 PASS/Review/Reject와 Codex 4의 attribution note를 연결하기 쉽도록 이유 문자열을 유지합니다.",
  ];
}

function buildOpsNotes(
  market: MarketSnapshot,
  state: AdvisorState,
  overrides: AdvisorInputOverride,
): string[] {
  return [
    `시장 입력: selectedDate=${market.selectedDate}, actualDate=${market.actualDate}, sourceDate=${market.sourceDate}, source=${market.source}.`,
    `레짐 입력: ${state.regimeLabel} / ${state.regimeSubtitle} / confidence=${state.confidence.toFixed(1)}.`,
    `Codex 2 연계: ${overrides.codex2Brief ? "override brief 수신" : "현재는 market snapshot 기반 해석"}.`,
    "API 응답은 no-store로 내려서 매 호출마다 최신 상태를 확인할 수 있도록 구성합니다.",
    "기존 백업 UI의 Top 9 / Avoid 6 뷰와 그대로 호환되도록 출력 형식을 유지합니다.",
  ];
}

function formatSigned(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export async function buildAdvisorSnapshot(
  dateInput?: string | null,
  overrides: AdvisorInputOverride = {},
): Promise<AdvisorSnapshot> {
  const market = await getMarketSnapshot(dateInput ?? overrides.selectedDate ?? null);
  const state = resolveAdvisorState(market, overrides);
  const scored = STRATEGY_CATALOG.map((strategy) => scoreStrategy(strategy, state)).sort(
    (left, right) => right.score - left.score || left.title.localeCompare(right.title, "en"),
  );

  const topRecommended = scored.slice(0, 3).map((item, index) => ({
    ...item,
    band: "top" as const,
    rank: index + 1,
  }));
  const watchlist = scored.slice(3, 6).map((item, index) => ({
    ...item,
    band: "watchlist" as const,
    rank: index + 4,
  }));
  const avoidNow = scored
    .slice(-6)
    .sort((left, right) => left.score - right.score)
    .map((item, index) => ({
      ...item,
      band: "avoid" as const,
      rank: index + 1,
    }));
  const displayTopNine = scored.slice(0, 9).map((item, index) => ({
    ...item,
    band: index < 3 ? ("top" as const) : ("watchlist" as const),
    rank: index + 1,
  }));

  const source = overrides.sourceLabel
    ? overrides.sourceLabel
    : overrides.codex2Brief
      ? "Codex 2 -> Codex 1 core"
      : market.source;

  return {
    source,
    generatedAt: new Date().toISOString(),
    selectedDate: market.selectedDate,
    actualDate: market.actualDate,
    market,
    state,
    headlineThemes: buildHeadlineThemes(market, state),
    reportThemes: buildReportThemes(market, state),
    topRecommended,
    watchlist,
    avoidNow,
    displayTopNine,
    rationale: buildRationale(market, state, topRecommended),
    validationNotes: buildValidationNotes(state, scored),
    opsNotes: buildOpsNotes(market, state, overrides),
    committeeBrief: buildCommitteeBrief(state, topRecommended, watchlist, avoidNow),
    playbookBasePath: PLAYBOOK_BASE_PATH,
    codex2Brief: overrides.codex2Brief ?? null,
  };
}

function buildCommitteeBrief(
  state: AdvisorState,
  topRecommended: ScoredStrategy[],
  watchlist: ScoredStrategy[],
  avoidNow: ScoredStrategy[],
): string {
  const lead = topRecommended[0];
  const watch = watchlist[0];
  const avoid = avoidNow[0];

  return [
    `현재 레짐은 ${state.regimeLabel}(${state.regimeSubtitle})이며 확신도는 ${state.confidence.toFixed(1)}점입니다.`,
    lead
      ? `Top Recommended의 중심은 ${lead.title}(${lead.score.toFixed(0)}점)입니다.`
      : "Top Recommended 중심 전략이 아직 없습니다.",
    watch
      ? `Watchlist는 ${watch.title}를 포함해 예외 이벤트 발생 시 재검토 대상으로 유지합니다.`
      : "Watchlist는 아직 비어 있습니다.",
    avoid
      ? `Avoid Now의 최우선 제외 후보는 ${avoid.title}(${avoid.score.toFixed(0)}점)입니다.`
      : "Avoid Now는 아직 비어 있습니다.",
  ].join(" ");
}
