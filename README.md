# Performance Attribution Engine

`codex/performance-attribution-engine` 브랜치 전용 정적 화면입니다.

- Live demo: https://option-rho.vercel.app
- Branch: `codex/performance-attribution-engine`
- Main screen: `index.html`
- Proxy API: `api/proxy.js`
- Deployment config: `vercel.json`
- Handoff note: `docs/codex-performance-attribution-engine.md`

## 화면 목적

외부 전략 플레이북에서 전략 데이터를 읽어와서 랜덤 전략 또는 지정 전략을 기간별로 자동 평가합니다.

## 유지보수 포인트

1. 화면 수정은 `index.html`이 우선입니다.
2. 외부 원본 읽기 방식이 바뀌면 `api/proxy.js`를 함께 수정합니다.
3. Vercel 배포 설정은 `vercel.json`에서 관리합니다.
