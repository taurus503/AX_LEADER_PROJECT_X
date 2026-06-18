// Run-Control 제어창 (LLM 오케스트레이터 UI).
//
// app.js 가 boot 끝에서 mountRunControl(controller) 를 호출한다.
// controller 는 app.js 가 노출하는 "실제 앱 동작 + 상태 스냅샷" 인터페이스다:
//   controller.getState()                 -> 현재 대시보드 상태 스냅샷(JSON 직렬화 가능)
//   controller.setScenario(scenario)      -> 시나리오 적용 + run, 새 상태 반환
//   controller.setInputs(fields)          -> 입력 부분 수정 + run, 새 상태 반환
//   controller.loadMarketData(asOf)       -> 시장/뉴스 로드 + run, 새 상태 반환
//   controller.loadNews(offset)           -> 뉴스 페이지 로드, 새 상태 반환
//   controller.runAgent()                 -> 재실행, 새 상태 반환
//   controller.answerQuestion(question)   -> 초보자 답변 문자열 반환
//
// LLM 은 절대 숫자를 만들지 않는다. 위 동작을 호출해 엔진 결과를 받아 인용만 한다.

const ENDPOINT = "/api/orchestrator";
const MAX_TOOL_ROUNDS = 6;

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child) node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

const STYLE = `
.rc-toggle{position:fixed;right:20px;bottom:20px;z-index:9998;border:none;border-radius:999px;
  padding:12px 18px;background:#1f2933;color:#fff;font-weight:600;font-size:14px;cursor:pointer;
  box-shadow:0 8px 24px rgba(15,23,42,.28);display:flex;align-items:center;gap:8px;}
.rc-toggle:hover{background:#111827;}
.rc-panel{position:fixed;right:20px;bottom:82px;z-index:9999;width:420px;max-width:calc(100vw - 24px);
  height:620px;max-height:calc(100vh - 96px);background:#0f1620;color:#e8edf3;border-radius:16px;
  box-shadow:0 24px 60px rgba(2,8,23,.5);display:none;flex-direction:column;overflow:hidden;
  font-family:inherit;border:1px solid rgba(148,163,184,.18);}
.rc-panel.open{display:flex;}
.rc-head{padding:14px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(148,163,184,.14);}
.rc-head .dot{width:9px;height:9px;border-radius:50%;background:#34d399;}
.rc-head h4{margin:0;font-size:14px;font-weight:600;}
.rc-head small{color:#94a3b8;font-size:11px;display:block;font-weight:400;margin-top:1px;}
.rc-head .rc-close{margin-left:auto;background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;line-height:1;}
.rc-log{flex:1;overflow-y:auto;padding:14px 14px 6px;display:flex;flex-direction:column;gap:10px;}
.rc-msg{font-size:13px;line-height:1.55;border-radius:12px;padding:9px 12px;max-width:92%;white-space:pre-wrap;word-break:break-word;}
.rc-msg.user{align-self:flex-end;background:#2563eb;color:#fff;border-bottom-right-radius:4px;}
.rc-msg.assistant{align-self:flex-start;background:#1c2735;color:#e8edf3;border-bottom-left-radius:4px;}
.rc-msg.error{align-self:flex-start;background:#3a1d20;color:#fecaca;border:1px solid rgba(248,113,113,.3);}
.rc-tools{align-self:flex-start;display:flex;flex-wrap:wrap;gap:6px;max-width:92%;}
.rc-chip{font-size:11px;font-family:ui-monospace,Menlo,monospace;background:#13202f;color:#7dd3fc;
  border:1px solid rgba(56,189,248,.25);border-radius:8px;padding:3px 8px;display:flex;align-items:center;gap:5px;}
.rc-chip .s{color:#94a3b8;}
.rc-chip.done .s{color:#34d399;}
.rc-state{align-self:flex-start;font-size:11px;color:#94a3b8;background:#121c28;border-radius:10px;padding:7px 10px;max-width:92%;}
.rc-state b{color:#cbd5e1;font-weight:600;}
.rc-quick{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 8px;}
.rc-quick button{font-size:11px;background:#16212f;color:#cbd5e1;border:1px solid rgba(148,163,184,.18);
  border-radius:999px;padding:5px 10px;cursor:pointer;}
.rc-quick button:hover{background:#1e2a3a;}
.rc-form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(148,163,184,.14);background:#0c131d;}
.rc-form textarea{flex:1;resize:none;height:40px;max-height:120px;border-radius:10px;border:1px solid rgba(148,163,184,.2);
  background:#111c28;color:#e8edf3;padding:9px 11px;font-size:13px;font-family:inherit;line-height:1.4;}
.rc-form textarea:focus{outline:none;border-color:#2563eb;}
.rc-form button{border:none;border-radius:10px;background:#2563eb;color:#fff;font-weight:600;padding:0 14px;cursor:pointer;font-size:13px;}
.rc-form button:disabled{opacity:.5;cursor:default;}
.rc-foot{font-size:10px;color:#64748b;text-align:center;padding:0 12px 10px;line-height:1.4;}
.rc-spin{display:inline-block;width:11px;height:11px;border:2px solid rgba(148,163,184,.3);
  border-top-color:#7dd3fc;border-radius:50%;animation:rc-rot .7s linear infinite;}
@keyframes rc-rot{to{transform:rotate(360deg)}}
`;

const SUMMARY_ACTIONS = [
  { label: "요약", prompt: "모듈 1~4 통합 요약해줘", mode: "overview" },
  { label: "실행요약", prompt: "모듈 1~4 실행요약해줘", mode: "execution" },
  { label: "리스크요약", prompt: "모듈 1~4 리스크요약해줘", mode: "risk" }
];

const QUICK_PROMPTS = [
  "직전 거래일 기준으로 분석해서 브리핑해줘",
  "현재 국면을 시나리오로 바꾸면 검증이 어떻게 변해?",
  "지금의 확신도가 나온 이유를 초보자에게 설명해줘",
  "변동성을 50%로 올리면 추천 전략이 어떻게 달라져?"
];

function stateSummaryLine(state) {
  if (!state) return "상태 없음";
  const conf = state.confidence != null ? `${Math.round(state.confidence * 100)}%` : "?";
  const top = (state.topRecommended || []).map((s) => s.name).slice(0, 2).join(", ") || "-";
  const val = state.validation?.status || "-";
  return `국면 <b>${state.regime || "?"}</b> · 확신도 <b>${conf}</b> · 검증 <b>${val}</b> · 추천 ${top}`;
}

export function mountRunControl(controller) {
  if (!controller || document.getElementById("rc-panel")) return;

  const styleTag = el("style");
  styleTag.textContent = STYLE;
  document.head.appendChild(styleTag);

  const log = el("div", { class: "rc-log" });
  const textarea = el("textarea", { placeholder: "예: 6/18 기준으로 분석해서 검증까지 브리핑해줘", rows: "1" });
  const sendBtn = el("button", { type: "button", text: "전송" });

  const summaryBar = el("div", { class: "rc-quick rc-summary-bar" });
  SUMMARY_ACTIONS.forEach((action) => {
    const b = el("button", { type: "button", text: action.label });
    b.title = action.prompt;
    b.addEventListener("click", () => { textarea.value = action.prompt; submit(); });
    summaryBar.appendChild(b);
  });
  const quick = el("div", { class: "rc-quick" });
  QUICK_PROMPTS.forEach((p) => {
    const b = el("button", { type: "button", text: p.length > 22 ? p.slice(0, 21) + "…" : p });
    b.title = p;
    b.addEventListener("click", () => { textarea.value = p; submit(); });
    quick.appendChild(b);
  });

  const panel = el("div", { id: "rc-panel", class: "rc-panel" }, [
    el("div", { class: "rc-head" }, [
      el("span", { class: "dot" }),
      el("div", {}, [
        el("h4", { text: "Run Control" }),
        el("small", { text: "LLM 오케스트레이터 · 엔진이 숫자, LLM은 지휘" })
      ]),
      (() => { const c = el("button", { class: "rc-close", text: "×" }); c.addEventListener("click", () => panel.classList.remove("open")); return c; })()
    ]),
    log,
    summaryBar,
    quick,
    el("div", { class: "rc-form" }, [textarea, sendBtn]),
    el("div", { class: "rc-foot", text: "이 도구는 검토 보조용이며 투자 자문이 아닙니다." })
  ]);

  const toggle = el("button", { class: "rc-toggle" }, [
    el("span", { class: "dot", style: "width:8px;height:8px;border-radius:50%;background:#34d399;display:inline-block" }),
    document.createTextNode("Run Control")
  ]);
  toggle.addEventListener("click", () => panel.classList.toggle("open"));

  document.body.appendChild(panel);
  document.body.appendChild(toggle);

  // ----- 대화/상태 -----
  let conversation = [];   // LLM에 보내는 messages 누적
  let busy = false;

  // 프런트엔드 tool 구현 — 서버 orchestrator.js의 TOOLS와 1:1 매칭
  const TOOL_IMPL = {
    set_scenario: (a) => controller.setScenario(a.scenario),
    set_inputs: (a) => controller.setInputs(a || {}),
    load_market_data: (a) => controller.loadMarketData(a && a.asOf),
    load_news: (a) => controller.loadNews((a && a.offset) || 0, a && a.asOf),
    run_agent: () => controller.runAgent(),
    refresh_module23: () => controller.refreshModule23(),
    summarize_modules: (a) => controller.getSummary((a && a.mode) || "overview"),
    set_module4_request: (a) => controller.setModule4Request(a || {}),
    get_module2_state: () => controller.getModule2State(),
    get_module3_state: () => controller.getModule3State(),
    answer_question: (a) => ({ answer: controller.answerQuestion(a && a.question) }),
    get_state: () => controller.getState()
  };

  function addMsg(role, text) {
    const node = el("div", { class: `rc-msg ${role}`, text });
    log.appendChild(node);
    log.scrollTop = log.scrollHeight;
    return node;
  }

  function addStateChip(state) {
    const node = el("div", { class: "rc-state" });
    node.innerHTML = stateSummaryLine(state);
    log.appendChild(node);
    log.scrollTop = log.scrollHeight;
  }

  function addToolChips(toolCalls) {
    const wrap = el("div", { class: "rc-tools" });
    const chips = toolCalls.map((tc) => {
      const chip = el("div", { class: "rc-chip" }, [
        el("span", { class: "s", text: "▷" }),
        document.createTextNode(tc.function?.name || "tool")
      ]);
      wrap.appendChild(chip);
      return chip;
    });
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
    return chips;
  }

  async function callOrchestrator(messages) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload.ok) {
      throw new Error(payload.error || `orchestrator ${res.status}`);
    }
    return payload.message;
  }

  async function submit() {
    const text = textarea.value.trim();
    if (!text || busy) return;
    busy = true;
    sendBtn.disabled = true;
    textarea.value = "";
    addMsg("user", text);

    // 첫 턴에 현재 상태 스냅샷을 컨텍스트로 주입(환각 방지/정합성)
    let snapshot = {};
    try { snapshot = controller.getState(); } catch (_) {}
    conversation.push({
      role: "user",
      content: `${text}\n\n[현재 대시보드 상태]\n${JSON.stringify(snapshot)}`
    });

    const pending = addMsg("assistant", "");
    pending.innerHTML = '<span class="rc-spin"></span>';

    try {
      let rounds = 0;
      while (rounds < MAX_TOOL_ROUNDS) {
        rounds += 1;
        const message = await callOrchestrator(conversation);
        conversation.push(message);

        if (message.tool_calls && message.tool_calls.length) {
          if (rounds === 1) pending.remove();
          const chips = addToolChips(message.tool_calls);
          for (let i = 0; i < message.tool_calls.length; i += 1) {
            const tc = message.tool_calls[i];
            const name = tc.function?.name;
            let args = {};
            try { args = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {}; } catch (_) { args = {}; }
            let result;
            try {
              result = TOOL_IMPL[name] ? await TOOL_IMPL[name](args) : { error: `unknown tool ${name}` };
            } catch (err) {
              result = { error: err?.message || "tool failed" };
            }
            chips[i].classList.add("done");
            chips[i].querySelector(".s").textContent = "✓";
            conversation.push({
              role: "tool",
              tool_call_id: tc.id,
              name,
              content: JSON.stringify(result ?? {})
            });
          }
          // 도구가 상태를 바꿨으면 요약칩 1줄
          try { addStateChip(controller.getState()); } catch (_) {}
          continue; // 결과를 들고 다시 LLM 호출
        }

        // 최종 답변
        if (rounds === 1) pending.remove();
        addMsg("assistant", message.content || "(응답 없음)");
        break;
      }
      if (rounds >= MAX_TOOL_ROUNDS) {
        addMsg("assistant", "도구 호출이 너무 많아 중단했어요. 더 구체적으로 요청해 주세요.");
      }
    } catch (err) {
      if (document.body.contains(pending)) pending.remove();
      addMsg("error", `오류: ${err?.message || err}`);
    } finally {
      busy = false;
      sendBtn.disabled = false;
      textarea.focus();
    }
  }

  sendBtn.addEventListener("click", submit);
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  });

  addMsg("assistant", "안녕하세요. 자연어로 명령하면 제가 대시보드를 실행·검증·요약해 드려요. 아래 예시를 눌러보거나 직접 입력해 보세요.");
}
