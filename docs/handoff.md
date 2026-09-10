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
- **Supabase**: `nexus-dev` / `brknzpcbabwobihxjseq` / Seoul 프로젝트. 총 9개 마이그레이션 적용 완료. 13개 테이블 RLS 보호 및 18개 PGlite 테스트 100% 통과.

---

## 다음 작업 로드맵

- [ ] **Phase 1-H-b / 1-H-c**: 실시간 음성(STT) 회의록 작성 및 AI 문맥 오류 검출/사용자 확인 레이어
- [ ] **Phase 3**: Google Drive 연동 및 학생회 인수인계 RAG 어시스턴트

---

## 품질 검증 스크립트

```sh
npm ci
npm run lint          # ESLint 린트 검사 (0 warnings, 0 errors)
npm run typecheck     # TypeScript strict 타입 검사
npm run test:config   # Supabase 설정 안전성 검사
npm run test:db       # PGlite 메모리 PostgreSQL RLS 정책 검사 (18개 테스트 PASS)
npm run db:check      # 원격 Supabase 연결 및 RLS 격리 상태 검증
npx next build --webpack  # 프로덕션 최적화 빌드
```
