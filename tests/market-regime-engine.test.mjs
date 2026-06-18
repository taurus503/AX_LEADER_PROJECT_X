import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeRegime,
  SCENARIOS
} from "../src/market-regime-engine.mjs";

test("classifies a high-return low-volatility scenario as Bull/Calm", () => {
  const result = analyzeRegime(SCENARIOS.bullCalm);

  assert.equal(result.regime.id, "Bull/Calm");
  assert.ok(result.confidence.score >= 0.7);
  assert.equal(result.constraints.sumOfWeights, 1);
  assert.equal(result.constraints.tradabilityMaskCompliance, true);
  assert.ok(result.strategy.top.length >= 3);
});

test("classifies a sharp negative high-volatility scenario as Bear/Crisis and prioritizes cash", () => {
  const result = analyzeRegime(SCENARIOS.bearCrisis);

  assert.equal(result.regime.id, "Bear/Crisis");
  assert.ok(result.allocation.weights.Cash >= 0.65);
  assert.ok(result.strategy.avoid.length >= 3);
  assert.match(result.report.committeeSummary, /방어|현금|리스크/);
});

test("classifies mixed direction and high event risk as Transition", () => {
  const result = analyzeRegime(SCENARIOS.transition);

  assert.equal(result.regime.id, "Transition");
  assert.ok(result.confidence.score < 0.8);
  assert.match(result.report.committeeSummary, /검토|전환|방향성/);
});

test("uses fail-safe cash override when input is not finite or tradability mask is invalid", () => {
  const result = analyzeRegime({
    ...SCENARIOS.bullCalm,
    volatility20d: Number.NaN,
    tradabilityMaskValid: false
  });

  assert.equal(result.regime.id, "Fail-Safe");
  assert.equal(result.allocation.weights.Cash, 1);
  assert.equal(result.constraints.tradabilityMaskCompliance, false);
  assert.match(result.report.committeeSummary, /Fail-Safe|상담|검증/);
});
