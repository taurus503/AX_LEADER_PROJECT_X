const fs = require("fs");
const path = require("path");

const workspace = path.resolve(__dirname, "..");
const csvPath = path.join(__dirname, "hana_classifier_dataset.csv");
const modelPath = path.join(__dirname, "hana_category_classifier.json");
const reportPath = path.join(__dirname, "hana_category_classifier_report.txt");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }

  const header = rows.shift().map((h) => h.replace(/^\uFEFF/, ""));
  return rows
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

function seededShuffle(items, seed = 20260615) {
  let x = seed;
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    x = (x * 1664525 + 1013904223) >>> 0;
    const j = x % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
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

function train(rows) {
  const model = {
    labels: {},
    vocabulary: {},
    totalDocs: rows.length,
    alpha: 0.5,
  };

  for (const row of rows) {
    const label = row.category;
    if (!model.labels[label]) {
      model.labels[label] = { docCount: 0, tokenCount: 0, tokens: {} };
    }
    model.labels[label].docCount += 1;

    for (const token of features(row.question)) {
      model.vocabulary[token] = 1;
      model.labels[label].tokens[token] = (model.labels[label].tokens[token] || 0) + 1;
      model.labels[label].tokenCount += 1;
    }
  }

  return model;
}

function predict(model, text) {
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

const rows = parseCsv(fs.readFileSync(csvPath, "utf8"))
  .map((row) => ({ category: row.category, question: row.text || row.question }))
  .filter((row) => row.category && row.question);

if (rows.length < 10) {
  throw new Error("Not enough rows to train classifier.");
}

const shuffled = seededShuffle(rows).slice(0, 12000);
const split = Math.max(1, Math.floor(shuffled.length * 0.8));
const trainRows = shuffled.slice(0, split);
const testRows = shuffled.slice(split);
const model = train(trainRows);

let correct = 0;
for (const row of testRows) {
  if (predict(model, row.question) === row.category) correct += 1;
}

const accuracy = testRows.length ? correct / testRows.length : 0;
const labelCount = Object.keys(model.labels).length;

const examples = [
  "카드를 잃어버려서 분실 신고를 하고 싶어요",
  "카드 대금을 지금 바로 선결제하고 싶어요",
  "해외에서 카드 결제가 안 돼요",
].map((question) => ({ question, prediction: predict(model, question) }));

fs.writeFileSync(modelPath, JSON.stringify(model, null, 2), "utf8");

const report = [
  `accuracy=${(accuracy * 100).toFixed(1)}% (${correct}/${testRows.length})`,
  `rows=${rows.length}, train=${trainRows.length}, test=${testRows.length}, categories=${labelCount}`,
  "examples:",
  ...examples.map((item, index) => `${index + 1}. ${item.question} => ${item.prediction}`),
].join("\n");

fs.writeFileSync(reportPath, `${report}\n`, "utf8");
console.log(report);
