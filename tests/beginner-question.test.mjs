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
      { impact: "plus", title: "이벤트 리스크", text: "이벤트 전후 국면 전환 가능성을 높입니다." },
      { impact: "minus", title: "모델 상태", text: "Gelman-Rubin 값이 1.12로 1.10을 넘었습니다." }
    ]
  },
  evidence: [
    "1개월 수익률 13.55% / 1주 수익률 16.77%로 방향성을 점검했습니다.",
    "뉴스/리포트 Top3 키워드는 코스피, 야간선물, 옵션입니다."
  ],
  strategy: {
    top: ["방향성 노출 축소 후보 검토", "이벤트 통과 후 재분류 대기"],
    avoid: ["강한 방향성 단정", "이벤트 전 고레버리지 진입"]
  },
  newsContext: {
    sentiment: "positive",
    keywords: ["코스피", "야간선물", "옵션"],
    topItems: [{ title: "코스피200 야간선물 상승", source: "핀포인트뉴스" }]
  }
};

test("explains regime in beginner language", () => {
  const answer = answerBeginnerQuestion("Transition이 뭐야?", sampleResult);

  assert.match(answer, /Transition/);
  assert.match(answer, /방향/);
  assert.match(answer, /검토/);
});

test("explains confidence reasons", () => {
  const answer = answerBeginnerQuestion("왜 49%야?", sampleResult);

  assert.match(answer, /49|확신도/);
  assert.match(answer, /모델 상태|이벤트/);
});

test("refuses direct buy or sell recommendation framing", () => {
  const answer = answerBeginnerQuestion("지금 매수해도 돼?", sampleResult);

  assert.match(answer, /매수|매도|투자판단/);
  assert.match(answer, /검토/);
});
