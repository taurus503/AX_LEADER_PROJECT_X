const DAY_SECONDS = 86400;
const TRADING_DAYS = 252;

function pad2(value) {
  return String(value).padStart(2, "0");
}

export function normalizeDateInput(value) {
  const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

export function isValidDateInput(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

export function getPreviousTradingDate(dateInput) {
  if (!isValidDateInput(dateInput)) return "";

  const date = new Date(`${dateInput}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  while (true) {
    date.setDate(date.getDate() - 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    }
  }
}

export function getDefaultTradingDate(referenceDate = new Date()) {
  const date = new Date(referenceDate);
  if (Number.isNaN(date.getTime())) return "";

  date.setDate(date.getDate() - 1);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() - 1);
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function buildYahooChartUrl(symbol = "^KS200", range = "3mo", interval = "1d", options = {}) {
  const encodedSymbol = encodeURIComponent(symbol);
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}`);
  if (options.period1) url.searchParams.set("period1", String(options.period1));
  if (options.period2) url.searchParams.set("period2", String(options.period2));
  if (!options.period1 && !options.period2) {
    url.searchParams.set("range", range);
  }
  url.searchParams.set("interval", interval);
  url.searchParams.set("includePrePost", "false");
  return url;
}

function round(value, digits = 2) {
  const multiplier = 10 ** digits;
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

function pctChange(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return 0;
  return round(((current / previous) - 1) * 100, 2);
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function valueAtOffset(values, offsetFromEnd) {
  const index = Math.max(0, values.length - 1 - offsetFromEnd);
  return values[index];
}

function pointAtOrBefore(points, dateInput) {
  if (!points.length) return null;
  if (!isValidDateInput(dateInput)) return points.at(-1) || null;
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (points[index].date <= dateInput) return points[index];
  }
  return points[0] || null;
}

export function parseYahooChartResponse(payload) {
  const result = payload?.chart?.result?.[0];
  const error = payload?.chart?.error;
  if (error) throw new Error(error.description || "Yahoo chart API error");
  if (!result) throw new Error("No chart result returned");

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const closes = quote.close || [];
  const volumes = quote.volume || [];

  const points = timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      close: closes[index],
      volume: volumes[index] || 0
    }))
    .filter((point) => Number.isFinite(point.close));

  if (points.length < 22) {
    throw new Error("Not enough price points for 20-day volatility");
  }

  return {
    provider: "Yahoo Finance chart",
    symbol: result.meta?.symbol || "^KS200",
    currency: result.meta?.currency || "",
    exchangeName: result.meta?.exchangeName || "",
    regularMarketPrice: result.meta?.regularMarketPrice || points.at(-1)?.close,
    points
  };
}

export function computeFeaturesFromPrices(parsed, options = {}) {
  const closes = parsed.points.map((point) => point.close);
  const targetDate = normalizeDateInput(options.asOf) || parsed.points.at(-1)?.date || "";
  const eligiblePoints = targetDate
    ? parsed.points.filter((point) => point.date <= targetDate)
    : parsed.points;
  const selectedPoints = eligiblePoints.length ? eligiblePoints : parsed.points;
  const latestPoint = pointAtOrBefore(selectedPoints, targetDate) || selectedPoints.at(-1);
  const selectedIndex = Math.max(0, selectedPoints.findIndex((point) => point.date === latestPoint?.date));
  const previousPoint = selectedPoints[Math.max(0, selectedIndex - 1)] || latestPoint;
  const weekPoint = selectedPoints[Math.max(0, selectedIndex - 5)] || selectedPoints[0] || latestPoint;
  const monthPoint = selectedPoints[Math.max(0, selectedIndex - 21)] || selectedPoints[0] || latestPoint;
  const trailingWindow = selectedPoints.slice(Math.max(0, selectedIndex - 20), selectedIndex + 1);
  const dailyReturns = trailingWindow
    .map((point, index, recent) => index === 0 ? null : (point.close / recent[index - 1].close) - 1)
    .filter(Number.isFinite);
  const realizedVolatility20d = standardDeviation(dailyReturns) * Math.sqrt(TRADING_DAYS) * 100;
  const oneMonthReturn = pctChange(latestPoint?.close, monthPoint?.close);

  return {
    label: "Live KOSPI200",
    provider: parsed.provider,
    symbol: parsed.symbol,
    asOf: latestPoint?.date || parsed.points.at(-1)?.date || new Date(Date.now() - DAY_SECONDS * 1000).toISOString().slice(0, 10),
    latestClose: round(latestPoint?.close, 2),
    previousTradingDayDate: previousPoint?.date || "",
    previousTradingDayClose: round(previousPoint?.close, 2),
    oneWeekAgoClose: round(weekPoint?.close, 2),
    oneMonthAgoClose: round(monthPoint?.close, 2),
    returns: {
      oneDay: pctChange(latestPoint?.close, previousPoint?.close),
      oneWeek: pctChange(latestPoint?.close, weekPoint?.close),
      oneMonth: oneMonthReturn
    },
    volatility20d: round(realizedVolatility20d, 2),
    historicalVolatility: round(realizedVolatility20d, 2),
    eventRisk: realizedVolatility20d >= 35 ? "high" : realizedVolatility20d >= 24 ? "medium" : "low",
    newsSentiment: "mixed",
    breadth: oneMonthReturn >= 2 ? "strong" : oneMonthReturn <= -2 ? "weak" : "neutral",
    trendStrength: Math.max(0, Math.min(100, Math.round(50 + oneMonthReturn * 3))),
    slem: realizedVolatility20d >= 35 ? 0.92 : realizedVolatility20d >= 24 ? 0.86 : 0.74,
    gelmanRubin: realizedVolatility20d >= 45 ? 1.12 : 1.05,
    tradabilityMaskValid: true,
    points: parsed.points
  };
}

export async function fetchYahooMarketFeatures(symbol = "^KS200", fetchImpl = fetch, options = {}) {
  const asOf = normalizeDateInput(options.asOf);
  const period2 = asOf ? Math.floor(new Date(`${asOf}T23:59:59Z`).getTime() / 1000) : null;
  const period1 = asOf ? period2 - (120 * DAY_SECONDS) : null;
  const response = await fetchImpl(buildYahooChartUrl(symbol, "3mo", "1d", { period1, period2 }), {
    headers: {
      "User-Agent": "Mozilla/5.0 Market-Regime-Demo/1.0",
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Yahoo chart request failed (${response.status})`);
  }

  const payload = await response.json();
  return computeFeaturesFromPrices(parseYahooChartResponse(payload), { asOf });
}
