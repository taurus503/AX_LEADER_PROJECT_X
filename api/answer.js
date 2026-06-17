const privateNumberPattern = /(\d{6,}|\d{6}-\d{7}|\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}|(?:\d[-\s]?){10,})/;
const sensitiveDecisionPattern = /(금액|지급일|결제일|수수료|해석|확정|손해|손실|보장|한도|약관|변경|재설정|대출|청구)/;

function normalizeFaqs(faqs) {
  if (!Array.isArray(faqs)) return [];

  return faqs
    .slice(0, 5)
    .map((faq, index) => ({
      number: Number(faq.number || index + 1),
      category: String(faq.category || "").slice(0, 160),
      question: String(faq.question || "").slice(0, 700),
      answer: String(faq.answer || "").slice(0, 900)
    }))
    .filter((faq) => faq.question || faq.answer);
}

function fallbackAnswer(faqs) {
  if (!faqs.length) {
    return [
      "결론: 추가 확인이 필요합니다.",
      "근거: FAQ 없음",
      "다음 안내: 정확한 확인이 필요하면 상담사/담당자 연결(1588-0000)로 확인해 주세요."
    ].join("\n");
  }

  return [
    "결론: 현재 확인 가능한 FAQ 기준으로는 추가 확인이 필요합니다.",
    `근거: FAQ #${faqs[0].number}`,
    "다음 안내: 정확한 확인이 필요하면 상담사/담당자 연결(1588-0000)로 확인해 주세요."
  ].join("\n");
}

function ensureAnswerFormat(text, faqs) {
  let output = String(text || "").trim();
  if (!output) return fallbackAnswer(faqs);

  if (!/^결론\s*:/m.test(output)) {
    output = `결론: 현재 확인 가능한 FAQ 기준으로 답변드립니다.\n${output}`;
  }

  if (!/근거\s*:\s*FAQ\s*#\d+/i.test(output)) {
    if (faqs.length) {
      output = `${output}\n근거: FAQ #${faqs[0].number}`;
    } else {
      output = `${output}\n근거: FAQ 없음`;
    }
  }

  if (!/^다음 안내\s*:/m.test(output)) {
    output = `${output}\n다음 안내: 정확한 확인이 필요하면 상담사/담당자 연결(1588-0000)로 확인해 주세요.`;
  }

  return output;
}

function postProcessAnswer(answer, question, faqs) {
  let text = String(answer || "").trim();
  if (!text) return fallbackAnswer(faqs);

  if (sensitiveDecisionPattern.test(`${question}\n${text}`)) {
    const safety = "다음 안내: 정확한 확인이 필요하면 상담사/담당자 연결(1588-0000)로 확인해 주세요.";
    if (!text.includes("결론:")) {
      text = `결론: 추가 확인이 필요합니다.\n${text}`;
    }
    if (!text.includes("다음 안내:")) {
      text = `${text}\n${safety}`;
    }
  }

  return ensureAnswerFormat(text, faqs);
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
      res.status(400).json({ error: "추가 확인이 필요합니다" });
      return;
    }

    if (!faqs.length) {
      res.status(200).json({ answer: fallbackAnswer(faqs) });
      return;
    }

    const apiKey = process.env.BIZROUTER_API_KEY;
    const baseUrl = (process.env.BIZROUTER_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
    const model = process.env.BIZROUTER_MODEL;

    if (!apiKey || !model) {
      res.status(503).json({ error: "추가 확인이 필요합니다" });
      return;
    }

    const faqText = faqs
      .map((faq) => [
        `FAQ #${faq.number}`,
        `분류: ${faq.category || "분류 없음"}`,
        `질문: ${faq.question}`,
        `답변: ${faq.answer}`
      ].join("\n"))
      .join("\n\n");

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: [
              "너는 금융 상담용 답변 생성 Agent다.",
              "입력으로 주어진 질문과 Supabase 검색 결과만 근거로 답변하라.",
              "절대 검색 결과에 없는 내용을 만들어내지 마라.",
              "답변은 친절하고 짧게 작성한다.",
              "반드시 근거 FAQ ID를 포함한다.",
              "정보가 부족하면 '추가 확인이 필요합니다'라고 말한다.",
              "금액, 약관 해석, 확정 판단은 하지 않는다.",
              "범위를 벗어나면 상담사 연결 문구로 끝낸다.",
              "사용자의 질문에 대한 직접 답변 + 근거 + 다음 행동 순으로 작성한다.",
              "출력 스타일은 반드시 아래 3개 섹션을 포함한다.",
              "1. 결론",
              "2. 근거",
              "3. 다음 안내",
              "예시 톤:",
              "- 현재 확인 가능한 FAQ 기준으로는...",
              "- 근거: FAQ #12, FAQ #18",
              "- 정확한 확인이 필요하면 상담사를 통해 확인해 주세요."
            ].join("\n")
          },
          {
            role: "user",
            content: `사용자 질문:\n${question}\n\n검색된 FAQ:\n${faqText}`
          }
        ]
      })
    });

    if (!response.ok) {
      res.status(502).json({ error: "추가 확인이 필요합니다" });
      return;
    }

    const data = await response.json();
    const answer = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : "";

    res.status(200).json({ answer: postProcessAnswer(answer, question, faqs) });
  } catch (_error) {
    res.status(500).json({ error: "추가 확인이 필요합니다" });
  }
};
