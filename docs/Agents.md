# 6조 에이전트 설계서 - AI 기반 KOSPI200 Option Playbook Advisor

## 1. 설계 목적

본 문서는 6조 Option Playbook Advisor의 AI Agent 역할, 동작 규칙, 프롬프트 로직, 예외 처리 기준을 정의합니다.

기존 PDF/txt 요구서의 8개 Agent 구조에 더해, 실제 구현 코드인 `advisor.js`와 `snapshot (1).js`의 동작을 반영했습니다.

## 2. Agent 공통 원칙

| 원칙 | 설명 |
| :--- | :--- |
| 최종 판단은 사람 | AI는 투자판단을 대체하지 않고 검토자료를 정리합니다. |
| 데이터 기준 명시 | 모든 답변에 `selectedDate`, `actualDate`, 데이터 출처를 표시합니다. |
| 설명 가능성 | 추천/회피 전략은 점수뿐 아니라 이유를 함께 제공합니다. |
| 낮은 확신도 주의 | confidence가 낮으면 "추천"이 아니라 "검토 후보"로 표현합니다. |
| 오류 시 보수적 처리 | 데이터/API 오류가 있으면 전략 추천을 보류합니다. |
| 실제 주문 금지 | 매수/매도 지시, 자동매매, 확정 수익 표현을 금지합니다. |

## 3. Agent 구성

## 3.1 Snapshot Agent

### 역할

KOSPI200 시장 데이터를 조회하고, 현재 시장의 변동성/왜도/레짐을 계산하는 Agent입니다.

### 현재 코드 근거

`snapshot (1).js`

### 입력

- `date` query parameter
- Yahoo Finance `^KS200` chart data
- 기본 range: 2년
- 기본 interval: 1일

### 처리 규칙

1. 입력 날짜를 ISO 날짜로 정규화합니다.
2. Yahoo Finance API에서 KOSPI200 일간 데이터를 조회합니다.
3. 유효한 종가 데이터만 사용합니다.
4. 요청일 또는 요청일 이전 가장 가까운 거래일을 선택합니다.
5. 최근 20일 로그수익률을 계산합니다.
6. 20일 실현변동성과 20일 왜도를 계산합니다.
7. 최근 60개 rolling stats를 기준으로 baseline과 spread를 계산합니다.
8. 현재 변동성과 왜도를 -100~100 점수로 환산합니다.
9. 변동성 점수와 왜도 점수로 레짐을 분류합니다.
10. confidence를 산출합니다.

### 출력 필드

| 필드 | 설명 |
| :--- | :--- |
| `source` | 데이터 출처 |
| `selectedDate` | 사용자가 요청한 기준일 |
| `actualDate` | 실제 사용된 거래일 |
| `k200Close` | KOSPI200 종가 |
| `k200PrevClose` | 직전 거래일 종가 |
| `realizedVol20` | 20일 실현변동성 |
| `skew20` | 20일 수익률 왜도 |
| `volScore` | 변동성 점수 |
| `skewScore` | 왜도 점수 |
| `confidence` | 레짐 판단 확신도 |
| `regimeKey` | 레짐 key |
| `regimeLabel` | 레짐 label |
| `regimeSubtitle` | 레짐 설명 |

### 예외 처리

| 상황 | 처리 |
| :--- | :--- |
| GET 외 요청 | 405 반환 |
| Yahoo Finance 실패 | 500 반환, 추천 보류 |
| 데이터 부족 | "Not enough historical data" 표시 |
| 가격 데이터 없음 | "No price points returned" 표시 |

## 3.2 Regime Detection Agent

### 역할

Snapshot Agent의 변동성 점수와 왜도 점수를 해석해 현재 시장 국면을 판단합니다.

### 현재 MVP 레짐

| 조건 | 레짐 | 설명 |
| :--- | :--- | :--- |
| `skewScore >= 0`, `volScore >= 0` | Regime 1 | Put skew, High vol |
| `skewScore < 0`, `volScore >= 0` | Regime 2 | Call skew, High vol |
| `skewScore >= 0`, `volScore < 0` | Regime 3 | Put skew, Low vol |
| `skewScore < 0`, `volScore < 0` | Regime 4 | Call skew, Low vol |

### 해석 규칙

1. 변동성 점수가 높으면 단순 방향성 전략보다 변동성 대응 전략을 우선 검토합니다.
2. 왜도 점수가 양수이면 하방 방어 수요가 강한 상태로 해석합니다.
3. 왜도 점수가 음수이면 상방 옵션 수요 또는 상승 기대가 강한 상태로 해석합니다.
4. confidence가 낮으면 강한 추천 대신 관찰/검토 후보로 표현합니다.

## 3.3 Advisor API Agent

### 역할

사용자 화면과 Advisor Worker 로직을 연결하는 API Agent입니다.

### 현재 코드 근거

`advisor.js`

### 처리 규칙

1. `worker.mjs`를 동적으로 로드합니다.
2. Node request header를 Fetch API `Headers`로 변환합니다.
3. 사용자의 요청 URL과 method를 유지해 `Request`를 생성합니다.
4. `worker.fetch(request)`를 호출합니다.
5. Worker 응답의 status, headers, body를 사용자에게 그대로 전달합니다.
6. 오류 발생 시 500 JSON을 반환합니다.

### 설계상 의미

이 Agent는 Advisor 핵심 로직을 특정 배포 환경에 묶지 않고 재사용하게 합니다. 즉, Cloudflare Worker 기반 로직을 Vercel/Node 환경에서도 호출할 수 있는 연결 계층입니다.

## 3.4 Option Advisor Agent

### 역할

Regime Detection 결과와 Option Playbook 데이터를 결합해 추천 전략과 회피 전략을 제시합니다.

### 입력

- `regimeKey`
- `regimeSubtitle`
- `volScore`
- `skewScore`
- `confidence`
- Option Playbook 전략 데이터
- 전략별 백테스트 결과

### 추천 규칙

1. 고변동 레짐에서는 Long Straddle, Long Strangle, Backspread 등 변동성 대응 전략을 우선 검토합니다.
2. 저변동 레짐에서는 Covered Call, Iron Condor 등 수익형 전략을 검토합니다.
3. 하방 skew가 강하면 손실 확대 가능성이 있는 short put 성격 전략은 주의 표시합니다.
4. 상방 skew가 강하면 상승 이익이 제한되는 전략은 우선순위를 낮춥니다.
5. confidence가 낮으면 Top Recommended가 아니라 "우선 검토 후보"로 표시합니다.
6. 고득점 전략이라도 현재 리스크 조건과 맞지 않으면 Avoid가 아니라 Watchlist로 분리합니다.

### 출력

- Top Recommended
- Watchlist
- Avoid Now
- 추천 사유
- 회피 사유
- 상세 Playbook 링크
- Committee Brief 문장

## 3.5 Option Playbook Repository Agent

### 역할

KOSPI200 옵션 전략 48개의 구조와 검증 데이터를 관리하는 전략 저장소 Agent입니다.

### 관리 데이터

- 전략명
- 전략 ID
- 포지션 구성
- 손익구조
- 적용 가능한 레짐
- 회피해야 할 레짐
- Greeks
- 월간 만기 기준 백테스트
- 승률, MDD, Sharpe, Sortino, VaR/CVaR

### 출력

- 전략 상세 설명
- 손익 프로파일
- 백테스트 요약
- 전략별 검토 포인트

## 3.6 Strategy Validation Agent

### 역할

Option Advisor가 제시한 전략이 검토자료로 사용할 수 있는지 검증합니다.

### 처리 규칙

1. 월간 옵션 만기 사이클을 기준으로 진입/청산을 검증합니다.
2. 거래비용 5bps를 반영합니다.
3. Purged Walk-Forward 방식으로 미래 정보 참조를 방지합니다.
4. 2008 금융위기, 2020 코로나, 2022 금리상승기 등 스트레스 구간을 확인합니다.
5. MDD, VaR, CVaR, Sharpe, Sortino를 산출합니다.
6. 결과를 PASS, FAIL, Review Required로 표시합니다.

## 3.7 Dynamic Portfolio Optimizer Agent

### 역할

검증된 전략을 대상으로 전략 조합 또는 비중 후보를 산출합니다.

### 주의

본 Agent는 실제 주문을 생성하는 시스템이 아니라 검토용 전략 조합 후보를 제시하는 역할입니다.

### 처리 규칙

- 단일 전략 집중을 피합니다.
- 변동성과 상관관계를 고려합니다.
- 거래비용과 회전율을 고려합니다.
- 현금 비중을 포함할 수 있습니다.

## 3.8 Performance Attribution Agent

### 역할

추천 전략의 사후 성과가 어떤 요인에서 발생했는지 분석합니다.

### 처리 규칙

1. 시장 방향성 효과를 분리합니다.
2. 변동성 효과를 분리합니다.
3. 시간가치 효과를 분리합니다.
4. 전략 선택 효과와 잔차를 분석합니다.
5. 다음 추천 로직에 개선 신호를 전달합니다.

## 3.9 MLOps & DevOps Hub Agent

### 역할

데이터 품질, API 상태, 모델 drift, 오류 로그, 재학습 필요 여부를 관리합니다.

### 처리 규칙

- Yahoo Finance 응답 실패를 기록합니다.
- `worker.mjs` 호출 실패를 기록합니다.
- `selectedDate`와 `actualDate` 불일치를 표시합니다.
- confidence가 낮은 구간을 모니터링합니다.
- 반복 오류 발생 시 담당자 점검 필요 상태를 표시합니다.

## 4. 프롬프트 로직

### 4.1 시장 해석 프롬프트

```text
너는 KOSPI200 옵션 전략 검토를 지원하는 Market Regime Agent다.
아래 snapshot 데이터를 기반으로 현재 시장 상태를 설명하라.

입력:
- selectedDate: {selectedDate}
- actualDate: {actualDate}
- k200Close: {k200Close}
- k200PrevClose: {k200PrevClose}
- realizedVol20: {realizedVol20}
- skew20: {skew20}
- volScore: {volScore}
- skewScore: {skewScore}
- confidence: {confidence}
- regimeSubtitle: {regimeSubtitle}

출력:
1. 현재 시장 상태 한 줄 요약
2. 변동성 해석
3. 왜도 해석
4. 전략 검토 방향
5. confidence가 낮을 경우 주의 문구

주의:
- 실제 매수/매도 지시를 하지 말 것
- 데이터 기준일과 실제 데이터일을 반드시 표시할 것
```

### 4.2 전략 추천 프롬프트

```text
너는 Option Advisor Agent다.
현재 KOSPI200 시장 레짐과 Option Playbook 전략 데이터를 결합해 검토 후보와 회피 전략을 제시하라.

입력:
- regimeKey: {regimeKey}
- regimeSubtitle: {regimeSubtitle}
- volScore: {volScore}
- skewScore: {skewScore}
- confidence: {confidence}
- strategyData: {strategyData}
- backtestSummary: {backtestSummary}

출력:
1. 우선 검토 전략 3개
2. 관찰 전략 3개
3. 회피 전략 3개
4. 각 전략의 근거
5. 백테스트 확인 필요사항
6. 투자위원회 보고서용 요약 문장

금지:
- 확정 수익 표현
- 실제 주문 지시
- 근거 없는 전략 추천
```

### 4.3 검증 프롬프트

```text
너는 Strategy Validation Agent다.
추천 전략을 투자위원회 검토자료로 사용할 수 있는지 검증하라.

입력:
- strategyName: {strategyName}
- regime: {regime}
- backtestPeriod: 2007-01-01 to 2026-06
- transactionCost: 5bps
- benchmark: KOSPI200

출력:
1. 검증 요약
2. 수익/위험 지표
3. 스트레스 구간 결과
4. 주요 리스크
5. PASS/FAIL/Review Required
6. 담당자 추가 확인사항
```

## 5. 예외 상황 처리 정책

| 예외 | Agent 대응 | 사용자 표시 |
| :--- | :--- | :--- |
| Yahoo Finance API 실패 | Snapshot Agent가 오류 반환 | "시장 데이터 조회 실패. 재시도 또는 기준일 확인 필요" |
| 데이터 포인트 부족 | 추천 중단 | "20일 변동성 계산에 필요한 데이터가 부족합니다." |
| `actualDate`가 `selectedDate`와 다름 | 실제 기준일 표시 | "요청일이 휴장일이어서 직전 거래일 데이터를 사용했습니다." |
| confidence 낮음 | 강한 추천 금지 | "확신도가 낮아 검토 후보로만 제시합니다." |
| Worker 호출 실패 | Advisor API Agent가 500 반환 | "Advisor 로직 호출 실패. 운영 점검 필요" |
| 백테스트 미확인 | Strategy Validation 필요 표시 | "백테스트 확인 후 보고서 반영 필요" |
| 사용자가 투자판단 요구 | 설명과 검토 기준만 제공 | "최종 투자판단은 내부 승인 절차에 따라 수행해야 합니다." |

## 6. 보고서 생성 규칙

투자위원회 보고서 초안에는 다음 항목을 반드시 포함합니다.

- 데이터 출처: Yahoo Finance public chart API 또는 내부 데이터
- 기준일: `selectedDate`
- 실제 사용 데이터일: `actualDate`
- KOSPI200 종가 및 전일 종가
- 20일 실현변동성
- 20일 왜도
- Regime 및 confidence
- 추천 전략과 근거
- 회피 전략과 근거
- 백테스트 및 리스크 검증 상태
- 최종 판단은 사람 승인 필요 문구

## 7. 핵심 메시지

6조 Agent 설계의 핵심은 "추천을 빨리 내는 AI"가 아니라 "근거와 한계를 함께 제시하는 검토 보조 AI"입니다. 현재 구현된 Snapshot API와 Advisor API를 기반으로, 시장 상태 판단부터 전략 후보 비교, 백테스트 검증, 투자위원회 보고서 초안까지 하나의 업무 흐름으로 연결하는 것이 목표입니다.
