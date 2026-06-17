# Case-Specific AI Insight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the AI insight panel produce case-specific analysis frames so different strategies and periods clearly read as different LLM-driven interpretations rather than a fixed numeric template.

**Architecture:** The browser page keeps rendering the same evaluation dashboard, but the AI output becomes a layered analysis pass. First the client packages strategy metadata, performance metrics, and attribution signals. Then the server classifies the case into an analysis frame, uses that frame to steer the language model prompt, and returns a structured JSON response that the UI renders as a headline, thesis, contrarian view, and supporting notes.

**Tech Stack:** Static HTML, browser JavaScript, Vercel serverless functions, OpenAI Chat Completions API, fetch, JSON.

---

### Task 1: Classify each evaluation into a distinct analysis frame

**Files:**
- Modify: `api/insight.js`

- [ ] **Step 1: Add a reusable case classifier**

```js
function classifyCase(payload) {
  const metrics = payload?.metrics || {};
  const attribution = payload?.attribution || {};
  const totalPnl = safeNumber(metrics.totalPnl);
  const winRate = safeNumber(metrics.winRate);
  const maxDrawdown = safeNumber(metrics.maxDrawdown);
  const allocation = safeNumber(attribution.allocationEffect);
  const selection = safeNumber(attribution.selectionEffect);
  const interaction = safeNumber(attribution.interactionEffect);
  // Return a frame like "레짐 정렬형" or "방어 실패형" with a thesis and contrarian view.
}
```

- [ ] **Step 2: Verify the classifier covers the main cases**

Run: `node -e "const h=require('./api/insight.js')"`  
Expected: the module loads without syntax errors.

- [ ] **Step 3: Commit the classifier update**

```bash
git add api/insight.js
git commit -m "Add case framing for AI insights"
```

### Task 2: Steer the model toward case-specific language

**Files:**
- Modify: `api/insight.js`

- [ ] **Step 1: Expand the prompt with the case frame and thesis**

```js
const prompt = [
  '출력은 반드시 JSON 객체여야 하며, 키는 headline, summary, bullets, allocation, selection, interaction, risk, nextStep, confidence, caseFrame, dominantFactor, thesis, contrarianView 로 하세요.',
  `이번 사례는 ${caseInfo.caseFrame}에 가깝고 dominantFactor 는 ${caseInfo.dominantFactor} 입니다.`,
  `thesis 는 이 케이스를 가장 잘 설명하는 한 문장 판단이어야 합니다: ${caseInfo.thesis}`,
  'contrarianView 는 현재 판단에 대한 반대 시각이나 확인할 함정이어야 합니다.'
].join('\n');
```

- [ ] **Step 2: Map the model output back into the response contract**

```js
res.end(JSON.stringify({
  mode: 'openai',
  headline: parsed.headline || 'AI 해석',
  caseFrame: parsed.caseFrame || caseInfo.caseFrame,
  dominantFactor: parsed.dominantFactor || caseInfo.dominantFactor,
  thesis: parsed.thesis || caseInfo.thesis,
  summary: parsed.summary || '',
  bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
  allocation: parsed.allocation || '',
  selection: parsed.selection || '',
  interaction: parsed.interaction || '',
  risk: Array.isArray(parsed.risk) ? parsed.risk : [],
  nextStep: parsed.nextStep || '',
  contrarianView: parsed.contrarianView || caseInfo.contrarianView,
  confidence: parsed.confidence || ''
}));
```

- [ ] **Step 3: Verify the module still parses**

Run: `node -e "require('./api/insight.js')"`  
Expected: no syntax error.

- [ ] **Step 4: Commit the prompt and response update**

```bash
git add api/insight.js
git commit -m "Steer AI insights toward case-specific analysis"
```

### Task 3: Show the frame difference in the UI

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add case labels and thesis-related fields**

```html
<div class="ai-tag-row">
  <span class="ai-tag" id="aiCaseFrame">Case frame</span>
  <span class="ai-tag" id="aiDominantFactor">Dominant factor</span>
</div>
```

- [ ] **Step 2: Bind the new DOM nodes and populate them from the server response**

```js
els.aiCaseFrame.textContent = data.caseFrame || '혼합 해석형';
els.aiDominantFactor.textContent = data.dominantFactor || 'dominant: n/a';
els.aiHeadline.textContent = data.headline || data.thesis || '총평 없음';
els.aiBody.textContent = data.summary || data.thesis || data.note || 'AI 해석을 불러오지 못했습니다.';
els.aiNextStep.textContent = data.nextStep || data.contrarianView || '다음 확인 항목 없음';
```

- [ ] **Step 3: Keep the fallback state visually different from the AI state**

```js
els.aiCaseFrame.textContent = '대체 해석';
els.aiDominantFactor.textContent = 'OPENAI_API_KEY 필요';
els.aiAllocation.textContent = 'OPENAI_API_KEY 필요';
```

- [ ] **Step 4: Verify the browser script still compiles**

Run: `node -e "const fs=require('fs');const html=fs.readFileSync('./index.html','utf8');const m=html.match(/<script>([\\s\\S]*)<\\/script>\\s*<\\/body>/i);new Function(m[1]);console.log('ok')"`  
Expected: `ok`

- [ ] **Step 5: Commit the UI update**

```bash
git add index.html
git commit -m "Render case-specific AI insight labels"
```

### Task 4: Validate and publish the updated branch

**Files:**
- Modify: none

- [ ] **Step 1: Check working tree status**

Run: `git status --short`  
Expected: only the intended tracked files are modified or staged.

- [ ] **Step 2: Push the branch**

Run: `git push origin codex/performance-attribution-engine`  
Expected: remote branch advances without touching `main`.

- [ ] **Step 3: Deploy the latest build**

Run: `vercel deploy --prod --yes`  
Expected: Vercel returns a fresh production URL and aliases it to `option-rho.vercel.app`.

