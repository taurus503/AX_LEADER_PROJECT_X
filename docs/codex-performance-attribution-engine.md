# Codex Performance Attribution Engine Screen Handoff

이 문서는 `codex/performance-attribution-engine` 브랜치의 **화면 인수인계 메모**입니다.
핵심 대상은 `index.html`이며, 이 화면을 다른 컴퓨터에서 이어서 수정할 수 있도록 구성과 편집 지점을 적어둡니다.

## 화면 목적

- 성과 기여도 해석 결과를 한 화면에서 읽기 쉽게 보여줌
- 인포그래픽 요소를 섞어, 성과 분해와 레짐 해석을 빠르게 파악
- 외부 공개는 Vercel production URL로 확인

## 화면 구조

- `hero`
  - 화면 제목과 핵심 메시지
  - 상단에 성과 기여도 요약 막대
- `핵심 인사이트`
  - 알파/베타 분리, 레짐 적합성, 데이터 정합성, 사람 검토 포인트
- `분석 파이프라인`
  - Input → Decompose → Check → Signal 흐름
- `기여도 해석`
  - Brinson Attribution, Factor Attribution, Risk vs Skill
- `레짐 클러스터`
  - Bull / Transition / Bear 구간과 상태 설명
- `보고서와 업데이트 신호`
  - 리포트 필수 항목과 JSON update signal

## 주요 파일

- `index.html`
  - 실제 화면 본문, 스타일, 인포그래픽이 모두 들어 있는 메인 파일
  - 수정 우선순위 1번
- `vercel.json`
  - Vercel 정적 라우팅용 설정
- `README.md`
  - 저장소 첫 화면에 Vercel live demo 링크를 보여주는 안내 파일
- `performance attribution engine.txt`
  - 원문 참고자료

## 작업 원칙

- `main` 브랜치의 README는 수정하지 않음
- 다른 폴더의 README도 수정하지 않음
- 화면 수정은 가능한 한 `index.html`에서 시작
- 민감한 파일, 임시 파일, 대용량 파일은 저장소에 올리지 않음

## 유지보수 방법

1. 화면 텍스트나 레이아웃은 `index.html`에서 수정
2. 배포 관련 설정은 `vercel.json`에서 수정
3. 저장소 첫 화면 안내는 `README.md`에서 수정
4. 변경 후 Vercel URL에서 확인

## 협업 시 확인 위치

- 현재 브랜치: `codex/performance-attribution-engine`
- 화면 파일: `index.html`
- 배포 설정: `vercel.json`
- 저장소 첫 화면: `README.md`
- 외부 확인: Vercel production URL
