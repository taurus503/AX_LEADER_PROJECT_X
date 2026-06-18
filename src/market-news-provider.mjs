import { normalizeDateInput } from "./market-data-provider.mjs";

const DEFAULT_QUERY = '"KOSPI200" OR "KOSPI 200" OR "KOSPI" OR "ETF"';
const BLOCKED_SOURCES = new Set(["kmrk.ru"]);

function decodeHtml(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
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

function buildDateWindow(asOf) {
  const date = normalizeDateInput(asOf);
  if (!date) return null;
  const nextDay = new Date(`${date}T00:00:00Z`);
  nextDay.setDate(nextDay.getDate() + 1);
  return {
    date,
    before: nextDay.toISOString().slice(0, 10)
  };
}

function buildQueryWithDate(query, asOf) {
  const window = buildDateWindow(asOf);
  if (!window) return query;
  return `${query} after:${window.date} before:${window.before}`;
}

export function buildGoogleNewsRssUrl(query = DEFAULT_QUERY) {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "ko");
  url.searchParams.set("gl", "KR");
  url.searchParams.set("ceid", "KR:ko");
  return url.toString();
}

export function buildGoogleNewsSearchUrl(query = DEFAULT_QUERY, asOf) {
  const url = new URL("https://news.google.com/search");
  url.searchParams.set("q", buildQueryWithDate(query, asOf));
  url.searchParams.set("hl", "ko");
  url.searchParams.set("gl", "KR");
  url.searchParams.set("ceid", "KR:ko");
  return url.toString();
}

function isRelevant(item) {
  const title = String(item.title || "");
  const relevant = /(kospi\s?200|kospi|etf|etn|option|volatility|breadth)/i.test(title);
  const sourceKey = String(item.source || "").toLowerCase();
  const sourceHost = String(item.sourceUrl || "").replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
  if (BLOCKED_SOURCES.has(sourceKey) || BLOCKED_SOURCES.has(sourceHost)) return false;
  return relevant;
}

export function parseGoogleNewsRss(xml, options = {}) {
  const limit = options.limit || 12;
  const asOf = options.asOf;
  const itemBlocks = String(xml || "").match(/<item>[\s\S]*?<\/item>/gi) || [];
  const items = itemBlocks
    .map((block) => {
      const source = sourceValue(block);
      const rawTitle = tagValue(block, "title");
      const publishedAt = tagValue(block, "pubDate");
      const title = cleanTitle(rawTitle, source.source);
      return {
        title,
        link: tagValue(block, "link"),
        publishedAt,
        timestamp: Number.isFinite(Date.parse(publishedAt)) ? Date.parse(publishedAt) : 0,
        ...source,
        searchUrl: buildGoogleNewsSearchUrl(`"${title}"`, asOf)
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
  const asOf = normalizeDateInput(options.asOf) || new Date().toISOString().slice(0, 10);
  const allItems = (items || []).filter(Boolean).map((item) => ({
    ...item,
    sourceUrl: item.sourceUrl || item.link || "",
    searchUrl: item.searchUrl || buildGoogleNewsSearchUrl(`"${item.title || ""}"`, asOf)
  }));
  const topItems = allItems.slice(offset, offset + pageSize);
  const text = topItems.map((item) => item.title).join(" ");
  const positive = ["\uC0C1\uC2B9", "\uAC15\uC138", "\uD638\uD669", "\uBC18\uB4F1", "\uAC1C\uC120", "\uD655\uB300"]
    .some((term) => text.includes(term));
  const negative = ["\uD558\uB77D", "\uC57D\uC138", "\uCE68\uCCB4", "\uC704\uD5D8", "\uAC10\uC18C", "\uC545\uD654"]
    .some((term) => text.includes(term));
  const sentiment = positive && negative ? "mixed" : positive ? "positive" : negative ? "negative" : "neutral";
  const keywords = extractNewsKeywords(topItems);

  return {
    provider: "Google News RSS",
    asOf,
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
      ? `최근 뉴스/리포트에서 ${keywords.slice(0, 5).join(", ")} 키워드가 반복됩니다.`
      : "최근 뉴스/리포트의 반복 키워드를 충분히 추출하지 못했습니다."
  };
}

export async function fetchGoogleNewsContext(fetchImpl = fetch, options = {}) {
  const query = buildQueryWithDate(DEFAULT_QUERY, options.asOf);
  const response = await fetchImpl(buildGoogleNewsRssUrl(query), {
    headers: {
      "User-Agent": "Mozilla/5.0 KOSPI200-Option-Warfare/1.0",
      "Accept": "application/rss+xml, application/xml, text/xml"
    }
  });

  if (!response.ok) {
    throw new Error(`Google News RSS request failed (${response.status})`);
  }

  const xml = await response.text();
  return summarizeNewsContext(parseGoogleNewsRss(xml, { limit: 12, asOf: options.asOf }).items, { asOf: options.asOf });
}
