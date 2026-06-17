const DEFAULT_QUERY = '"KOSPI200" OR "KOSPI 200" OR "코스피200" OR "코스피 200" when:7d';
const BLOCKED_SOURCES = new Set(["kmrk.ru"]);

function decodeHtml(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, "<")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function tagValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeHtml(match?.[1] || "");
}

function sourceValue(block) {
  const match = block.match(/<source\s+url="([^"]*)">([\s\S]*?)<\/source>/i);
  return {
    sourceUrl: decodeHtml(match?.[1] || ""),
    source: decodeHtml(match?.[2] || "")
  };
}

function cleanTitle(title, source) {
  const cleaned = decodeHtml(title).replace(/\s+/g, " ").trim();
  if (!source) return cleaned;
  return cleaned.replace(new RegExp(`\\s-\\s${source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), "").trim();
}

function isRelevant(item) {
  const title = String(item.title || "");
  const relevant = /(kospi\s?200|코스피\s?200|옵션|지수선물|ETF|ETN|cover|hedge|변동성|breadth)/i.test(title);
  const sourceKey = String(item.source || "").toLowerCase();
  const sourceHost = String(item.sourceUrl || "").replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
  if (BLOCKED_SOURCES.has(sourceKey) || BLOCKED_SOURCES.has(sourceHost)) return false;
  return relevant;
}

export function buildGoogleNewsRssUrl(query = DEFAULT_QUERY) {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "ko");
  url.searchParams.set("gl", "KR");
  url.searchParams.set("ceid", "KR:ko");
  return url;
}

export function parseGoogleNewsRss(xml, options = {}) {
  const limit = options.limit || 12;
  const itemBlocks = String(xml || "").match(/<item>[\s\S]*?<\/item>/gi) || [];
  const items = itemBlocks
    .map((block) => {
      const source = sourceValue(block);
      const rawTitle = tagValue(block, "title");
      const publishedAt = tagValue(block, "pubDate");
      return {
        title: cleanTitle(rawTitle, source.source),
        link: tagValue(block, "link"),
        publishedAt,
        timestamp: Number.isFinite(Date.parse(publishedAt)) ? Date.parse(publishedAt) : 0,
        ...source
      };
    })
    .filter((item) => item.title && item.link && isRelevant(item))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);

  return {
    provider: "Google News RSS",
    fetchedAt: new Date().toISOString(),
    items
  };
}

export function extractNewsKeywords(items, limit = 8) {
  const counts = new Map();
  for (const item of items || []) {
    const tokens = String(item.title || "")
      .replace(/[()[\]'"'"'".,:!?/]/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2 && !/^\d+/.test(token));
    for (const token of tokens) {
      counts.set(token, (counts.get(token) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .slice(0, limit)
    .map(([keyword]) => keyword);
}

export function summarizeNewsContext(items, options = {}) {
  const pageSize = options.pageSize || 3;
  const offset = options.offset || 0;
  const allItems = (items || []).filter(Boolean);
  const topItems = allItems.slice(offset, offset + pageSize);
  const text = topItems.map((item) => item.title).join(" ");
  const positive = /(상승|강세|호조|개선|확대|반등|증가)/i.test(text);
  const negative = /(하락|약세|부진|축소|위험|경계|감소)/i.test(text);
  const sentiment = positive && negative ? "mixed" : positive ? "positive" : negative ? "negative" : "neutral";
  const keywords = extractNewsKeywords(topItems);

  return {
    provider: "Google News RSS",
    asOf: new Date().toISOString().slice(0, 10),
    sentiment,
    keywords,
    allItems,
    pageInfo: {
      offset,
      pageSize,
      startRank: topItems.length ? offset + 1 : 0,
      endRank: offset + topItems.length,
      total: allItems.length
    },
    topItems,
    interpretation: keywords.length
      ? `최근 뉴스/리포트에서 ${keywords.slice(0, 5).join(", ")} 흐름이 반복됩니다.`
      : "최근 뉴스/리포트의 반복 키워드가 충분하지 않습니다."
  };
}

export async function fetchGoogleNewsContext(fetchImpl = fetch) {
  const response = await fetchImpl(buildGoogleNewsRssUrl(), {
    headers: {
      "User-Agent": "Mozilla/5.0 KOSPI200-Option-Warfare/1.0",
      "Accept": "application/rss+xml, application/xml, text/xml"
    }
  });

  if (!response.ok) {
    throw new Error(`Google News RSS request failed (${response.status})`);
  }

  const xml = await response.text();
  return summarizeNewsContext(parseGoogleNewsRss(xml, { limit: 12 }).items);
}
