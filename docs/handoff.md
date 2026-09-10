# Nexus 개발 인수인계

2026-09-10 기준 (Phase 1 전 모듈 완료 상태). 이 문서는 작업 전환 시점의 기록입니다. 다음 작업에서는 실제 코드, 최신 main과 PR 상태를 먼저 확인하세요.

## 이어서 시작하기

같은 Mac에서는 기존 `/Users/hhhhhyeonnnnn/Nexus` 폴더를 새 개발 도구에서 엽니다. `.env.local`은 이미 설정되어 있으므로 `.env.example`로 덮어쓰지 않습니다. 다른 컴퓨터에서는 저장소를 clone하고 `docs/supabase.md`에 따라 공개 환경변수 및 `OPENAI_API_KEY`를 별도로 설정합니다.

읽는 순서: `AGENTS.md` → `README.md` → `docs/architecture.md` → `docs/database.md` → `docs/supabase.md` → `docs/api.md`.

- 저장소: https://github.com/hhhhhyeonnnnn/Nexus
- 배포 사이트: https://nexus-kappa-two-10.vercel.app (Vercel icn1 서울 리전)

---

## 완료 상태 (Phase 1 완료)

- **Phase 1-A**: Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, shadcn/ui 패턴, Lucide Icons, Figma 대시보드 셸
- **Phase 1-B**: Supabase Auth (이메일 및 소셜 로그인: Google/Kakao/Naver) & 전역 세션 경로 보호 Proxy
- **Phase 1-C**: 학생회 조직 온보딩 (생성 신청, 운영자 승인 콘솔, 가입 신청 및 관리자 승인)
- **Phase 1-D**: 프로젝트(Projects) CRUD 및 대시보드 실데이터 연동
- **Phase 1-E**: 업무 관리(Tasks) CRUD 및 담당자 배정, 체크리스트 연동
- **Phase 1-F**: 캘린더(`events`), 제휴·협력 업체(`vendors`), 회계 장부(`finance`/`budgets`) 도메인 구축
- **Phase 1-G**: 회의록(Meetings) & 결정사항(Decisions) 도메인 구축
- **Phase 1-I**: 대시보드 실데이터 완성 (예산 잔액 KPI, 이번 주 회의, 최근 결정사항, 활동 피드), 프로젝트 진행률(Progress bar) 시각화
- **Phase 1-H**: AI 회의록 분석 (`gpt-4o-mini` 기반 안건 요약, 태스크/결정사항 후보 추출, Zod 스키마 검증, 사용자 검토 후 명시적 등록)
- **Phase 1-J (조직도 & 부서/직책 관리 및 업무·회계 연동)**:
  - `departments` 스키마 및 마이그레이션 (`20260910200000_departments_and_org_chart.sql`)
  - 조직도 시각화 탭 (`/members?tab=org-chart`): 회장단 카드, 집행국 그리드, 국장/팀원 계층, 미배정 구성원 카드, 기본 4대 국 일괄 생성
  - 부서 CRUD 모달 및 구성원 부서/직책(`job_title`) 배정 모달
  - 구성원 목록에 부서 태그 및 직책 배지 표시
  - 업무(Tasks) 생성/수정 및 카드에 부서 태그 연동, 부서별 필터링 지원
  - 회계(Finance) 장부 등록/수정 및 테이블에 부서 태그 연동, 부서별 필터링 지원
- **Phase 1-H-b & 1-H-c (실시간 음성 STT 및 AI 문맥 오류 교정 확인)**:
  - 브라우저 Web Speech API 기반 실시간 한국어(`ko-KR`) 음성 받아적기 훅 (`useSpeechRecognition`)
  - 실시간 녹음 모달 (`RealtimeSttDialog`): 경과 시간 타이머, 중간(interim)/확정(final) 텍스트 스트리밍, 일시정지/재개/편집
  - AI 문맥 오류 검출 및 교정 제안 모듈 (`clarifyTranscriptWithAI`): 학생회 부서명, 직책, 프로젝트, 참석자 명단 기반의 발음 오인식 단어 감지 및 교정 이유 제시 (Zod 스키마 검증)
  - 교정 확인 인터랙티브 인터페이스: 개별 카드 [교정 적용], [원문 유지], [일괄 적용] 및 최종 회의록 [기존 내용 뒤에 추가] / [새로 덮어쓰기] 저장 연동
- **Phase 1-K (행사/축제 부스 신청 & 참가자 폼/티켓 관리 시스템)**:
  - `event_forms` 및 `form_submissions` 스키마 및 마이그레이션 (`20260910300000_event_forms_and_tickets.sql`)
  - 관리자 전용 신청 폼 콘솔 (`/forms`): 폼 목록, 진행 상태(모집 중/마감/작성 중), 부스/티켓 프리셋 및 동적 맞춤 설문 필드 빌더 모달 (`CreateFormDialog`)
  - 폼 상세 및 심사 뷰 (`/forms/[id]`): 신청자 목록, 승인/반려 심사, 맞춤 설문 응답 모달, 엑셀(CSV, UTF-8 BOM) 다운로드
  - 현장 실시간 티켓 체크인 데스크 (`CheckinView`): 티켓 코드/학번/이름 검색, 실시간 입장률 프로그레스, 중복 입장 경고 방지 배지, 체크인 타임라인
  - 비로그인 학생용 반응형 공개 신청 페이지 (`/apply/[id]`): 모바일 최적화, 정원 잔여 카운터, 신청서 제출 즉시 고유 티켓(`TKT-2026-XXXX`) 발급 및 [내 티켓 조회] 기능
- **Phase 1-L (영수증 OCR Vision AI 및 회계 지출 결의서 자동 입력)**:
  - OpenAI Vision API(`gpt-4o-mini`) 기반 영수증 분석 모듈 (`analyzeReceiptOcr`)
  - 학생회 컨텍스트(등록 거래처, 부서, 프로젝트)를 프롬프트에 주입하여 가맹점 상호명, 결제일자, 금액, 추천 부서/거래처, 상세 구매 품목 자동 추출 (Zod 스키마 검증)
  - 인터랙티브 모달 (`ReceiptOcrDialog`): 브라우저 Canvas 기반 자동 리사이즈(최대 1200px 압축), Split Review 뷰(좌: 원본 영수증 / 우: 자동 완성된 지출 결의서)
  - 지출 장부 저장 연동 (`createLedgerEntry`) 및 장부 테이블 내 영수증 사진 모달 라이트박스 뷰어 지원
- **Supabase**: `nexus-dev` / `brknzpcbabwobihxjseq` / Seoul 프로젝트. 총 11개 마이그레이션 적용 완료. 16개 테이블 RLS 보호 및 20개 PGlite 테스트 100% 통과.

---

## 다음 작업 로드맵

- [ ] **Phase 2**: 전체 통합 대시보드 고도화 및 실시간 활동 알림 센터 (4번 로드맵)
- [ ] **Phase 3**: Google Drive 연동 및 학생회 인수인계 RAG 어시스턴트 (5번 로드맵)

---

## 품질 검증 스크립트

```sh
npm ci
npm run lint          # ESLint 린트 검사 (0 warnings, 0 errors)
npm run typecheck     # TypeScript strict 타입 검사
npm run test:config   # Supabase 설정 안전성 검사
npm run test:db       # PGlite 메모리 PostgreSQL RLS 정책 검사 (19개 테스트 PASS)
npm run db:check      # 원격 Supabase 연결 및 RLS 격리 상태 검증
npx next build --webpack  # 프로덕션 최적화 빌드
```
