const fs = require("fs");
const path = require("path");

const modelPath = path.join(__dirname, "hana_category_classifier.json");
const model = JSON.parse(fs.readFileSync(modelPath, "utf8"));
const question = process.argv.slice(2).join(" ").trim();

if (!question) {
  console.error("Usage: node ml/predict_category.js \"질문 문장\"");
  process.exit(1);
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[“”"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function features(text) {
  const stopwords = new Set([
    "상담사", "손님", "고객", "네", "아", "어", "예", "그", "저", "좀", "이제",
    "혹시", "제가", "저희", "그러면", "그럼", "일단", "확인", "감사합니다",
  ]);
  const tokens = normalize(text)
    .slice(0, 1800)
    .split(/[^0-9a-z가-힣]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !stopwords.has(token));
  return [...new Set(tokens)];
}

function predict(text) {
  const tokens = features(text);
  const vocabSize = Object.keys(model.vocabulary).length || 1;
  let best = { label: null, score: Number.NEGATIVE_INFINITY };

  for (const [label, stats] of Object.entries(model.labels)) {
    let score = Math.log(stats.docCount / model.totalDocs);
    const denom = stats.tokenCount + model.alpha * vocabSize;

    for (const token of tokens) {
      const count = stats.tokens[token] || 0;
      score += Math.log((count + model.alpha) / denom);
    }

    if (score > best.score) {
      best = { label, score };
    }
  }

  return best.label;
}

console.log(predict(question));
