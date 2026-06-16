const BASE_ANCHOR_DATE = "2026-06-16";
const BASE_ANCHOR_CLOSE = 334.8;

function pad2(value) {
  return String(value).padStart(2, "0");
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function toUtcDayIndex(dateInput) {
  return Math.floor(Date.parse(`${dateInput}T00:00:00Z`) / 86400000);
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
  if (Number.isNaN(date.getTime())) {
    return BASE_ANCHOR_DATE;
  }

  date.setDate(date.getDate() - 1);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() - 1);
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function syntheticKospi200Close(dateInput) {
  const dayIndex = toUtcDayIndex(dateInput);
  const anchorIndex = toUtcDayIndex(BASE_ANCHOR_DATE);
  const delta = dayIndex - anchorIndex;

  const drift = delta * 0.11;
  const wave = Math.sin(dayIndex / 4.9) * 3.2 + Math.cos(dayIndex / 11.7) * 2.1;
  const cycle = Math.sin(dayIndex / 28.5) * 1.2;
  const value = BASE_ANCHOR_CLOSE + drift + wave + cycle;

  return round(Math.max(200, value), 1);
}

function collectHistory(targetDate, lookback = 20) {
  const dates = [];
  let cursor = targetDate;

  for (let index = 0; index <= lookback; index += 1) {
    if (!isValidDateInput(cursor)) break;
    dates.unshift(cursor);
    cursor = getPreviousTradingDate(cursor);
    if (!cursor) break;
  }

  return dates;
}

function calculateHistoricalVolatility(targetDate, lookback = 20) {
  const history = collectHistory(targetDate, lookback + 1);
  if (history.length < 2) return 0;

  const returns = [];
  for (let index = 1; index < history.length; index += 1) {
    const previousClose = syntheticKospi200Close(history[index - 1]);
    const currentClose = syntheticKospi200Close(history[index]);
    returns.push((currentClose - previousClose) / previousClose);
  }

  if (!returns.length) return 0;

  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / returns.length;
  return round(Math.sqrt(variance) * Math.sqrt(252) * 100, 2);
}

export function buildMarketSnapshot(targetDate) {
  const selectedDate = isValidDateInput(targetDate) ? targetDate : BASE_ANCHOR_DATE;
  const previousTradingDayDate = getPreviousTradingDate(selectedDate);
  const kospi200 = syntheticKospi200Close(selectedDate);
  const previousTradingDayKospi200 = previousTradingDayDate ? syntheticKospi200Close(previousTradingDayDate) : kospi200;
  const dailyChangeRate = previousTradingDayKospi200
    ? round(((kospi200 - previousTradingDayKospi200) / previousTradingDayKospi200) * 100, 2)
    : 0;
  const historicalVolatility = calculateHistoricalVolatility(selectedDate, 20);

  return {
    dataDate: selectedDate,
    previousTradingDayDate,
    kospi200: kospi200.toFixed(1),
    previousTradingDayKospi200: previousTradingDayKospi200.toFixed(1),
    dailyChangeRate,
    historicalVolatility
  };
}
