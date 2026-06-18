import test from "node:test";
import assert from "node:assert/strict";

import { copyTextWithFallback } from "../src/clipboard-copy.mjs";

test("copies with navigator clipboard when available", async () => {
  let copied = "";
  const result = await copyTextWithFallback("report text", {
    clipboard: {
      writeText: async (text) => {
        copied = text;
      }
    },
    fallbackWriteText: () => {
      throw new Error("fallback should not run");
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.method, "clipboard");
  assert.equal(copied, "report text");
});

test("falls back when clipboard write fails", async () => {
  let fallbackCopied = "";
  const result = await copyTextWithFallback("report text", {
    clipboard: {
      writeText: async () => {
        throw new Error("NotAllowedError");
      }
    },
    fallbackWriteText: (text) => {
      fallbackCopied = text;
      return true;
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.method, "fallback");
  assert.equal(fallbackCopied, "report text");
});

test("can prefer the synchronous fallback before trying async clipboard", async () => {
  let fallbackCopied = "";
  let clipboardCalled = false;
  const result = await copyTextWithFallback("report text", {
    preferFallback: true,
    clipboard: {
      writeText: async () => {
        clipboardCalled = true;
      }
    },
    fallbackWriteText: (text) => {
      fallbackCopied = text;
      return true;
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.method, "fallback");
  assert.equal(fallbackCopied, "report text");
  assert.equal(clipboardCalled, false);
});

test("returns failure when both clipboard and fallback fail", async () => {
  const result = await copyTextWithFallback("report text", {
    clipboard: null,
    fallbackWriteText: () => false
  });

  assert.equal(result.ok, false);
  assert.equal(result.method, "none");
  assert.match(result.error, /copy failed/i);
});
