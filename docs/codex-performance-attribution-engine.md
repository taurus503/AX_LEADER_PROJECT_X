# Codex Performance Attribution Engine

이 문서는 `codex/performance-attribution-engine` 브랜치 전용 인수인계 메모입니다.
저장소의 기존 `README.md`나 다른 폴더의 README는 건드리지 않습니다.

## 브랜치 목적

- 성과 기여도 해석 화면을 단일 정적 HTML로 유지
- 다른 컴퓨터에서도 이어서 수정 가능하도록 구조를 단순하게 유지
- 외부 공개는 Vercel 배포 URL로 확인

## 주요 파일

- `index.html`
  - 화면 본문, 스타일, 인포그래픽 요소가 모두 들어 있는 메인 파일
  - 다른 사람이 가장 먼저 수정할 파일
- `vercel.json`
  - Vercel 정적 배포용 설정
- `performance attribution engine.txt`
  - 원문 참고자료

## 작업 원칙

- 기존 `main` 브랜치의 README는 수정하지 않음
- 다른 폴더의 README도 수정하지 않음
- 이 브랜치 전용 설명은 여기만 갱신
- 민감한 파일, 임시 파일, 대용량 파일은 저장소에 올리지 않음

## 유지보수 방법

1. 화면 수정은 `index.html`만 먼저 변경
2. 배포 설정이 필요하면 `vercel.json` 수정
3. 로컬 확인 후 브랜치에 커밋
4. Vercel URL에서 결과 확인

## 협업 시 확인 위치

- 현재 브랜치: `codex/performance-attribution-engine`
- 화면 파일: `index.html`
- 배포 설정: `vercel.json`
- 외부 확인: Vercel production URL

