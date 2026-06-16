export function composeCommitteeReport(state) {
  const lines = [
    `시장 판단 근거: ${state.investmentCommittee.marketReasoning}`,
    `추천 전략 근거: ${state.investmentCommittee.strategyReasoning}`,
    `리스크 요인: ${state.investmentCommittee.riskFactors.join(", ") || "-"}`,
    `투자위원회 의견: ${state.investmentCommittee.committeeOpinion}`
  ];

  return lines.join("\n\n");
}
