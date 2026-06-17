# Option Commander Agent v1

Planner 기반 Commander Agent 데모입니다.

## 목적

사용자 질문을 받아 필요한 Agent를 선택하고, 호출 순서를 정리한 뒤 Battle Plan으로 합칩니다.

## 포함 Agent

1. Market Regime Agent
2. Option Playbook Agent
3. Validation Agent
4. Attribution Agent

## 구성 파일

- `index.html`
- `commander.js`
- `planner.js`
- `agent-registry.json`
- `README.md`

## 동작

1. 질문 입력
2. Planner가 intent와 routing sequence 계산
3. 필요한 Agent 선택
4. 선택된 Agent 결과를 Dashboard에 렌더링
5. Battle Plan과 Decision Trail 생성

## 실행

정적 사이트로 열 수 있습니다.

- 로컬에서 파일 직접 열기
- 또는 정적 서버 / Vercel에 배포

## 디자인

다크 네이비 톤, Chat + Dashboard, premium glassmorphism 스타일을 유지했습니다.

## 비고

이 데모는 기존 Agent를 수정하지 않고, 새 Commander 레이어만 독립적으로 보여주기 위한 화면입니다.
