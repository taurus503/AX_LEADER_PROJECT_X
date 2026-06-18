(function () {
  const question = document.querySelector("#question");
  const runButton = document.querySelector("#run-button");
  const clearButton = document.querySelector("#clear-button");
  const privacyAlert = document.querySelector("#privacy-alert");
  const resultHeading = document.querySelector("#result-heading");
  const resultCopy = document.querySelector("#result-copy");
  const categoryPanel = document.querySelector("#category-panel");
  const categoryCopy = document.querySelector("#category-copy");
  const categoryConfidence = document.querySelector("#category-confidence");
  const faqResults = document.querySelector("#faq-results");
  const faqList = document.querySelector("#faq-list");
  const faqSource = document.querySelector("#faq-source");
  const answerPanel = document.querySelector("#answer-panel");
  const answerButton = document.querySelector("#answer-button");
  const answerCopy = document.querySelector("#answer-copy");

  const privateNumberPattern = /(\d{6,}|\d{6}-\d{7}|\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}|(?:\d[-\s]?){10,})/;
  const stopwords = new Set([
    "상담사", "손님", "고객", "문의", "질문", "확인", "감사합니다", "합니다", "해주세요",
    "어떻게", "하나요", "되나요", "무엇", "어디", "어느", "관련", "안내", "좀", "혹시",
    "제가", "저희", "그럼", "일단", "그리고", "그런데", "카테고리", "분류"
  ]);

  let modelPromise;
  let faqsPromise;
  let configPromise;
  let latestQuestion = "";
  let latestFaqs = [];

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[“”"'`]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    return [...new Set(
      normalize(text)
        .slice(0, 1800)
        .split(/[^0-9a-z가-힣]+/u)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2 && !stopwords.has(token))
    )];
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function loadModel() {
    if (!modelPromise) {
      modelPromise = fetch("ml/hana_category_classifier.json")
        .then((response) => {
          if (!response.ok) throw new Error("분류기 파일을 불러오지 못했습니다.");
          return response.json();
        });
    }
    return modelPromise;
  }

  function predictWithModel(model, text) {
    const tokens = tokenize(text);
    const vocabSize = Object.keys(model.vocabulary || {}).length || 1;
    const scores = Object.entries(model.labels || {}).map(([label, stats]) => {
      let score = Math.log((stats.docCount || 1) / (model.totalDocs || 1));
      const denom = (stats.tokenCount || 0) + (model.alpha || 1) * vocabSize;

      for (const token of tokens) {
        const count = (stats.tokens && stats.tokens[token]) || 0;
        score += Math.log((count + (model.alpha || 1)) / denom);
      }

      return { label, score };
    }).sort((a, b) => b.score - a.score);

    const top = scores[0] || { label: "분류 불가", score: 0 };
    const second = scores[1] || { label: "", score: top.score - 20 };
    const margin = top.score - second.score;
    const confidence = 1 / (1 + Math.exp(-Math.min(Math.max(margin, -20), 20)));
    const ambiguous = tokens.length < 2 || confidence < 0.62 || margin < 1.4;

    return {
      category: top.label,
      confidence,
      margin,
      ambiguous,
      tokens
    };
  }

  async function predictCategory(text) {
    try {
      return predictWithModel(await loadModel(), text);
    } catch (error) {
      return {
        category: "분류 불가",
        confidence: 0,
        margin: 0,
        ambiguous: true,
        tokens: tokenize(text),
        error: error.message
      };
    }
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (char === "\"") {
        if (quoted && next === "\"") {
          field += "\"";
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === "," && !quoted) {
        row.push(field);
        field = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(field);
        if (row.some((cell) => cell.length > 0)) rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }

    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }

    const [headers, ...records] = rows;
    return records.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""])));
  }

  async function loadLocalFaqs() {
    if (!faqsPromise) {
      faqsPromise = fetch("data/faqs.csv")
        .then((response) => {
          if (!response.ok) throw new Error("FAQ CSV를 불러오지 못했습니다.");
          return response.text();
        })
        .then(parseCsv);
    }
    return faqsPromise;
  }

  async function getSupabaseConfig() {
    const staticConfig = window.APP_CONFIG || {};
    let url = String(staticConfig.SUPABASE_URL || "").replace(/\/+$/, "");
    let key = String(staticConfig.SUPABASE_PUBLISHABLE_KEY || staticConfig.SUPABASE_ANON_KEY || "");

    if (!url || !key) {
      if (!configPromise) {
        configPromise = fetch("/api/config")
          .then((response) => response.ok ? response.json() : {})
          .catch(() => ({}));
      }

      const runtimeConfig = await configPromise;
      url = String(runtimeConfig.SUPABASE_URL || "").replace(/\/+$/, "");
      key = String(runtimeConfig.SUPABASE_PUBLISHABLE_KEY || runtimeConfig.SUPABASE_ANON_KEY || "");
    }

    return url && key ? { url, key } : null;
  }

  async function searchSupabase(query, preferredCategory, limit) {
    const config = await getSupabaseConfig();
    if (!config) return { rows: [], used: false, error: null };

    try {
      const response = await fetch(`${config.url}/rest/v1/rpc/search_faqs_by_category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": config.key,
          "Authorization": `Bearer ${config.key}`
        },
        body: JSON.stringify({
          search_query: query,
          preferred_category: preferredCategory || null,
          match_limit: limit
        })
      });

      if (!response.ok) {
        throw new Error(`Supabase 검색 실패 (${response.status})`);
      }

      const rows = await response.json();
      return {
        rows: rows.map((row) => ({ ...row, sourceType: "supabase" })),
        used: true,
        error: null
      };
    } catch (error) {
      return { rows: [], used: true, error };
    }
  }

  function scoreFaq(faq, query, preferredCategory, tokens) {
    const category = normalize(faq.category);
    const questionText = normalize(faq.question);
    const answerText = normalize(faq.answer);
    const exactQuery = normalize(query);
    let score = 0;

    if (preferredCategory && faq.category === preferredCategory) score += 70;
    if (exactQuery && questionText.includes(exactQuery)) score += 80;
    if (exactQuery && answerText.includes(exactQuery)) score += 55;
    if (exactQuery && category.includes(exactQuery)) score += 25;

    for (const token of tokens) {
      if (questionText.includes(token)) score += 12;
      if (answerText.includes(token)) score += 8;
      if (category.includes(token)) score += 5;
    }

    return score;
  }

  async function searchLocalFaqs(query, preferredCategory, tokens, limit) {
    try {
      const faqs = await loadLocalFaqs();
      return faqs
        .map((faq, index) => ({
          id: `local-${index}`,
          category: faq.category,
          question: faq.question,
          answer: faq.answer,
          source: faq.source,
          score: scoreFaq(faq, query, preferredCategory, tokens),
          category_match: preferredCategory ? faq.category === preferredCategory : false,
          sourceType: "local"
        }))
        .filter((faq) => faq.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  function mergeResults(results) {
    const seen = new Set();
    const merged = [];

    for (const item of results) {
      const key = `${item.category}\n${item.question}\n${item.answer}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }

    return merged;
  }

  async function findFaqs(query, prediction) {
    const preferred = prediction.ambiguous ? null : prediction.category;
    const supabaseCategory = preferred
      ? await searchSupabase(query, preferred, 5)
      : { rows: [], used: false, error: null };
    const needsGlobal = prediction.ambiguous || supabaseCategory.rows.length < 5;
    const supabaseGlobal = needsGlobal
      ? await searchSupabase(query, null, 5)
      : { rows: [], used: false, error: null };

    let merged = mergeResults([...supabaseCategory.rows, ...supabaseGlobal.rows]).slice(0, 5);
    let localRows = [];

    if (merged.length < 5) {
      localRows = await searchLocalFaqs(query, preferred, prediction.tokens, 5);
      merged = mergeResults([...merged, ...localRows]).slice(0, 5);
    }

    const usedSupabase = supabaseCategory.used || supabaseGlobal.used;
    const supabaseError = supabaseCategory.error || supabaseGlobal.error;
    const usedLocal = localRows.length > 0 || !usedSupabase || merged.some((item) => item.sourceType === "local");

    return { rows: merged, usedSupabase, usedLocal, supabaseError };
  }

  function updateInputState() {
    const value = question.value.trim();
    const blocked = privateNumberPattern.test(value);

    privacyAlert.style.display = blocked ? "block" : "none";
    runButton.disabled = !value || blocked;
    runButton.textContent = blocked ? "개인정보 제거 필요" : "질문하기";

    if (!value) {
      resultHeading.textContent = "빈 상태";
      resultCopy.textContent = "질문을 입력하면 카테고리 예측과 참고한 FAQ 5개가 표시됩니다.";
      categoryPanel.style.display = "none";
      faqResults.style.display = "none";
      answerPanel.style.display = "none";
      faqList.innerHTML = "";
      latestQuestion = "";
      latestFaqs = [];
    } else if (blocked) {
      resultHeading.textContent = "입력 차단";
      resultCopy.textContent = "개인정보로 보이는 긴 숫자를 제거해야 검색을 진행할 수 있습니다.";
      categoryPanel.style.display = "none";
      faqResults.style.display = "none";
      answerPanel.style.display = "none";
    } else {
      resultHeading.textContent = "입력 중";
      resultCopy.textContent = "질문하기를 누르면 분류기로 카테고리를 예측한 뒤 FAQ를 검색합니다.";
    }
  }

  function renderCategory(prediction) {
    const percent = Math.round(prediction.confidence * 100);
    categoryPanel.style.display = "block";
    categoryConfidence.textContent = prediction.ambiguous ? "애매함" : `${percent}%`;
    categoryCopy.textContent = prediction.ambiguous
      ? `예측 카테고리: ${prediction.category}. 분류가 애매해 전체 FAQ 검색을 함께 수행했습니다.`
      : `예측 카테고리: ${prediction.category}. 이 카테고리의 FAQ를 우선 검색했습니다.`;
  }

  function renderFaqs(searchResult) {
    faqResults.style.display = "block";

    if (searchResult.usedSupabase && searchResult.usedLocal) {
      faqSource.textContent = "Supabase+CSV";
    } else if (searchResult.usedSupabase) {
      faqSource.textContent = "Supabase";
    } else {
      faqSource.textContent = "로컬 CSV";
    }

    if (!searchResult.rows.length) {
      faqList.innerHTML = `<p class="empty-result">관련 FAQ 없음</p>`;
      return;
    }

    faqList.innerHTML = searchResult.rows.map((faq, index) => `
      <article class="faq-card">
        <div class="faq-card-header">
          <span>FAQ ${index + 1}</span>
          <span>${escapeHtml(faq.category || "분류 없음")}</span>
        </div>
        <div class="faq-card-body">
          <strong>질문</strong>
          <p>${escapeHtml(faq.question || "")}</p>
          <strong>답변</strong>
          <p>${escapeHtml(faq.answer || "")}</p>
        </div>
      </article>
    `).join("");
  }

  function renderAnswerReady(searchResult, query) {
    latestQuestion = query;
    latestFaqs = searchResult.rows.map((faq, index) => ({
      number: index + 1,
      category: faq.category || "",
      question: faq.question || "",
      answer: faq.answer || ""
    }));
    answerPanel.style.display = "block";
    answerButton.disabled = false;
    answerButton.textContent = "답변 만들기";
    answerCopy.textContent = latestFaqs.length
      ? "검색된 FAQ를 근거로 쉬운 말 답변 초안을 만들 수 있습니다."
      : "관련 FAQ가 없어 답변 만들기 시 담당자 연결 안내만 표시됩니다.";
  }

  async function handleRun() {
    const value = question.value.trim();
    if (!value || privateNumberPattern.test(value)) return;

    runButton.disabled = true;
    runButton.textContent = "검색 중";
    answerPanel.style.display = "none";
    resultHeading.textContent = "로딩";
    resultCopy.textContent = "분류기로 카테고리를 예측하고, Supabase에서 비슷한 FAQ를 찾고 있습니다.";
    categoryPanel.style.display = "none";
    faqResults.style.display = "none";
    faqList.innerHTML = "";

    const prediction = await predictCategory(value);
    const searchResult = await findFaqs(value, prediction);

    renderCategory(prediction);
    renderFaqs(searchResult);
    renderAnswerReady(searchResult, value);

    if (!searchResult.rows.length) {
      resultHeading.textContent = "검색 결과 없음";
      resultCopy.textContent = "관련 FAQ 없음. 답변 만들기는 담당자 연결 안내만 표시합니다.";
    } else if (searchResult.supabaseError) {
      resultHeading.textContent = "FAQ 검색 완료";
      resultCopy.textContent = "Supabase 연결이 불안정해 로컬 CSV까지 함께 확인했습니다. 결과는 담당자 검토 후 사용해 주세요.";
    } else {
      resultHeading.textContent = "FAQ 검색 완료";
      resultCopy.textContent = "아래 참고한 FAQ를 근거로 담당자가 답변 초안을 확인해 주세요.";
    }

    runButton.disabled = false;
    runButton.textContent = "질문하기";
  }

  async function handleAnswer() {
    if (!latestQuestion || privateNumberPattern.test(latestQuestion)) return;

    answerButton.disabled = true;
    answerButton.textContent = "생성 중";
    answerCopy.textContent = "BizRouter로 답변 초안을 만들고 있습니다.";

    try {
      const response = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: latestQuestion,
          faqs: latestFaqs
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) {
        throw new Error("answer_failed");
      }

      answerCopy.textContent = data.answer || "잠시 후 다시 시도해주세요";
    } catch (_error) {
      answerCopy.textContent = "잠시 후 다시 시도해주세요";
    } finally {
      answerButton.disabled = false;
      answerButton.textContent = "답변 만들기";
    }
  }

  question.addEventListener("input", updateInputState);
  runButton.addEventListener("click", handleRun);
  answerButton.addEventListener("click", handleAnswer);
  clearButton.addEventListener("click", () => {
    question.value = "";
    question.focus();
    updateInputState();
  });

  updateInputState();
})();
