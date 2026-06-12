# Investment Compliance Site

투자자가 펀드 투자 검토 시 필요한 규제 포인트를 빠르게 확인할 수 있도록 만든 내부용 웹 도구입니다.

## 핵심 특징

- 투자자 관점 검토
- 공식 법령 근거 중심 출력
- 계열사 영향, 이사회 필요 여부, 공시/보고 필요 여부를 한눈에 표시
- 브라우저에서 입력 후 검토 초안 생성
- 서버 함수에서 검토 결과를 만들고 공식 법령 링크 상태를 함께 확인

## 주요 파일

- `index.html`, `styles.css`, `app.js`: 화면과 프론트 로직
- `api/review.js`: 검토 결과를 생성하는 서버 함수
- `lib/legal-sources.js`: 법령 원문 기준 조문 팩
- `lib/review-engine.js`: 투자자 관점 검토 로직
- `sync_vercel_build.ps1`: 정적 배포용 `build/` 동기화 스크립트
- `vercel.json`: Vercel 라우팅 설정

## 실행 방식

정적 파일만 열면 API 없이 화면만 보입니다.  
검토 결과까지 포함한 전체 동작은 Vercel dev 또는 Vercel 배포 환경에서 확인합니다.

### 로컬 미리보기

```powershell
& 'C:\Users\user\AppData\Roaming\npm\vercel.cmd' dev --listen 8768
```

예시 페이지:

```text
http://127.0.0.1:8768/?demo=1
```

## 배포 전 build 동기화

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\sync_vercel_build.ps1
```

## 운영 메모

- `.env`는 커밋하지 않습니다.
- 공시/보고처는 조문 문언에서 직접 확인되는 범위만 표시합니다.
- 조문에 직접 없는 내용은 `근거없음`으로 남기도록 설계했습니다.
