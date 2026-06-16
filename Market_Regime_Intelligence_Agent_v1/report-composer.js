function formatSignedPercent(value, digits = 2) {
  const n = Number(value || 0);
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function composeCommitteeReport(state) {
  const lines = [
    `기준일: ${state.marketSnapshot.dataDate}`,
    `KOSPI200 종가: ${state.marketSnapshot.kospi200}`,
    `전일 대비 증감율: ${formatSignedPercent(state.marketSnapshot.dailyChangeRate)}`,
    `20일 역사적 변동성: ${state.marketSnapshot.historicalVolatility.toFixed(2)}%`,
    "",
    `시장 판단 근거: ${state.investmentCommittee.marketReasoning}`,
    `추천 전략 근거: ${state.investmentCommittee.strategyReasoning}`,
    `리스크 요인: ${state.investmentCommittee.riskFactors.join(", ") || "-"}`,
    `투자위원회 의견: ${state.investmentCommittee.committeeOpinion}`
  ];

  return lines.join("\n");
}
