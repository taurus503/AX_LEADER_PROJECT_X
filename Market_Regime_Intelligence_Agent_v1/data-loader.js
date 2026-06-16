import { buildMarketSnapshot, getDefaultTradingDate, getPreviousTradingDate, isValidDateInput, normalizeDateInput } from "./market-regime-model.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readInlineSampleData() {
  const node = document.getElementById("sample-regime-data-inline");
  if (!node) return null;

  try {
    return JSON.parse(node.textContent || "{}");
  } catch (_error) {
    return null;
  }
}

function enrichRegimeData(data, targetDate) {
  const selectedDate = isValidDateInput(targetDate) ? targetDate : getDefaultTradingDate();
  const marketSnapshot = buildMarketSnapshot(selectedDate);
  const next = clone(data);

  next.asOf = `${selectedDate} 09:10 KST`;
  next.currentRegime = next.currentRegime || {};
  next.currentRegime.lastUpdate = `${selectedDate} 09:10 KST`;

  next.marketSnapshot = {
    ...(next.marketSnapshot || {}),
    ...marketSnapshot
  };

  next.transitionMonitor = next.transitionMonitor || {};
  next.transitionMonitor.previousRegime = next.transitionMonitor.previousRegime || "Bull / Calm";
  next.transitionMonitor.currentRegime = next.transitionMonitor.currentRegime || next.currentRegime.name || "Transition";

  next.investmentCommittee = next.investmentCommittee || {};
  next.investmentCommittee.marketReasoning = [
    `기준일 ${selectedDate} 기준으로 KOSPI200 종가 ${marketSnapshot.kospi200}를 반영했습니다.`,
    `직전 거래일 ${marketSnapshot.previousTradingDayDate || "-"} 대비 ${marketSnapshot.dailyChangeRate >= 0 ? "+" : ""}${marketSnapshot.dailyChangeRate.toFixed(2)}%로 계산했습니다.`,
    `20일 역사적 변동성은 ${marketSnapshot.historicalVolatility.toFixed(2)}%입니다.`
  ].join(" ");

  next.investmentCommittee.strategyReasoning = next.investmentCommittee.strategyReasoning || "국면과 변동성 정보가 함께 보이도록 구성해, 전략 해석의 근거를 한 화면에서 확인할 수 있습니다.";
  next.investmentCommittee.committeeOpinion = next.investmentCommittee.committeeOpinion || "기준일 변경 시 숫자가 즉시 재계산되므로, 보고서 초안 작성과 검토 포인트 확인에 활용할 수 있습니다.";

  return next;
}

export async function loadSampleRegimeData(targetDate) {
  let data = null;

  if (window.location.protocol !== "file:") {
    try {
      const response = await fetch("./sample-regime-data.json", { cache: "no-store" });
      if (response.ok) {
        data = await response.json();
      }
    } catch (_error) {
      // Use inline fallback below.
    }
  }

  if (!data) {
    const inline = readInlineSampleData();
    if (inline) {
      data = inline;
    }
  }

  if (!data) {
    throw new Error("Sample regime data is unavailable.");
  }

  return enrichRegimeData(data, targetDate || getDefaultTradingDate());
}

export { getDefaultTradingDate, getPreviousTradingDate, normalizeDateInput };
