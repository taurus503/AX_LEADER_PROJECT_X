function compactList(items, limit = 3) {
  return (items || []).slice(0, limit).filter(Boolean).join(", ");
}

export function answerBeginnerQuestion(question, result) {
  const text = String(question || "").trim();
  if (!text) {
    return "질문을 입력해 주세요. 예: '왜 73%인가요?', '뉴스는 왜 중요하죠?', '지금은 어떤 전략이 좋아요?'";
  }

  const regime = result?.regime?.label || "현재 국면";
  const confidencePercent = Math.round((result?.confidence?.score || 0) * 100);
  const plusReasons = (result?.confidence?.reasons || []).filter((reason) => reason.impact === "plus");
  const minusReasons = (result?.confidence?.reasons || []).filter((reason) => reason.impact === "minus");

  if (/왜.*%|확신도|confidence|점수/i.test(text)) {
    return [
      `확신도는 ${confidencePercent}%이며, 현재 국면은 ${regime}입니다.`,
      `근거가 되는 플러스 요소: ${compactList(plusReasons.map((reason) => reason.title)) || "특별한 플러스 요소 없음"}`,
      `낮춘 요소: ${compactList(minusReasons.map((reason) => reason.title)) || "특별한 감점 요소 없음"}`,
      result?.confidence?.summary || "확신도는 수익률, 변동성, 이벤트 리스크, breadth를 함께 봅니다."
    ].join("\n");
  }

  if (/뉴스|리포트|기사/i.test(text)) {
    const keywords = compactList(result?.newsContext?.keywords, 6) || "최근 키워드가 충분하지 않습니다.";
    const topNews = (result?.newsContext?.topItems || [])[0];
    return [
      `최근 뉴스/리포트 키워드는 ${keywords} 입니다.`,
      topNews ? `대표 기사: ${topNews.title} (${topNews.source || "news"})` : "최근 기사 Top3가 아직 로드되지 않았습니다.",
      `현재 뉴스 심리는 ${result?.newsContext?.sentiment || "neutral"} 로 반영됩니다.`
    ].join("\n");
  }

  if (/전략|추천|avoid|비추천|플레이북/i.test(text)) {
    return [
      `현재 ${regime} 국면에서는 Top 전략을 ${compactList(result?.strategy?.top, 3)} 순으로 우선 검토합니다.`,
      `비추천 전략은 ${compactList(result?.strategy?.avoid, 3)} 입니다.`,
      "이 화면은 투자판단을 대신하지 않고 검토 포인트를 정리해 드립니다."
    ].join("\n");
  }

  if (/국면|레짐|regime/i.test(text)) {
    return [
      `현재 시장은 ${regime} 입니다.`,
      result?.regimeReason || "국면 이유가 아직 계산되지 않았습니다.",
      result?.marketInterpretation || "현재 해석을 확인해 주세요."
    ].join("\n");
  }

  return [
    `질문에 맞춰 현재 ${regime} 국면을 기준으로 설명드립니다.`,
    "이 화면은 시장 국면, 뉴스, 전략을 한 번에 묶어 검토 포인트를 보여줍니다.",
    `더 구체적으로 묻고 싶다면 '왜 ${confidencePercent}%인가요?' 또는 '뉴스는 왜 중요하죠?'처럼 입력해 보세요.`
  ].join("\n");
}
