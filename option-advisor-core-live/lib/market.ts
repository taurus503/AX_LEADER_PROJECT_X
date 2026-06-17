export type RegimeKey = "regime_1" | "regime_2" | "regime_3" | "regime_4";

export interface MarketSnapshot {
  source: string;
  selectedDate: string;
  actualDate: string;
  k200Close: number;
  k200PrevClose: number | null;
  change1d: number;
  change5d: number;
  change21d: number;
  realizedVol20: number;
  skew20: number;
  volScore: number;
  skewScore: number;
  confidence: number;
  regimeKey: RegimeKey;
  regimeLabel: string;
  regimeSubtitle: string;
  note: string;
  seriesLength: number;
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
    error?: { description?: string };
  };
}

interface PricePoint {
  date: string;
  close: number;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const FALLBACK_SNAPSHOT = {
  source: "Sample fallback snapshot",
  actualDate: "2026-06-10",
  k200Close: 1227.12,
  k200PrevClose: 1217.36,
  change1d: 0.8,
  change5d: 2.1,
  change21d: 5.6,
  realizedVol20: 24.8,
  skew20: -0.14,
  volScore: 18.4,
  skewScore: -11.2,
  confidence: 24.2,
  regimeKey: "regime_2" as RegimeKey,
  regimeLabel: "Regime 2",
  regimeSubtitle: "Call skew / High vol",
  note: "Fallback snapshot used because live market data was unavailable.",
  seriesLength: 0,
};

function toIsoDate(value: number | string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

function normalizeDateInput(input?: string | null): string | null {
  if (!input) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return toIsoDate(date);
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance =
    values.reduce((acc, value) => acc + (value - avg) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

function skewness(values: number[]): number {
  if (values.length < 3) return 0;
  const avg = mean(values);
  const sd = stddev(values);
  if (!sd) return 0;
  const n = values.length;
  const m3 = values.reduce((acc, value) => acc + (value - avg) ** 3, 0) / n;
  return m3 / (sd ** 3);
}

function logReturns(closes: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i += 1) {
    const prev = closes[i - 1];
    const curr = closes[i];
    if (prev > 0 && curr > 0) {
      returns.push(Math.log(curr / prev));
    }
  }
  return returns;
}

function rollingStats(
  closes: number[],
  window = 20,
): Array<{ vol: number; skew: number }> {
  const stats: Array<{ vol: number; skew: number }> = [];
  for (let i = window; i < closes.length; i += 1) {
    const slice = closes.slice(i - window, i + 1);
    const returns = logReturns(slice);
    if (returns.length < window / 2) continue;
    stats.push({
      vol: stddev(returns) * Math.sqrt(252) * 100,
      skew: skewness(returns),
    });
  }
  return stats;
}

async function fetchYahooChart(
  symbol: string,
  range: string,
  interval: string,
): Promise<PricePoint[]> {
  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
  );
  url.searchParams.set("range", range);
  url.searchParams.set("interval", interval);
  url.searchParams.set("includePrePost", "false");
  url.searchParams.set("events", "div,splits");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json,text/plain,*/*",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed (${response.status})`);
  }

  const payload = (await response.json()) as YahooChartResponse;
  const result = payload.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];

  const points: PricePoint[] = [];
  timestamps.forEach((timestamp, index) => {
    const close = closes[index];
    if (typeof close === "number" && Number.isFinite(close)) {
      points.push({
        date: toIsoDate(timestamp * 1000),
        close,
      });
    }
  });

  if (!points.length) {
    throw new Error("No price points returned from Yahoo Finance");
  }

  return points;
}

function pickPointForDate(
  points: PricePoint[],
  targetDate: string | null,
): { index: number; point: PricePoint } {
  if (!points.length) {
    throw new Error("No points available");
  }

  if (!targetDate) {
    return { index: points.length - 1, point: points[points.length - 1] };
  }

  let beforeIndex = -1;
  let afterIndex = -1;
  for (let index = 0; index < points.length; index += 1) {
    const pointDate = points[index].date;
    if (pointDate <= targetDate) {
      beforeIndex = index;
    } else if (afterIndex < 0) {
      afterIndex = index;
    }
  }

  if (beforeIndex < 0) {
    const fallbackIndex = afterIndex >= 0 ? afterIndex : 0;
    return { index: fallbackIndex, point: points[fallbackIndex] };
  }

  if (afterIndex < 0) {
    return { index: beforeIndex, point: points[beforeIndex] };
  }

  const targetTime = Date.parse(`${targetDate}T00:00:00Z`);
  const beforeTime = Date.parse(`${points[beforeIndex].date}T00:00:00Z`);
  const afterTime = Date.parse(`${points[afterIndex].date}T00:00:00Z`);
  const beforeGap = Math.abs(targetTime - beforeTime);
  const afterGap = Math.abs(afterTime - targetTime);

  if (afterGap < beforeGap) {
    return { index: afterIndex, point: points[afterIndex] };
  }

  return { index: beforeIndex, point: points[beforeIndex] };
}

function classifyRegime(skewScore: number, volScore: number): {
  key: RegimeKey;
  label: string;
  subtitle: string;
} {
  if (skewScore >= 0 && volScore >= 0) {
    return { key: "regime_1", label: "Regime 1", subtitle: "Put skew / High vol" };
  }

  if (skewScore < 0 && volScore >= 0) {
    return { key: "regime_2", label: "Regime 2", subtitle: "Call skew / High vol" };
  }

  if (skewScore < 0 && volScore < 0) {
    return { key: "regime_4", label: "Regime 4", subtitle: "Call skew / Low vol" };
  }

  return { key: "regime_3", label: "Regime 3", subtitle: "Put skew / Low vol" };
}

function scaleToScore(value: number, baseline: number, spread: number): number {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(baseline) ||
    !Number.isFinite(spread) ||
    spread <= 0
  ) {
    return 0;
  }

  return Math.max(-100, Math.min(100, ((value - baseline) / spread) * 100));
}

function buildFallbackSnapshot(selectedDate: string): MarketSnapshot {
  const regime = classifyRegime(FALLBACK_SNAPSHOT.skewScore, FALLBACK_SNAPSHOT.volScore);
  return {
    source: FALLBACK_SNAPSHOT.source,
    selectedDate,
    actualDate: FALLBACK_SNAPSHOT.actualDate,
    k200Close: FALLBACK_SNAPSHOT.k200Close,
    k200PrevClose: FALLBACK_SNAPSHOT.k200PrevClose,
    change1d: FALLBACK_SNAPSHOT.change1d,
    change5d: FALLBACK_SNAPSHOT.change5d,
    change21d: FALLBACK_SNAPSHOT.change21d,
    realizedVol20: FALLBACK_SNAPSHOT.realizedVol20,
    skew20: FALLBACK_SNAPSHOT.skew20,
    volScore: FALLBACK_SNAPSHOT.volScore,
    skewScore: FALLBACK_SNAPSHOT.skewScore,
    confidence: FALLBACK_SNAPSHOT.confidence,
    regimeKey: regime.key,
    regimeLabel: regime.label,
    regimeSubtitle: regime.subtitle,
    note: FALLBACK_SNAPSHOT.note,
    seriesLength: FALLBACK_SNAPSHOT.seriesLength,
  };
}

export async function getMarketSnapshot(
  dateInput?: string | null,
): Promise<MarketSnapshot> {
  const selectedDate = normalizeDateInput(dateInput) ?? toIsoDate(new Date());

  try {
    const points = await fetchYahooChart("^KS200", "2y", "1d");
    const { index, point } = pickPointForDate(points, selectedDate);

    if (index < 20) {
      throw new Error("Not enough historical data to compute scores");
    }

    const closesUpToSelected = points.slice(0, index + 1).map((item) => item.close);
    const close = point.close;
    const prevClose = points[index - 1]?.close ?? null;
    const weekClose = points[index - 5]?.close ?? prevClose ?? close;
    const monthClose = points[index - 21]?.close ?? weekClose;

    const returns = logReturns(closesUpToSelected);
    const windowReturns = returns.slice(-20);
    const realizedVol20 = stddev(windowReturns) * Math.sqrt(252) * 100;
    const skew20 = skewness(windowReturns);

    const rolling = rollingStats(closesUpToSelected, 20);
    const recentRolling = rolling.slice(-60);

    const volBaseline = mean(recentRolling.map((entry) => entry.vol));
    const volSpread = stddev(recentRolling.map((entry) => entry.vol)) || 1;
    const skewBaseline = mean(recentRolling.map((entry) => entry.skew));
    const skewSpread = stddev(recentRolling.map((entry) => entry.skew)) || 1;

    const volScore = scaleToScore(realizedVol20, volBaseline, volSpread / 1.5);
    const skewScore = scaleToScore(skew20, skewBaseline, skewSpread / 1.5);
    const confidence = Math.max(0, Math.min(100, Math.hypot(volScore, skewScore) * 0.9));
    const regime = classifyRegime(skewScore, volScore);

    return {
      source: "Yahoo Finance public chart API",
      selectedDate,
      actualDate: point.date,
      k200Close: close,
      k200PrevClose: prevClose,
      change1d: prevClose ? ((close / prevClose - 1) * 100) : 0,
      change5d: weekClose ? ((close / weekClose - 1) * 100) : 0,
      change21d: monthClose ? ((close / monthClose - 1) * 100) : 0,
      realizedVol20,
      skew20,
      volScore,
      skewScore,
      confidence,
      regimeKey: regime.key,
      regimeLabel: regime.label,
      regimeSubtitle: regime.subtitle,
      note: "Real-data proxy: volatility uses 20D realized vol, skew uses 20D return skew from KOSPI200 history.",
      seriesLength: points.length,
    };
  } catch {
    return buildFallbackSnapshot(selectedDate);
  }
}
