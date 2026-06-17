// LLM Run-Control Orchestrator endpoint.
//
// 역할: 자연어 명령을 받아 "어떤 룰베이스 함수를 어떤 인자로 부를지"만 LLM이 결정하게 한다.
// 숫자/판정은 절대 LLM이 만들지 않는다. LLM은 tool_call(지휘) + 자연어 브리핑(설명)만 담당.
//
// 보안: BIZROUTER API 키는 서버측 환경변수로만 읽는다. 프런트엔드로 절대 노출하지 않는다.
//
// 흐름(프런트엔드 run-control.mjs가 구동):
//   1) 프런트가 {messages} 를 POST
//   2) 서버가 system 프롬프트 + tools 를 붙여 BIZROUTER 호출
//   3) assistant 메시지(content / tool_calls)를 그대로 반환
//   4) tool_calls 가 있으면 프런트가 실제 앱 함수를 실행하고 결과를 tool 메시지로 다시 POST(루프)
//   5) tool_calls 없이 content 만 오면 최종 브리핑으로 표시

const SYSTEM_PROMPT = [
  "너는 'KOSPI200 옵션 전장 해석 대시보드'를 제어하는 Run-Control 오케스트레이터다.",
  "이 대시보드는 규칙 기반(rule-based) 엔진이 모든 숫자와 판정을 계산한다. 너는 계산기가 아니라 '지휘자'다.",
  "",
  "[절대 규칙]",
  "1. 국면 판정, 확신도, 전략 점수, 배분 비중, 성과 기여도 같은 수치를 네가 만들어내지 마라. 반드시 도구(tool)를 호출해 엔진이 계산한 값을 받아서 그것만 인용한다.",
  "2. 사용자의 요청을 도구 호출 순서로 번역한다. 예: '6월18일 기준으로 분석' -> load_market_data 후 run_agent.",
  "3. 필요한 도구를 모두 호출해 상태를 갱신한 뒤, 마지막에 한국어로 간결한 브리핑을 작성한다.",
  "4. 검증(validation) 상태가 REVIEW/REJECT이거나 이벤트 리스크가 high면 반드시 경고로 짚어준다.",
  "5. 매수/매도 같은 단정적 투자 지시를 하지 않는다. 이 화면은 검토 포인트를 정리할 뿐 투자 자문이 아니다. 필요시 '투자 판단은 사용자 몫'임을 덧붙인다.",
  "6. 도구 결과(JSON)에 없는 사실을 지어내지 않는다. 모르면 모른다고 한다.",
  "",
  "[브리핑 형식]",
  "- 현재 국면 + 확신도(엔진 값)",
  "- 추천/회피 핵심 1~2개와 근거",
  "- 검증/리스크 경고",
  "- 다음 액션 제안(있으면)",
  "표/불릿 남발 없이 2~5문장으로 쓴다."
].join("\n");

// 프런트엔드(run-control.mjs)의 TOOL_IMPL 과 1:1로 매칭되는 함수 스키마.
const TOOLS = [
  {
    type: "function",
    function: {
      name: "set_scenario",
      description: "사전 정의된 시장 시나리오 프리셋을 적용하고 에이전트를 재실행한다.",
      parameters: {
        type: "object",
        properties: {
          scenario: {
            type: "string",
            enum: ["bullCalm", "bearCrisis", "transition", "custom"],
            description: "bullCalm=강세/안정, bearCrisis=약세/위기, transition=전환, custom=수동입력 유지"
          }
        },
        required: ["scenario"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "set_inputs",
      description: "Module 1 입력값을 부분적으로 수정하고 에이전트를 재실행한다. 지정한 필드만 바뀐다.",
      parameters: {
        type: "object",
        properties: {
          oneDay: { type: "number", description: "1일 수익률(%)" },
          oneWeek: { type: "number", description: "1주 수익률(%)" },
          oneMonth: { type: "number", description: "1개월 수익률(%)" },
          volatility20d: { type: "number", description: "20일 변동성(%)" },
          trendStrength: { type: "number", description: "추세 강도(0~100)" },
          eventRisk: { type: "string", enum: ["low", "medium", "high"] },
          newsSentiment: { type: "string", enum: ["positive", "neutral", "mixed", "negative"] },
          breadth: { type: "string", enum: ["strong", "neutral", "weak"] },
          slem: { type: "number", description: "상태전환 우도(SLEM)" },
          gelmanRubin: { type: "number", description: "Gelman-Rubin 수렴 진단(<=1.1 권장)" },
          tradabilityMaskValid: { type: "boolean" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "load_market_data",
      description: "지정한 기준일의 실제 KOSPI200 시장 데이터(+뉴스)를 불러오고 에이전트를 재실행한다.",
      parameters: {
        type: "object",
        properties: {
          asOf: { type: "string", description: "기준일 YYYY-MM-DD. 생략하면 직전 거래일." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "load_news",
      description: "뉴스/리포트 목록을 해당 offset 페이지로 불러온다.",
      parameters: {
        type: "object",
        properties: {
          offset: { type: "number", description: "시작 인덱스(0,3,6...)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "run_agent",
      description: "현재 입력값으로 규칙 기반 엔진을 다시 실행해 국면/전략/검증/성과를 갱신한다.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "answer_question",
      description: "현재 분석 상태를 근거로 초보자용 질문에 답한다(엔진의 설명 헬퍼 사용).",
      parameters: {
        type: "object",
        properties: { question: { type: "string" } },
        required: ["question"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_state",
      description: "현재 대시보드 상태(국면/확신도/전략/검증/성과/뉴스 요약) 스냅샷을 가져온다.",
      parameters: { type: "object", properties: {} }
    }
  }
];

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && typeof m === "object" && typeof m.role === "string")
    .slice(-24) // 최근 맥락만 유지
    .map((m) => {
      const out = { role: m.role };
      if (typeof m.content === "string") out.content = m.content;
      else if (m.content == null) out.content = "";
      else out.content = JSON.stringify(m.content);
      if (m.role === "assistant" && Array.isArray(m.tool_calls)) out.tool_calls = m.tool_calls;
      if (m.role === "tool") {
        out.tool_call_id = m.tool_call_id;
        if (m.name) out.name = m.name;
      }
      return out;
    });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const apiKey = process.env.BIZROUTER_API_KEY;
    const baseUrl = (process.env.BIZROUTER_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
    const model = process.env.BIZROUTER_MODEL;
    if (!apiKey || !model) {
      res.status(503).json({ ok: false, error: "LLM 설정(BIZROUTER_API_KEY / BIZROUTER_MODEL)이 없습니다." });
      return;
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const incoming = sanitizeMessages(body.messages);
    if (!incoming.length) {
      res.status(400).json({ ok: false, error: "messages가 비어 있습니다." });
      return;
    }

    const messages = incoming[0].role === "system"
      ? incoming
      : [{ role: "system", content: SYSTEM_PROMPT }, ...incoming];

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        tools: TOOLS,
        tool_choice: "auto"
      })
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      res.status(502).json({ ok: false, error: `LLM 호출 실패 (${upstream.status})`, detail: detail.slice(0, 500) });
      return;
    }

    const data = await upstream.json();
    const message = data && data.choices && data.choices[0] && data.choices[0].message;
    if (!message) {
      res.status(502).json({ ok: false, error: "LLM 응답이 비어 있습니다." });
      return;
    }

    res.status(200).json({
      ok: true,
      message: {
        role: "assistant",
        content: message.content || "",
        tool_calls: Array.isArray(message.tool_calls) ? message.tool_calls : []
      },
      finishReason: data.choices[0].finish_reason || null
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error?.message || "orchestrator failed" });
  }
};
