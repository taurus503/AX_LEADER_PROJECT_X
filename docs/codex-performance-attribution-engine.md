# Codex Performance Attribution Engine

이 문서는 `codex/performance-attribution-engine` 브랜치 전용 인수인계 메모입니다.

## 화면 목적

- 외부 전략 플레이북을 자동으로 읽어옴
- 전략을 랜덤 또는 수동으로 선택함
- 사용자가 고른 기간의 거래를 필터링해 성과를 평가함
- 결과를 인포그래픽, 요약 카드, 차트, 트레이드 표로 보여줌

## 주요 파일

- `index.html`
  - 화면 본문과 스타일, 평가 로직이 들어 있는 메인 파일
  - 다른 사람이 가장 먼저 볼 파일
- `api/proxy.js`
  - 외부 플레이북 HTML을 같은 출처로 가져오는 Vercel 함수
  - 외부 사이트는 수정하지 않음
- `vercel.json`
  - 정적 배포 설정
- `performance attribution engine.txt`
  - 원문 참고자료

## 유지보수 원칙

- `main` 브랜치의 README는 건드리지 않음
- 다른 폴더의 README도 건드리지 않음
- 이 브랜치에서만 화면과 배포 보조 파일을 추가/수정함
- 외부 원본 사이트는 변경하지 않음
- 민감한 파일, 임시 파일, 빌드 산출물은 저장소에 올리지 않음

## 구현 흐름

1. `index.html`이 `/api/proxy?url=...`로 외부 페이지를 요청함
2. `api/proxy.js`가 허용된 호스트만 서버 측에서 읽어옴
3. 화면에서 `playbookData`와 `playbookBacktestData`를 추출함
4. 랜덤 전략 또는 선택 전략을 기간별로 평가함
5. 결과를 카드, 차트, 표로 렌더링함

## 협업 시 확인 위치

- 현재 브랜치: `codex/performance-attribution-engine`
- 화면 파일: `index.html`
- 프록시 함수: `api/proxy.js`
- 배포 설정: `vercel.json`
- 외부 확인: `https://option-rho.vercel.app`
