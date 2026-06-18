# progress.md 진행 기록

> 각 STEP 종료 시 한 줄 기록. 배포 전까지는 미완료 항목을 유지한다.

- [ ] STEP1 폴더 세팅
- [ ] STEP2 기획 문서 첨부 및 맥락 정리
- [x] STEP3 .env/.gitignore - 2026-06-15 Supabase/BizRouter 환경변수 템플릿 생성 및 키 파일 제외 처리
- [x] STEP4 Supabase 준비 - 2026-06-15 faqs 테이블 생성, RLS 조회 정책 적용, 샘플 FAQ 적재 및 검색 검증
- [x] STEP5 화면 - 2026-06-15 index.html 화면 뼈대 생성, 개인정보 의심 숫자 차단 검증
- [x] STEP6 디자인 - 2026-06-15 Pretendard, 3px 검정 테두리, 8px hard shadow 기반 네오브루탈 UI 규칙 적용
- [x] STEP6-1 디자인 리뉴얼 - 2026-06-15 첨부 이미지 기준 파스텔 3D 캐릭터 갤러리 스타일로 index.html 리디자인
- [x] STEP6-2 이미지 변형 - 2026-06-15 첨부 캐릭터 그리드를 민원 지식봇용 FAQ/답변/담당자 확인 히어로 이미지로 합성 적용
- [x] STEP7 검색(RAG) - 2026-06-15 Supabase FAQ 검색 함수 생성, 한국어 부분일치 검색 검증
- [x] STEP8 AI Hub/분류기 - 2026-06-15 하나카드 AI Hub 데이터 32,684건 정리, faqs.csv 생성, 경량 Naive Bayes 분류기 학습/검증
- [x] STEP9 답변(LLM) - 2026-06-15 /api/answer 추가, BizRouter 서버 전용 호출 구조와 FAQ 근거 답변 규칙 연결
- [x] STEP10 테스트 - 2026-06-15 golden_set.md와 test_cases.md 작성, 8개 골든 질문 기준 멀티에이전트 평가표와 우선 개선점 정리
- [x] STEP11 배포 - 2026-06-15 Vercel production 배포 완료, 서버리스 /api/answer 및 /api/config 구조 적용
- [x] STEP12 발표 - 2026-06-15 PRD 기반 1분 발표 텍스트 작성 및 로컬 데모 검증
