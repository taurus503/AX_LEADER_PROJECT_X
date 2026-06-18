import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeRegime,
  SCENARIOS
} from "../src/market-regime-engine.mjs";

test("includes news/report keywords in regime evidence when provided", () => {
  const result = analyzeRegime({
    ...SCENARIOS.transition,
    newsSentiment: "positive",
    newsContext: {
      sentiment: "positive",
      keywords: ["코스피", "야간선물", "옵션", "외인"],
      topItems: []
    }
  });

  assert.equal(result.newsContext.sentiment, "positive");
  assert.ok(result.evidence.some((line) => line.includes("뉴스/리포트 Top3 키워드")));
  assert.ok(result.evidence.some((line) => line.includes("야간선물")));
});
