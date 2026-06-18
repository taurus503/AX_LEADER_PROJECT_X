const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
const privateNumberPattern = /(\d{6,}|\d{6}-\d{7}|\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}|(?:\d[-\s]?){10,})/;
const sensitiveDecisionPattern = /(금액|결제일|한도|환급금|환급|청구금액|이용대금|결제대금)/;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".png": "image/png",
};

function readEnv() {
  if (!fs.existsSync(envPath)) return {};

  const env = {};
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index < 0) continue;

    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    const hashIndex = value.indexOf(" #");
    if (hashIndex >= 0) value = value.slice(0, hashIndex).trim();

    value = value.replace(/^[`'"“”]+|[`'"“”]+$/g, "").trim();
    if (key) env[key] = value;
  }

  return env;
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 64 * 1024) {
        reject(new Error("body_too_large"));
        req.destroy();
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function normalizeFaqs(faqs) {
  if (!Array.isArray(faqs)) return [];

  return faqs.slice(0, 5).map((faq, index) => ({
    number: Number(faq.number || index + 1),
    category: String(faq.category || "").slice(0, 160),
    question: String(faq.question || "").slice(0, 700),
    answer: String(faq.answer || "").slice(0, 900),
  })).filter((faq) => faq.question || faq.answer);
}

function fallbackAnswer(faqs) {
  if (!faqs.length) return "담당자 연결(1588-0000)";
  return `참고용 안내입니다. 담당자가 아래 FAQ를 확인한 뒤 고객에게 안내해 주세요.\n근거: FAQ #${faqs[0].number}`;
}

function postProcessAnswer(answer, question, faqs) {
  let text = String(answer || "").trim();
  if (!text) return fallbackAnswer(faqs);

  if (sensitiveDecisionPattern.test(`${question}\n${text}`) && !text.includes("참고용 안내")) {
    text = `참고용 안내입니다. ${text}`;
  }

  if (!/근거\s*:\s*FAQ\s*#\d+/.test(text) && faqs.length) {
    text = `${text}\n근거: FAQ #${faqs[0].number}`;
  }

  return text;
}

async function handleAnswer(req, res) {
  try {
    const body = JSON.parse(await readBody(req) || "{}");
    const question = String(body.question || "").trim();
    const faqs = normalizeFaqs(body.faqs);

    if (!question || privateNumberPattern.test(question)) {
      sendJson(res, 400, { error: "잠시 후 다시 시도해주세요" });
      return;
    }

    if (!faqs.length) {
      sendJson(res, 200, { answer: "담당자 연결(1588-0000)" });
      return;
    }

    const processEnv = typeof process === "undefined" ? {} : process.env;
    const env = { ...processEnv, ...readEnv() };
    const apiKey = env.BIZROUTER_API_KEY;
    const baseUrl = (env.BIZROUTER_BASE_URL || "https://api.bizrouter.ai/v1").replace(/\/+$/, "");
    const model = env.BIZROUTER_MODEL;

    if (!apiKey || !model) {
      sendJson(res, 503, { error: "잠시 후 다시 시도해주세요" });
      return;
    }

    const faqText = faqs.map((faq) => [
      `FAQ #${faq.number}`,
      `분류: ${faq.category || "분류 없음"}`,
      `질문: ${faq.question}`,
      `답변: ${faq.answer}`,
    ].join("\n")).join("\n\n");

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: [
              "너는 민원 FAQ 기반 답변 초안 작성 도우미다.",
              "제공된 FAQ 근거 안에서만 답한다.",
              "쉬운 말 2~4문장으로 쓴다.",
              "마지막 줄은 반드시 '근거: FAQ #번호' 형식으로 쓴다.",
              "FAQ 근거가 부족하면 추측하지 말고 '담당자 연결(1588-0000)'만 답한다.",
              "금액, 결제일, 한도, 환급금은 확정처럼 말하지 말고 '참고용 안내'라고 표현하고 정확한 확인은 상담사/담당자 연결로 안내한다.",
            ].join("\n"),
          },
          {
            role: "user",
            content: `고객 질문:\n${question}\n\n검색된 FAQ:\n${faqText}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      sendJson(res, 502, { error: "잠시 후 다시 시도해주세요" });
      return;
    }

    const data = await response.json();
    const answer = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : "";

    sendJson(res, 200, { answer: postProcessAnswer(answer, question, faqs) });
  } catch (_error) {
    sendJson(res, 500, { error: "잠시 후 다시 시도해주세요" });
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.resolve(root, `.${pathname}`);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": mime[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");

  if (req.method === "POST" && url.pathname === "/api/answer") {
    handleAnswer(req, res);
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end("Method not allowed");
    return;
  }

  serveStatic(req, res);
});

server.listen(8787, "127.0.0.1");
