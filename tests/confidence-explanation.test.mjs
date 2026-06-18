import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeRegime,
  SCENARIOS
} from "../src/market-regime-engine.mjs";

test("explains confidence score with human-readable plus and minus reasons", () => {
  const result = analyzeRegime(SCENARIOS.transition);

  assert.ok(result.confidence.reasons.length >= 4);
  assert.ok(result.confidence.reasons.some((reason) => reason.impact === "plus"));
  assert.ok(result.confidence.reasons.some((reason) => reason.impact === "minus"));
  assert.match(result.confidence.summary, /confidence|score|basis|확신도|점수|근거/i);
});

test("fail-safe confidence explains why score is zero", () => {
  const result = analyzeRegime({
    ...SCENARIOS.bullCalm,
    volatility20d: Number.NaN,
    tradabilityMaskValid: false
  });

  assert.equal(result.confidence.score, 0);
  assert.equal(result.confidence.reasons[0].impact, "minus");
  assert.match(result.confidence.reasons[0].text, /Fail-Safe|invalid|검증/);
});
