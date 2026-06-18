import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGoogleNewsRssUrl,
  extractNewsKeywords,
  parseGoogleNewsRss,
  summarizeNewsContext
} from "../src/market-news-provider.mjs";

const sampleRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss><channel>
  <item>
    <title>코스피200 야간선물 상승…옵션 변동성 확대 - 연합뉴스</title>
    <link>https://news.google.com/rss/articles/1</link>
    <pubDate>Mon, 15 Jun 2026 00:16:54 GMT</pubDate>
    <source url="https://www.yna.co.kr">연합뉴스</source>
  </item>
  <item>
    <title>[표] 코스피 지수선물·옵션 시세표(15일)-1 - 매일경제 마켓</title>
    <link>https://news.google.com/rss/articles/2</link>
    <pubDate>Mon, 15 Jun 2026 07:31:14 GMT</pubDate>
    <source url="https://stock.mk.co.kr">매일경제 마켓</source>
  </item>
  <item>
    <title>온라인 룰렛 도박 와 관련된 문제 해결법 - kmrk.ru</title>
    <link>https://news.google.com/rss/articles/spam</link>
    <pubDate>Tue, 16 Jun 2026 00:00:00 GMT</pubDate>
    <source url="https://www.kmrk.ru">kmrk.ru</source>
  </item>
  <item>
    <title>코스피 급등에 매수 사이드카 발동 - 일반뉴스</title>
    <link>https://news.google.com/rss/articles/general</link>
    <pubDate>Mon, 15 Jun 2026 06:12:45 GMT</pubDate>
    <source url="https://example.com">일반뉴스</source>
  </item>
  <item>
    <title>GS건설 빠지고 HD건설기계 들어온다…코스피200 산업재 지형 변화 - 블로터</title>
    <link>https://news.google.com/rss/articles/3</link>
    <pubDate>Thu, 11 Jun 2026 02:43:22 GMT</pubDate>
    <source url="https://www.bloter.net">블로터</source>
  </item>
</channel></rss>`;

test("builds Google News RSS URL for KOSPI200", () => {
  const url = buildGoogleNewsRssUrl();

  assert.equal(url.hostname, "news.google.com");
  assert.match(url.pathname, /\/rss\/search$/);
  assert.match(url.searchParams.get("q"), /KOSPI200|코스피200/);
  assert.equal(url.searchParams.get("ceid"), "KR:ko");
});

test("parses RSS and filters irrelevant spam-like results", () => {
  const parsed = parseGoogleNewsRss(sampleRss, { limit: 3 });

  assert.equal(parsed.items.length, 3);
  assert.equal(parsed.items[0].source, "매일경제 마켓");
  assert.ok(parsed.items.every((item) => item.source !== "kmrk.ru"));
  assert.ok(parsed.items.every((item) => item.source !== "일반뉴스"));
});

test("extracts market keywords and summarizes news context", () => {
  const parsed = parseGoogleNewsRss(sampleRss, { limit: 3 });
  const keywords = extractNewsKeywords(parsed.items);
  const summary = summarizeNewsContext(parsed.items);

  assert.ok(keywords.includes("코스피200"));
  assert.ok(keywords.includes("야간선물") || keywords.includes("옵션"));
  assert.equal(summary.topItems.length, 3);
  assert.match(summary.sentiment, /positive|negative|mixed|neutral/);
  assert.ok(summary.keywords.length >= 3);
});

test("summarizes a later news page while preserving all fetched items", () => {
  const items = Array.from({ length: 7 }, (_, index) => ({
    title: `KOSPI200 테스트 뉴스 ${index + 1}`,
    link: `https://news.example/${index + 1}`,
    source: "테스트뉴스",
    publishedAt: "Tue, 16 Jun 2026 00:00:00 GMT"
  }));

  const summary = summarizeNewsContext(items, { offset: 3, pageSize: 3 });

  assert.equal(summary.topItems.length, 3);
  assert.equal(summary.topItems[0].title, "KOSPI200 테스트 뉴스 4");
  assert.equal(summary.pageInfo.startRank, 4);
  assert.equal(summary.pageInfo.endRank, 6);
  assert.equal(summary.pageInfo.total, 7);
  assert.equal(summary.allItems.length, 7);
});
