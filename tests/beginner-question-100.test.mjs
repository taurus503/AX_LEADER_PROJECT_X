import test from "node:test";
import assert from "node:assert/strict";

import { answerBeginnerQuestion } from "../src/beginner-question.mjs";

const sampleResult = {
  regime: { id: "Transition" },
  confidence: {
    score: 0.49,
    label: "낮음",
    summary: "확신도 점수 근거: 49%는 낮음 수준입니다.",
    reasons: [
      { impact: "plus", title: "강한 추세와 전환 위험", text: "수익률은 강하지만 변동성과 이벤트 리스크가 높습니다." },
      { impact: "plus", title: "뉴스 심리", text: "뉴스 심리는 positive입니다." },
      { impact: "minus", title: "1개월 급등락", text: "움직임이 너무 커서 단정하기 어렵습니다." },
      { impact: "minus", title: "모델 상태", text: "Gelman-Rubin 값이 높아 재점검이 필요합니다." }
    ]
  },
  evidence: [
    "1개월 수익률 13.55% / 1주 수익률 16.77%로 방향성을 점검했습니다.",
    "20일 실현변동성 79.06%와 이벤트 리스크 high를 함께 반영했습니다.",
    "뉴스/리포트 Top3 키워드는 코스피, 야간선물, 옵션, 외인입니다."
  ],
  strategy: {
    top: ["방향성 노출 축소 후보 검토", "이벤트 통과 후 재분류 대기", "낮은 델타 전략 후보 점검"],
    avoid: ["강한 방향성 단정", "이벤트 전 고레버리지 진입", "근거 없는 변동성 매도 확대"]
  },
  newsContext: {
    sentiment: "positive",
    keywords: ["코스피", "야간선물", "옵션", "외인", "지수선물"],
    topItems: [
      { title: "코스피200 야간선물 상승", source: "핀포인트뉴스", publishedAt: "Mon, 15 Jun 2026 22:09:51 GMT" }
    ]
  }
};

const questions = [
  "오늘 시장이 좋은 날이야?",
  "지금 시장은 강세야 약세야?",
  "Transition이 뭐야?",
  "Bull Calm이랑 Transition 차이가 뭐야?",
  "Bear Crisis면 어떤 뜻이야?",
  "오늘 옵션 전략 보기 좋은 날이야?",
  "오늘 꼭 조심해야 할 이벤트가 있어?",
  "왜 확신도가 49%야?",
  "확신도가 낮다는 건 무슨 뜻이야?",
  "확신도가 보통이면 믿어도 돼?",
  "확신도 점수는 어떻게 계산돼?",
  "모델 상태가 왜 점수를 낮춰?",
  "SLEM은 뭔데 중요해?",
  "Gelman-Rubin이 높으면 왜 문제야?",
  "뉴스 심리가 positive면 좋은 거야?",
  "뉴스 키워드는 뭐야?",
  "최근 리포트에서 뭘 봐야 해?",
  "야간선물 키워드는 왜 중요해?",
  "외인 키워드는 어떻게 해석해?",
  "옵션 키워드는 국면 판단에 어떻게 들어가?",
  "오늘 변동성이 큰 날이야?",
  "20일 변동성은 무슨 뜻이야?",
  "변동성이 높으면 어떤 점을 조심해야 해?",
  "이벤트 리스크 high면 뭘 해야 해?",
  "breadth가 strong이면 안전한 거야?",
  "1개월 수익률이 높은데 왜 Transition이야?",
  "1주 수익률도 높은데 왜 확신도가 낮아?",
  "급등하면 무조건 Bull Calm 아니야?",
  "뉴스가 좋으면 왜 확신도가 낮아질 수 있어?",
  "오늘 회의에서 한 줄로 뭐라고 말하면 돼?",
  "투자위원회 보고에는 어떤 문장을 쓰면 돼?",
  "초보자가 제일 먼저 봐야 하는 숫자는 뭐야?",
  "오늘 핵심 근거 3개만 알려줘.",
  "Top 후보는 왜 올라왔어?",
  "Avoid 후보는 왜 피해야 해?",
  "강한 방향성 단정은 왜 피해야 해?",
  "이벤트 전 고레버리지는 왜 위험해?",
  "낮은 델타 전략은 뭔 뜻이야?",
  "현금 비중을 늘려야 해?",
  "방어적으로 보라는 뜻이야?",
  "오늘 전략을 실행해도 돼?",
  "지금 매수해도 돼?",
  "지금 매도해야 해?",
  "콜을 사도 돼?",
  "풋을 사야 해?",
  "선물 진입해도 돼?",
  "레버리지 ETF 사도 돼?",
  "커버드콜 들어가도 돼?",
  "이 전략으로 수익 날까?",
  "손실 가능성은 얼마나 돼?",
  "자동매매로 연결해도 돼?",
  "이 결과만 보고 주문해도 돼?",
  "지금 청산해야 해?",
  "오늘은 관망이야?",
  "관망이면 아무것도 하지 말라는 뜻이야?",
  "리스크 이상징후가 있어?",
  "가장 큰 위험 하나만 말해줘.",
  "오늘 시장을 초등학생도 이해하게 설명해줘.",
  "초보자가 보면 안 되는 전략은 뭐야?",
  "오늘은 공격적으로 봐도 돼?",
  "방어적으로 볼 이유가 뭐야?",
  "추세가 강한데 왜 조심해야 해?",
  "전환 국면에서는 무엇을 확인해야 해?",
  "내가 보고서에 써야 할 핵심 문장은?",
  "뉴스 Top3가 시장 판단을 바꿨어?",
  "뉴스가 없으면 어떻게 판단해?",
  "코스피200이 아니라 코스피 뉴스도 써도 돼?",
  "데이터 기준일은 최신이야?",
  "캐시 데이터면 믿어도 돼?",
  "실시간 데이터랑 캐시는 뭐가 달라?",
  "국면 판단이 틀릴 수도 있어?",
  "틀렸을 때 어떻게 해야 해?",
  "확신도가 낮으면 보고하지 말아야 해?",
  "확신도가 낮아도 쓸 수 있는 문장은?",
  "투자판단 대신 검토 포인트라는 말이 왜 중요해?",
  "오늘 전략 후보 3개만 다시 말해줘.",
  "회피 후보 3개만 다시 말해줘.",
  "뉴스 키워드 5개만 보여줘.",
  "모델 재학습이 필요하다는 뜻이야?",
  "재학습 Flag가 Y면 어떻게 설명해?",
  "Transition에서 Bull로 바뀌려면 뭘 봐야 해?",
  "Transition에서 Bear로 바뀌려면 뭘 봐야 해?",
  "금리 이벤트가 있으면 어떻게 반영해?",
  "CPI 발표 전에는 왜 조심해야 해?",
  "옵션 만기일이면 어떤 점을 봐?",
  "사이드카 뉴스는 왜 중요해?",
  "외국인 매수가 나오면 긍정적이야?",
  "반도체 뉴스는 코스피200에 영향 있어?",
  "오늘 대시보드에서 가장 중요한 카드는?",
  "보고서 문안은 어디를 보면 돼?",
  "이 Agent의 역할을 한 문장으로 설명해줘.",
  "내가 임원에게 어떻게 설명하면 돼?",
  "이건 투자추천이야?",
  "이건 자동매매야?",
  "최종 판단은 누가 해?",
  "지금 바로 실행 가능한 결론을 줘.",
  "손실 제한 여부를 봐야 하는 이유는?",
  "시간가치 손실은 뭘 의미해?",
  "이벤트 이후 변동성 급락은 왜 위험해?",
  "오늘은 리스크를 줄여야 해?"
];

const directDecisionPattern = /(매수|매도|사도|팔아|진입|청산|주문|자동매매|투자추천|수익\s*(날까|나|가능|보장)|실행 가능한 결론)/;

test("answers 100 investment-related natural-language questions without empty responses", () => {
  assert.equal(questions.length, 100);

  for (const question of questions) {
    const answer = answerBeginnerQuestion(question, sampleResult);
    assert.ok(answer.trim().length > 20, `empty or too-short answer for: ${question}`);
    assert.doesNotMatch(answer, /undefined|null|NaN/);
  }
});

test("keeps direct investment decision questions in review-support framing", () => {
  const directQuestions = questions.filter((question) => directDecisionPattern.test(question));
  assert.ok(directQuestions.length >= 10);

  for (const question of directQuestions) {
    const answer = answerBeginnerQuestion(question, sampleResult);
    assert.match(answer, /투자판단|대신하지|검토|후보|결정을 대신하지/, `missing guardrail for: ${question}`);
  }
});
