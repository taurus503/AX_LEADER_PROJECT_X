const privateNumberPattern = /(\d{6,}|\d{6}-\d{7}|\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}|(?:\d[-\s]?){10,})/;
const sensitiveDecisionPattern = /(금액|지급일|결제일|한도|환급금|환급|청구금액|이용대금|결제대금)/;

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

  if (sensitiveDecisionPattern.test(`${question}\n${text}`)) {
    const safety = "참고용 안내입니다. 정확한 내용은 상담사/담당자 연결(1588-0000)로 확인해 주세요.";
    if (!text.includes("참고용 안내")) text = `${safety}\n${text}`;
    if (!text.includes("담당자 연결") && !text.includes("상담사")) text = `${text}\n${safety}`;
  }

  if (!/근거\s*:\s*FAQ\s*#\d+/.test(text) && faqs.length) {
    text = `${text}\n근거: FAQ #${faqs[0].number}`;
  }

  return text;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const question = String(body.question || "").trim();
    const faqs = normalizeFaqs(body.faqs);

    if (!question || privateNumberPattern.test(question)) {
      res.status(400).json({ error: "잠시 후 다시 시도해주세요" });
      return;
    }

    if (!faqs.length) {
      res.status(200).json({ answer: "담당자 연결(1588-0000)" });
      return;
    }

    const apiKey = process.env.BIZROUTER_API_KEY;
    const baseUrl = (process.env.BIZROUTER_BASE_URL || "https://api.bizrouter.ai/v1").replace(/\/+$/, "");
    const model = process.env.BIZROUTER_MODEL;

    if (!apiKey || !model) {
      res.status(503).json({ error: "잠시 후 다시 시도해주세요" });
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
              "금액, 지급일, 결제일, 한도, 환급금은 확정처럼 말하지 말고 '참고용 안내'라고 표현하고 정확한 확인은 상담사/담당자 연결로 안내한다.",
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
      res.status(502).json({ error: "잠시 후 다시 시도해주세요" });
      return;
    }

    const data = await response.json();
    const answer = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : "";

    res.status(200).json({ answer: postProcessAnswer(answer, question, faqs) });
  } catch (_error) {
    res.status(500).json({ error: "잠시 후 다시 시도해주세요" });
  }
};
