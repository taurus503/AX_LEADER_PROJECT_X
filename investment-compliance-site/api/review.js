const { buildReview, LEGAL_SOURCES } = require("../lib/review-engine");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const input = normalizeInput(req.body || {});
    const referencedKeys = collectReferencedKeys(input);
    const liveStatuses = await fetchLiveStatuses(referencedKeys);
    const review = buildReview(input, liveStatuses);

    res.status(200).json({
      meta: {
        sourceMode: "공식 법령 원문팩 + 국가법령정보센터 링크 확인",
        generatedAt: new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
      },
      review
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || "검토 결과 생성 중 오류가 발생했습니다."
    });
  }
};

function normalizeInput(body) {
  return {
    fundType: body.fundType || "",
    hedgePolicy: body.hedgePolicy || "",
    leveragePolicy: body.leveragePolicy || "",
    lifeRatio: toNumber(body.lifeRatio),
    affiliateRatio: toNumber(body.affiliateRatio),
    foreignRatio: toNumber(body.foreignRatio) || 0,
    features: Array.isArray(body.features) ? body.features : [],
    assetTargets: Array.isArray(body.assetTargets) ? body.assetTargets : [],
    allocations: body.allocations && typeof body.allocations === "object" ? body.allocations : {}
  };
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function collectReferencedKeys(input) {
  const keys = new Set(["insurance104", "insurance106"]);

  if (input.assetTargets.includes("crypto")) keys.add("virtualAsset2");
  if (input.assetTargets.includes("derivatives")) {
    keys.add("capital81");
    keys.add("private2497");
  }
  if (input.assetTargets.includes("real-estate")) {
    keys.add("insurance106");
    keys.add("private2497");
  }
  if (input.assetTargets.includes("loan")) keys.add("private2497");
  if (input.fundType === "general-private") {
    keys.add("private2492");
    keys.add("private2494");
  }
  if (input.features.includes("affiliate-manager") || input.features.includes("affiliate-investor") || input.features.includes("affiliate-seller")) {
    keys.add("capital44");
    keys.add("capital45");
    keys.add("capital87");
  }
  if ((input.affiliateRatio ?? 0) >= 30) keys.add("private2497");
  if ((input.lifeRatio ?? 0) > 0) keys.add("insurance106");
  if (input.features.includes("major-shareholder")) {
    keys.add("insurance111");
    keys.add("governance27");
  }

  return [...keys].filter((key) => LEGAL_SOURCES[key]);
}

async function fetchLiveStatuses(keys) {
  const entries = await Promise.all(keys.map(async (key) => [key, await fetchSourceStatus(LEGAL_SOURCES[key].sourceUrl)]));
  return Object.fromEntries(entries);
}

async function fetchSourceStatus(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "investment-compliance-demo/1.0"
      }
    });

    const html = await response.text();
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);

    return {
      reachable: response.ok,
      title: titleMatch ? cleanText(titleMatch[1]) : ""
    };
  } catch (error) {
    return {
      reachable: false,
      title: ""
    };
  } finally {
    clearTimeout(timeout);
  }
}

function cleanText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}
