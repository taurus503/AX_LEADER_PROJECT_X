# External Data Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 정적 투자규제 검토 페이지를 API 기반 검토 구조로 바꾸고 공식 법령 근거를 결과에 함께 표시한다.

**Architecture:** 브라우저는 입력만 수집하고, 서버 함수가 검토 결과와 법령 근거를 생성한다. 법령 텍스트는 공식 원문 기준 소스 팩으로 관리하고, 요청 시 국가법령정보센터 링크 연결 상태를 확인한다.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Vercel Serverless Functions, Node.js

---

### Task 1: Add legal source pack

**Files:**
- Create: `C:\Users\user\Desktop\Codex_Paractice2\lib\legal-sources.js`

- [ ] 법조문 요약, 투자자 확인사항, 원문 링크를 키별로 정리한다.

### Task 2: Move review logic server-side

**Files:**
- Create: `C:\Users\user\Desktop\Codex_Paractice2\lib\review-engine.js`
- Create: `C:\Users\user\Desktop\Codex_Paractice2\api\review.js`

- [ ] 서버 함수가 입력값을 받아 판정, 실무 체크, 공시/보고, 법조문 탭 데이터를 반환하도록 만든다.

### Task 3: Reconnect frontend

**Files:**
- Modify: `C:\Users\user\Desktop\Codex_Paractice2\index.html`
- Modify: `C:\Users\user\Desktop\Codex_Paractice2\styles.css`
- Modify: `C:\Users\user\Desktop\Codex_Paractice2\app.js`

- [ ] 제출 시 `/api/review`를 호출하고 결과를 렌더링하도록 바꾼다.
- [ ] 공식 근거 연동 상태와 생성 시각을 보여준다.

### Task 4: Keep deployment path working

**Files:**
- Modify: `C:\Users\user\Desktop\Codex_Paractice2\vercel.json`

- [ ] API 라우트를 보존하면서 정적 `build/` 경로가 계속 서비스되도록 조정한다.
