# Market Regime Intelligence Agent v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new isolated Market Regime Intelligence Agent v1 demo in `Market_Regime_Intelligence_Agent_v1/` without modifying the existing Option Playbook Advisor or legacy pages.

**Architecture:** A single static entry page renders a modular dashboard. Data is loaded from a local sample JSON file first, then passed through a small client-side state module, a renderer module, and a report composer module. The page is intentionally self-contained and future-ready so real market feeds and playbook links can be wired in later without redesigning the UI.

**Tech Stack:** HTML, CSS, vanilla JavaScript modules, JSON sample data, browser-based static deployment.

---

### Task 1: Initialize an isolated git workspace for the current folder

**Files:**
- Create: `.git/`
- Modify: `.gitignore` only if needed to keep local secrets and deployment artifacts out of source control

- [ ] **Step 1: Confirm the current folder is not yet a git repository**

Run:
```powershell
git status --short --branch
```
Expected: `fatal: not a git repository` before initialization.

- [ ] **Step 2: Initialize git in the current folder and attach the requested branch**

Run:
```powershell
git init
git checkout -b feature/market-regime-intelligence-agent-v1
```
Expected: a new local repository with the feature branch checked out.

- [ ] **Step 3: Verify the repo is still clean before adding files**

Run:
```powershell
git status --short --branch
```
Expected: `## feature/market-regime-intelligence-agent-v1` with no staged changes yet.

- [ ] **Step 4: Commit only the git initialization if any files were added by setup**

If `.gitignore` or `.git` setup changes appear, stage and commit them separately with:
```powershell
git add .gitignore
git commit -m "chore: initialize market regime agent workspace"
```

### Task 2: Create the new isolated project folder and sample data

**Files:**
- Create: `Market_Regime_Intelligence_Agent_v1/index.html`
- Create: `Market_Regime_Intelligence_Agent_v1/README.md`
- Create: `Market_Regime_Intelligence_Agent_v1/CHANGELOG.md`
- Create: `Market_Regime_Intelligence_Agent_v1/sample-regime-data.json`
- Create: `Market_Regime_Intelligence_Agent_v1/assets/.gitkeep`

- [ ] **Step 1: Add the sample market regime payload**

Create `Market_Regime_Intelligence_Agent_v1/sample-regime-data.json` with a complete demo payload:
```json
{
  "agentName": "Market Regime Intelligence Agent",
  "asOf": "2026-06-16",
  "currentRegime": {
    "name": "Transition",
    "confidenceScore": 0.68,
    "description": "방향 불명확, 이벤트 민감도 확대"
  },
  "transitionMonitor": {
    "previousRegime": "Bull / Calm",
    "currentRegime": "Transition",
    "transitionProbability": 0.61,
    "trendDirection": "sideways-to-down"
  },
  "backtestSummary": {
    "cagr": 0.148,
    "sharpeRatio": 1.12,
    "maxDrawdown": -0.084,
    "winRate": 0.57
  },
  "recommendedStrategies": [
    {
      "name": "Bull Call Spread",
      "marketOutlook": "Mildly positive with capped upside",
      "riskLevel": "Medium",
      "expectedReturn": "Moderate",
      "openPlaybook": "Open Playbook"
    }
  ],
  "avoidStrategies": [
    {
      "name": "Naked Short Put",
      "avoidReason": "Event risk remains elevated",
      "riskLevel": "High",
      "openPlaybook": "Open Playbook"
    }
  ],
  "investmentCommittee": {
    "marketReasoning": "국면 전환 구간으로 방향성보다 변동성 변화가 먼저 나타날 수 있음.",
    "strategyReasoning": "방어적 / 제한손실 구조를 우선 검토.",
    "riskFactors": [
      "이벤트 캘린더 집중",
      "뉴스 심리 혼재",
      "breadth 약화"
    ],
    "committeeOpinion": "현재는 공격적 방향성 전략보다 점검 중심 접근이 적합."
  }
}
```

- [ ] **Step 2: Add a short changelog scaffold**

Create `Market_Regime_Intelligence_Agent_v1/CHANGELOG.md` with an initial `Unreleased` section and one `0.1.0` entry describing the first isolated demo release.

- [ ] **Step 3: Add a focused README**

Create `Market_Regime_Intelligence_Agent_v1/README.md` describing:
```md
# Market Regime Intelligence Agent v1

Static demo for market regime detection and strategy review.

## Run locally
Open `Market_Regime_Intelligence_Agent_v1/index.html` in a browser.

## Data flow
sample-regime-data.json -> browser state -> renderers -> report panel
```

- [ ] **Step 4: Add the assets directory placeholder**

Create `Market_Regime_Intelligence_Agent_v1/assets/.gitkeep` so the folder is preserved in git.

### Task 3: Build the modular UI entry page

**Files:**
- Create: `Market_Regime_Intelligence_Agent_v1/index.html`

- [ ] **Step 1: Create the page shell**

The page must include:
```html
<main class="app-shell">
  <header>...</header>
  <section id="current-regime"></section>
  <section id="recommended-strategies"></section>
  <section id="avoid-strategies"></section>
  <section id="transition-monitor"></section>
  <section id="backtest-summary"></section>
  <section id="committee-view"></section>
</main>
```

- [ ] **Step 2: Add Samsung-style blue tone, KPI cards, workflow diagram, and responsive layout**

Use:
```css
:root {
  --bg: #eef3fb;
  --panel: #ffffff;
  --ink: #111827;
  --muted: #526074;
  --blue: #1758e8;
  --blue-deep: #103b9f;
  --border: #1f2937;
}
```

and a layout with:
```css
.grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 16px;
}
```

- [ ] **Step 3: Include the agent architecture diagram in HTML**

Render the architecture as a visible workflow band:
```html
Market Data → Regime Detection Engine → Market Regime Intelligence Agent → Strategy Recommendation → Backtest Engine → Investment Committee Report
```

- [ ] **Step 4: Load the module script**

Add:
```html
<script type="module" src="./app.js"></script>
```

### Task 4: Implement the modular browser logic

**Files:**
- Create: `Market_Regime_Intelligence_Agent_v1/app.js`
- Create: `Market_Regime_Intelligence_Agent_v1/state.js`
- Create: `Market_Regime_Intelligence_Agent_v1/renderers.js`
- Create: `Market_Regime_Intelligence_Agent_v1/report-composer.js`
- Create: `Market_Regime_Intelligence_Agent_v1/data-loader.js`

- [ ] **Step 1: Write a state loader that fetches the sample JSON**

`data-loader.js` should export:
```js
export async function loadSampleRegimeData() {
  const response = await fetch("./sample-regime-data.json");
  if (!response.ok) throw new Error("Failed to load sample regime data");
  return response.json();
}
```

- [ ] **Step 2: Write a normalized state factory**

`state.js` should export:
```js
export function createAgentState(raw) {
  return {
    ...raw,
    currentRegime: raw.currentRegime,
    recommendedStrategies: raw.recommendedStrategies ?? [],
    avoidStrategies: raw.avoidStrategies ?? [],
    investmentCommittee: raw.investmentCommittee
  };
}
```

- [ ] **Step 3: Write renderer functions for each section**

`renderers.js` should export functions that render:
```js
renderCurrentRegime(state)
renderRecommendedStrategies(state)
renderAvoidStrategies(state)
renderTransitionMonitor(state)
renderBacktestSummary(state)
renderCommitteeView(state)
```

- [ ] **Step 4: Write a report composer**

`report-composer.js` should export:
```js
export function composeCommitteeReport(state) {
  return [
    `시장 판단 근거: ${state.investmentCommittee.marketReasoning}`,
    `추천 전략 근거: ${state.investmentCommittee.strategyReasoning}`,
    `리스크 요인: ${state.investmentCommittee.riskFactors.join(", ")}`,
    `투자위원회 의견: ${state.investmentCommittee.committeeOpinion}`
  ].join("\n");
}
```

- [ ] **Step 5: Wire everything together in app.js**

`app.js` should:
```js
import { loadSampleRegimeData } from "./data-loader.js";
import { createAgentState } from "./state.js";
import {
  renderCurrentRegime,
  renderRecommendedStrategies,
  renderAvoidStrategies,
  renderTransitionMonitor,
  renderBacktestSummary,
  renderCommitteeView
} from "./renderers.js";
import { composeCommitteeReport } from "./report-composer.js";
```
Then hydrate each section after DOMContentLoaded.

### Task 5: Add reusable assets and visual polish

**Files:**
- Create or modify: `Market_Regime_Intelligence_Agent_v1/assets/*`

- [ ] **Step 1: Add a simple SVG or PNG logo asset**

Add a small blue-toned logo or badge in `assets/` for the hero area.

- [ ] **Step 2: Add status badges and KPI cards**

Ensure the page has compact cards for:
```text
Current Regime
Confidence Score
Regime Description
Last Update
```

- [ ] **Step 3: Style strategy cards and committee block**

Each strategy card should visibly show:
```text
Strategy Name
Market Outlook
Risk Level
Expected Return
Open Playbook
```

### Task 6: Validate the isolated demo locally

**Files:**
- No file changes expected

- [ ] **Step 1: Open the new folder directly in a browser**

Use the local file path:
```text
C:\Users\user\Desktop\samsung-minwon-bot\Market_Regime_Intelligence_Agent_v1\index.html
```

- [ ] **Step 2: Verify the page renders all six required sections**

Check for:
1. Current Market Regime
2. Recommended Strategies
3. Avoid Now Strategies
4. Regime Transition Monitor
5. Backtest Summary
6. Investment Committee View

- [ ] **Step 3: Verify the sample data is actually loaded**

Confirm the current regime, scores, and strategy cards come from `sample-regime-data.json`.

- [ ] **Step 4: Check the browser console for module or fetch errors**

Expected: no failed module imports, no CORS issues, no missing file errors.

### Task 7: Commit the isolated v1 build

**Files:**
- All new files under `Market_Regime_Intelligence_Agent_v1/`
- `docs/superpowers/plans/2026-06-16-market-regime-intelligence-agent-v1.md`

- [ ] **Step 1: Stage only the new agent files and plan**

Run:
```powershell
git add Market_Regime_Intelligence_Agent_v1 docs/superpowers/plans/2026-06-16-market-regime-intelligence-agent-v1.md
```

- [ ] **Step 2: Commit with the requested message**

Run:
```powershell
git commit -m "feat: create market regime intelligence agent v1"
```

---

## Self-Review Checklist

- [ ] The plan only creates files inside `Market_Regime_Intelligence_Agent_v1/` and the plan document itself.
- [ ] No task modifies `index.html` at the repository root.
- [ ] No task touches Option Playbook Advisor files.
- [ ] No task touches backup folders or existing README files.
- [ ] The architecture is modular but still small enough for a single v1 demo.
- [ ] Every task has exact file paths and concrete commands.
