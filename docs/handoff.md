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
- **Phase 1-M (학생회 공지·건의·투표 소통 허브)**:
  - `announcements`, `petitions`, `polls`, `poll_votes` 스키마 및 마이그레이션 (`20260910400000_community_approvals_audit.sql`)
  - 학생회 관리자 콘솔 (`/community`): 공지사항 등록/고정/카테고리, 학생 건의함 심사 및 공식 답변 게시, 캠퍼스 투표 개설/마감/실시간 통계
  - 일반/외부 학생용 공개 소통 센터 (`/feed`): 비로그인 접근 가능, 모바일 최적화 공지 피드, 학생 건의 등록(익명/비밀글 지원), 실시간 원클릭 투표 참여 위젯 (로컬 중복 투표 방지)
- **Phase 1-N (다단계 전자결재 시스템)**:
  - `approvals`, `approval_logs` 스키마 구축
  - 전자결재함 콘솔 (`/approvals`): 지출 결의서, 행사/사업 기획안, 일반 품의서 기안 상신
  - 2단계 결재선(1차 담당 부서장 검토 → 2차 총학생회장/재정국장 최종 승인), 반려 시 필수 사유 작성
  - 한국 공문서 결재란 스타일의 인장/도장 시각화 타임라인 (`ApprovalDetailModal`) 및 최종 승인 시 회계 장부(`budgets`) 지출 자동 등록 연계
- **Phase 1-O (회계 결산 및 총회 감사 보고서 생성기)**:
  - 회계 장부 상단 `[📋 감사 결산 보고서]` 모달 (`AuditReportModal`) 연동
  - 학기/기간별(1학기, 여름방학, 2학기, 전체) 자동 결산 집계 (총예산, 총수입, 총지출, 이월 잔액, 집행률)
  - 부서별/프로젝트별 지출 결산표, 영수증 적격 증빙률(%) 검증 및 무증빙 내역 경고
  - A4 규격 공식 감사 서식 (`@media print` 최적화, 학생회장/재정국장/감사위원장 서명 및 직인 날인 서식) 원클릭 PDF 출력
- **Phase 1-P (AI 어시스턴트, 전역 통합 검색, 실시간 알림 센터, 대시보드 관제탑)**:
  - **지능형 AI 어시스턴트 (Nexus AI)**: `gpt-4o-mini` 기반 RAG 어시스턴트 모듈 (`askNexusAssistant`). 예산 잔액, 진행 프로젝트, 마감 업무, 최근 회의 의결 사항, 결재 대기 현황 등 학생회 실시간 데이터 기반 질문-답변 및 추천 액션 링크 제공. OpenAI 키 부재 시에도 데이터베이스 기반 스마트 폴백 지원.
  - **전역 빠른 검색 (`Cmd+K` / `Ctrl+K` Command Palette)**: 키보드 단축키 및 사이드바/헤더 검색창 연동. 프로젝트, 업무, 회의록, 결정사항, 전자결재, 공지사항, 행사 신청 폼 통합 검색 및 키보드 화살표 네비게이션 지원.
  - **실시간 활동 알림 센터 (Notification Center)**: `notifications` 테이블 마이그레이션 (`20260910500000_notifications.sql`) 및 수신자 본인 격리 RLS 정책 적용. 헤더 알림 벨(`NotificationBell`), 미확인 배지 카운터, 30초 자동 폴링, 업무 배정 및 결재 승인/반려 시 실시간 알림 생성 및 읽음 처리.
  - **대시보드 실시간 관제탑 (Control Tower)**: 결재 대기, 영수증 미첨부 지출 경고, 행사 접수/티켓 신청, 미답변 학생 건의사항 실시간 감지 스트립 및 원클릭 바로가기 탑재.
- **Phase 1-Q (직급별 맞춤형 스마트 OS: 회장단 14개, 국장단 12개, 부원 9개 사이드바 및 역할별 맞춤형 홈 대시보드)**:
  - **직급 판정 엔진 & 전역 컨텍스트 (`RoleProvider` / `useRoleContext`)**: `organization_members.role`, `job_title`, `department_id`를 분석하여 `EXECUTIVE`(회장단), `HEAD`(국장단), `MEMBER`(일반 부원) 자동 판정.
  - **회장단 14개 풀스펙 사이드바**: Control Tower, 조직 현황, 전체 프로젝트, 전체 업무, 전체 일정, 전자결재, 전체 회계, 구성원 관리, 행사·부스, 제휴·업체, 문서 및 회의록, 소통·피드, Nexus AI, 조직 설정.
  - **국장단 12개 실무 중심 사이드바**: 부서 대시보드, 업무 관리, 프로젝트, 캘린더, 전자결재, 부서 회계, 부서원, 행사·부스, 제휴·업체, 문서 및 회의록, 소통·피드, Nexus AI.
  - **부원 9개 개인 포커스 사이드바**: 홈, 내 업무, 내 프로젝트, 캘린더, 문서 및 회의록, 소통·피드, 내 지출·영수증, 내 전자결재, Nexus AI.
  - **부원 전용 홈 (“오늘 내가 뭐 해야 하지?”)**: 본인 담당 긴급/마감 업무 즉시 체크박스 토글, 퀵 액션 바(영수증 촬영/결재 기안/AI 질의), 이번 주 개인 일정, 참여 중인 프로젝트, 최근 지출 내역 한눈에 제공.
  - **국장단 실무 대시보드 (“우리 국 현황”)**: 부서 관제탑(지연 업무, 미배정 업무, 1차 승인 대기 결재, 미증빙 영수증), 국원별 업무량 분배(Workload) 차트, 부서 프로젝트/업무 요약.
  - **회장단/관리자용 역할 시점 미리보기(Role Switcher)**: 사이드바 하단에서 `[회장단 뷰]`, `[국장단 뷰]`, `[부원 뷰]` 원클릭 토글 지원.
- **Phase 1-R (전 도메인 실시간(Realtime) 동기화 인프라 및 라이브 반응 시스템)**:
  - **Supabase Realtime Publication 마이그레이션 (`20260911150000_supabase_realtime_setup.sql`)**: `notifications`, `organization_join_requests`, `organization_creation_requests`, `form_submissions`, `event_forms`, `polls`, `poll_votes`, `petitions`, `approvals`, `approval_logs`, `tasks`를 Realtime publication에 안전하게 등록.
  - **React 범용 실시간 훅 (`src/lib/supabase/realtime.ts`)**: `useRealtimeSubscription` (테이블/필터 구독 및 이벤트 처리) & `useRealtimeRefresh` (디바운스 Next.js App Router 백그라운드 데이터 재검증).
  - **온보딩 가입 승인 실시간 자동 진입**: 승인자가 가입 승인 클릭 즉시 신청자 화면에서 축하 배너와 함께 1.8초 뒤 대시보드로 자동 라우팅.
  - **실시간 활동 알림 및 플로팅 토스트**: 알림 발생 0.1초 만에 화면 우측 하단 슬라이드 인 라이브 토스트 노출 및 배지 갱신.
  - **현장 티켓 체크인 데스크 다중 스태프 실시간 동기화**: 다른 스태프의 체크인이 즉시 반영되어 중복 입장 방지 및 실시간 출석률 프로그레스 바 연동.
  - **공개 신청 폼 잔여석 카운트다운**: 실시간 접수 현황 카운트다운 및 정원 마감 즉시 접수 차단.
  - **캠퍼스 라이브 투표 득표율 실시간 반영**: 학우 투표 시 득표율 및 득표수 그래프 바가 개표 방송처럼 라이브로 상승.
  - **전자결재 실시간 인장 날인 & 대시보드/업무 현황 동기화**: 결재권자 승인/반려 시 실시간 도장 날인 및 관제탑/업무 리스트 무중단 자동 동기화.
- **Phase 1-S (서비스 필수 안전장치: 개인정보보호법 준수 약관 및 Supabase Storage 버킷 연동)**:
  - **스토리지 마이그레이션 (`20260911160000_storage_setup.sql`)**: Supabase Storage 버킷(`receipts`: 10MB, `attachments`: 50MB) 등록 및 Row-Level Security(Public Read, Authenticated Insert/Update) 정책 수립.
  - **스토리지 업로드 유틸리티 (`src/lib/supabase/storage.ts`)**: Base64 데이터 및 File 객체를 디코딩하여 Supabase Storage에 자동 업로드하고 고유 CDN 공개 URL 발급.
  - **영수증 OCR 저장소 연동 (`ReceiptOcrDialog`)**: 장부 등록 시 대용량 Base64 원본 텍스트 대신 Supabase Storage CDN URL(`receipt_url`)로 안전하게 치환 저장.
  - **대한민국 개인정보보호법 표준 약관 및 방침 (`/terms`, `/privacy`)**: 학생회 자치 환경에 특화된 서비스 이용약관 및 개인정보 처리방침 전문 페이지 구축.
  - **약관 동의 모달 & 유효성 검증 (`PrivacyConsentModal`, `/apply/[id]`, `/login`)**: 축제/부스 공개 신청 폼에 `[필수] 개인정보 수집·이용 동의` 체크박스 및 전문 보기 모달 연동, 미동의 시 제출 차단, 로그인 화면 하단 약관 고지 추가.
- **Supabase**: `nexus-dev` / `wsqyubzskzrvxphlffyv` / Seoul 프로젝트. 총 15개 마이그레이션 적용 완료. 23개 테이블 RLS 보호 및 23개 PGlite 테스트 100% 통과.

---

## 다음 작업 로드맵

- [ ] **2단계**: 외부 공유 바이럴 및 스마트폰 바로가기 (카카오톡/에브리타임 링크 공유 OpenGraph 썸네일 미리보기 + 스마트폰 홈 화면 추가 PWA)
- [ ] **3단계**: 프로덕션 방어막 (비인가 접근 차단 미들웨어 정교화, 모바일 반응형 터치 UX 최적화)
- [ ] **4단계**: 성능 & 장애 모니터링 (Next.js 빌드 번들 경량화, 에러 바운더리)

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
