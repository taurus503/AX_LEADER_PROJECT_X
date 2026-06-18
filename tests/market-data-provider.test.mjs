import test from "node:test";
import assert from "node:assert/strict";

import {
  buildYahooChartUrl,
  computeFeaturesFromPrices,
  parseYahooChartResponse
} from "../src/market-data-provider.mjs";

const sampleChartResponse = {
  chart: {
    result: [
      {
        meta: {
          symbol: "^KS200",
          regularMarketPrice: 423.5,
          currency: "KRW",
          exchangeName: "KSC"
        },
        timestamp: Array.from({ length: 31 }, (_, index) => 1717200000 + index * 86400),
        indicators: {
          quote: [
            {
              close: Array.from({ length: 31 }, (_, index) => 400 + index),
              volume: Array.from({ length: 31 }, (_, index) => 100000 + index * 1000)
            }
          ]
        }
      }
    ],
    error: null
  }
};

test("builds a Yahoo chart URL for KOSPI200 without exposing credentials", () => {
  const url = buildYahooChartUrl("^KS200");

  assert.equal(url.hostname, "query1.finance.yahoo.com");
  assert.match(url.pathname, /\/v8\/finance\/chart\/%5EKS200$/);
  assert.equal(url.searchParams.get("range"), "3mo");
  assert.equal(url.searchParams.get("interval"), "1d");
});

test("parses Yahoo chart response into dated close points", () => {
  const parsed = parseYahooChartResponse(sampleChartResponse);

  assert.equal(parsed.symbol, "^KS200");
  assert.equal(parsed.points.length, 31);
  assert.equal(parsed.points.at(-1).close, 430);
  assert.equal(parsed.provider, "Yahoo Finance chart");
});

test("computes regime input features from price history", () => {
  const parsed = parseYahooChartResponse(sampleChartResponse);
  const features = computeFeaturesFromPrices(parsed);

  assert.equal(features.symbol, "^KS200");
  assert.ok(features.returns.oneDay > 0);
  assert.ok(features.returns.oneWeek > 0);
  assert.ok(features.returns.oneMonth > 0);
  assert.ok(features.volatility20d >= 0);
  assert.equal(features.tradabilityMaskValid, true);
  assert.equal(features.newsSentiment, "mixed");
});
