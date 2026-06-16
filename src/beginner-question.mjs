const DIRECT_TRADE_PATTERN = /(매수|매도|사도|팔아|진입|청산|투자해도|사야|팔아야|주문|자동매매|투자추천|수익\s*(날까|나|가능|보장)|실행 가능한 결론)/i;
const CONFIDENCE_PATTERN = /(확신|신뢰|점수|왜.*%|49|낮음|높음)/i;
const REGIME_PATTERN = /(국면|regime|transition|bull|bear|crisis|calm|강세|약세|전환)/i;
const NEWS_PATTERN = /(뉴스|리포트|키워드|기사|이슈)/i;
const STRATEGY_PATTERN = /(전략|후보|top|avoid|피해야|조심|위험)/i;

function compactList(items, limit = 3) {
  return (items || []).slice(0, limit).filter(Boolean).join(", ");
}

export function answerBeginnerQuestion(question, result) {
  const text = String(question || "").trim();
  if (!text) {
    return "궁금한 점을 한 문장으로 입력해 주세요. 예: 'Transition이 뭐야?', '왜 확신도가 낮아?', '오늘 조심할 점은?'";
  }

  const regime = result?.regime?.id || "현재 국면";
  const confidencePercent = Math.round((result?.confidence?.score || 0) * 100);
  const confidenceLabel = result?.confidence?.label || "";
  const plusReasons = (result?.confidence?.reasons || []).filter((reason) => reason.impact === "plus");
  const minusReasons = (result?.confidence?.reasons || []).filter((reason) => reason.impact === "minus");

  if (DIRECT_TRADE_PATTERN.test(text)) {
    return [
      "이 화면은 매수/매도 결정을 대신하지 않습니다.",
      `현재는 ${regime} 국면으로 보고 있으며, 투자판단보다는 검토 포인트를 정리하는 용도입니다.`,
      `먼저 확인할 것은 ${compactList(result?.strategy?.avoid, 2) || "이벤트 리스크와 손실 제한 여부"}입니다.`
    ].join("\n");
  }

  if (CONFIDENCE_PATTERN.test(text)) {
    return [
      `확신도는 ${confidencePercent}% (${confidenceLabel})입니다.`,
      `높이는 요인: ${compactList(plusReasons.map((reason) => reason.title)) || "명확한 우호 요인이 제한적입니다."}`,
      `낮추는 요인: ${compactList(minusReasons.map((reason) => reason.title)) || "큰 차감 요인은 없습니다."}`,
      result?.confidence?.summary || "점수는 시장 근거와 충돌 신호를 함께 반영해 계산합니다."
    ].join("\n");
  }

  if (NEWS_PATTERN.test(text)) {
    const keywords = compactList(result?.newsContext?.keywords, 6) || "아직 뉴스 키워드가 연결되지 않았습니다.";
    const topNews = (result?.newsContext?.topItems || [])[0];
    return [
      `뉴스/리포트 키워드는 ${keywords}입니다.`,
      topNews ? `대표 기사: ${topNews.title} (${topNews.source})` : "대표 기사 Top3를 먼저 불러와 주세요.",
      `뉴스 심리는 ${result?.newsContext?.sentiment || "미연결"}로 반영했습니다.`
    ].join("\n");
  }

  if (STRATEGY_PATTERN.test(text)) {
    return [
      `현재 ${regime} 국면에서는 전략을 바로 실행하기보다 후보와 회피 후보를 나눠 보는 방식입니다.`,
      `Top 검토 후보: ${compactList(result?.strategy?.top) || "아직 후보가 없습니다."}`,
      `Avoid 검토 후보: ${compactList(result?.strategy?.avoid) || "아직 회피 후보가 없습니다."}`
    ].join("\n");
  }

  if (REGIME_PATTERN.test(text)) {
    return [
      `${regime}은 지금 시장을 한 단어로 요약한 상태값입니다.`,
      regime === "Transition"
        ? "Transition은 방향을 단정하기보다 이벤트, 변동성, 뉴스 흐름을 더 검토해야 하는 구간입니다."
        : "이 국면은 방향성, 변동성, 이벤트 리스크를 함께 보고 분류한 결과입니다.",
      `핵심 근거: ${compactList(result?.evidence, 2)}`
    ].join("\n");
  }

  return [
    `현재 화면은 ${regime} 국면과 확신도 ${confidencePercent}%를 기준으로 설명합니다.`,
    "초보자 기준으로는 '오늘 시장이 어떤 상태인지', '왜 확신도가 그런지', '무엇을 조심해야 하는지' 순서로 보면 됩니다.",
    `가장 먼저 볼 근거: ${compactList(result?.evidence, 2)}`
  ].join("\n");
}
