# Performance Attribution Engine

`codex/performance-attribution-engine` 브랜치 전용 정적 화면입니다.

- Live demo: https://option-rho.vercel.app
- Branch: `codex/performance-attribution-engine`
- Main screen: `index.html`
- Proxy API: `api/proxy.js`
- Deployment config: `vercel.json`
- Handoff note: `docs/codex-performance-attribution-engine.md`

## 제품 소개

외부 옵션 전략 플레이북을 읽어와 랜덤 또는 지정 전략을 기간별로 자동 평가하는 정적 대시보드입니다.  
수익분해 카드, 전략별 수익기여도, AI 해석, 성과 곡선, 트레이드 로그를 한 화면에서 확인할 수 있습니다.

## AI 설정

- `.env.example`: 로컬/배포 환경변수 형식 참고용
- `OPENAI_API_KEY`: AI 해석을 활성화하는 서버 환경변수
- `OPENAI_MODEL`: 선택 사항, 기본값은 `gpt-4o-mini`
- 키가 없으면 화면은 규칙 기반 대체 해석을 보여줍니다.

## 화면 목적

외부 전략 플레이북에서 전략 데이터를 읽어와서 랜덤 전략 또는 지정 전략을 기간별로 자동 평가합니다.

## 유지보수 포인트

1. 화면 수정은 `index.html`이 우선입니다.
2. 외부 원본 읽기 방식이 바뀌면 `api/proxy.js`를 함께 수정합니다.
3. Vercel 배포 설정은 `vercel.json`에서 관리합니다.
