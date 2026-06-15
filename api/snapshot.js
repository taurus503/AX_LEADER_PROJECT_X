const YAHOO_URL = "https://query1.finance.yahoo.com/v8/finance/chart/%5EKS200";

function toIsoDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function normalizeDateInput(input) {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : toIsoDate(parsed);
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function stddev(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance =
    values.reduce((acc, value) => acc + (value - avg) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

function skewness(values) {
  if (values.length < 3) return 0;
  const avg = mean(values);
  const sd = stddev(values);
  if (!sd) return 0;
  const m3 = values.reduce((acc, value) => acc + (value - avg) ** 3, 0) / values.length;
  return m3 / (sd ** 3);
}

function logReturns(closes) {
  const returns = [];
  for (let i = 1; i < closes.length; i += 1) {
    const prev = closes[i - 1];
    const curr = closes[i];
    if (prev > 0 && curr > 0) returns.push(Math.log(curr / prev));
  }
  return returns;
}

function rollingStats(closes, window = 20) {
  const stats = [];
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

async function fetchYahooChart(range = "2y", interval = "1d") {
  const url = new URL(YAHOO_URL);
  url.searchParams.set("range", range);
  url.searchParams.set("interval", interval);
  url.searchParams.set("includePrePost", "false");
  url.searchParams.set("events", "div,splits");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json,text/plain,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed (${response.status})`);
  }

  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];

  const points = [];
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

function pickPointOnOrBefore(points, targetDate) {
  if (!points.length) throw new Error("No points available");
  if (!targetDate) {
    return { index: points.length - 1, point: points[points.length - 1] };
  }

  let selectedIndex = -1;
  for (let i = 0; i < points.length; i += 1) {
    if (points[i].date <= targetDate) selectedIndex = i;
  }

  if (selectedIndex < 0) {
    return { index: 0, point: points[0] };
  }

  return { index: selectedIndex, point: points[selectedIndex] };
}

function classifyRegime(skewScore, volScore) {
  if (skewScore >= 0 && volScore >= 0) {
    return { key: "regime_1", label: "Regime 1", subtitle: "Put skew · High vol" };
  }
  if (skewScore < 0 && volScore >= 0) {
    return { key: "regime_2", label: "Regime 2", subtitle: "Call skew · High vol" };
  }
  if (skewScore < 0 && volScore < 0) {
    return { key: "regime_4", label: "Regime 4", subtitle: "Call skew · Low vol" };
  }
  return { key: "regime_3", label: "Regime 3", subtitle: "Put skew · Low vol" };
}

function scaleToScore(value, baseline, spread) {
  if (!Number.isFinite(value) || !Number.isFinite(baseline) || !Number.isFinite(spread) || spread <= 0) {
    return 0;
  }
  return Math.max(-100, Math.min(100, ((value - baseline) / spread) * 100));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const requested = normalizeDateInput(req.query?.date);
    const selectedDate = requested ?? toIsoDate(new Date());
    const points = await fetchYahooChart();
    const { index, point } = pickPointOnOrBefore(points, selectedDate);

    if (index < 20) {
      throw new Error("Not enough historical data to compute scores");
    }

    const closesUpToSelected = points.slice(0, index + 1).map((item) => item.close);
    const prevClose = points[index - 1]?.close ?? null;
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

    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.status(200).json({
      source: "Yahoo Finance public chart API",
      selectedDate,
      actualDate: point.date,
      k200Close: point.close,
      k200PrevClose: prevClose,
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
    });
  } catch (error) {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
