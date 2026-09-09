# Nexus

대학 학생회의 업무와 기억을 다음 기수까지 이어주는 **Student Council OS**.  
기존 Drive·Calendar를 대체하기보다 프로젝트, 업무, 회의, 결정사항의 맥락을 연결합니다.

---

## 🚀 현재 구현 완료 기능

Nexus는 현재 핵심 온보딩 및 업무 실행 체계가 구축되어 실제 학생회 팀원들과 협업할 수 있습니다:

1. **인증 및 계정 관리 (`/login`, `/auth/callback`)**
   - 이메일/비밀번호 로그인 및 소셜 로그인(Google, Kakao, Naver OAuth)
   - 비밀번호 재설정(`forgot-password`, `reset-password`)
   - 세션 기반 전역 경로 보호 Proxy (미인증 사용자 자동 리디렉트)
2. **학생회 온보딩 & 운영자 심사 (`/onboarding`, `/admin`)**
   - 새 학생회 생성 신청 (대학명, 학생회명, 신청 사유)
   - 사이트 운영자(`is_site_admin`) 전용 승인/반려 심사 콘솔
   - 운영자 승인 시 학생회 생성 및 신청자 총학생회장(`PRESIDENT`) 자동 임명
   - 기존 학생회 검색 및 가입 신청, 관리자 승인 체계
3. **프로젝트 관리 (`/projects`, `/projects/[id]`)**
   - 상태별 필터 탭 (전체 / 진행 중 / 계획됨 / 완료됨 / 보관됨)
   - 프로젝트 카드 그리드 (기간, 상태 칩, 설명, 업무 진척도 요약)
   - 새 프로젝트 등록 모달, 상세 정보 수정 및 관리자 전용 삭제
4. **업무 관리 (`/tasks`)**
   - 학생회 실행 단위 업무(Task) 생성 및 프로젝트 연결
   - 학생회 구성원 담당자 배정 및 마감일 관리
   - 체크박스 클릭 즉시 상태 변경 (`TODO` ↔ `DONE`), 마감일 초과 경고
   - 프로젝트 상세 화면 내 실시간 업무 목록 및 업무 추가 연동
5. **통합 대시보드 (`/dashboard`)**
   - '진행 중 프로젝트', '3일 이내 마감', '담당자 없는 업무' **100% 실데이터 연동**
   - 지금 당장 마감이 임박한 업무 목록 및 최근 프로젝트 실시간 렌더링

---

## 🛠 빠른 시작

Node.js 24 LTS와 npm을 사용합니다. `.nvmrc`가 팀의 기준 버전입니다.

```sh
git clone https://github.com/hhhhhyeonnnnn/Nexus.git
cd Nexus
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

### 품질 검증 스크립트

```sh
npm run lint          # ESLint 린트 검사
npm run typecheck     # TypeScript strict 타입 검사
npm run test:config   # Supabase 설정 안전성 검사
npm run test:db       # PGlite 메모리 PostgreSQL RLS 및 권한 검사 (10개 테스트)
npm run build         # Next.js 프로덕션 빌드 검사
```

---

## ⚙️ 환경 변수 (`.env.local`)

| 변수명 | 필수 여부 | 설명 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 필수 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 필수 | Supabase 공개 publishable 키 |
| `NEXT_PUBLIC_SITE_URL` | 필수 | 서비스 사이트 주소 (로컬: `http://localhost:3000`, 배포: Vercel 도메인) |
| `NEXT_PUBLIC_SOCIAL_GOOGLE` | 선택 | Google 소셜 로그인 활성화 (`true`/`false`) |
| `NEXT_PUBLIC_SOCIAL_KAKAO` | 선택 | Kakao 소셜 로그인 활성화 (`true`/`false`) |
| `NEXT_PUBLIC_SOCIAL_NAVER` | 선택 | Naver 소셜 로그인 활성화 (`true`/`false`) |
| `SUPABASE_SERVICE_ROLE_KEY` | 개발/마이그레이션 전용 | 클라이언트 노출 절대 금지, 서버 관리 키 |

### 🌐 Supabase Auth URL 설정 (배포 및 OAuth 필수)

소셜 로그인 및 리디렉트가 배포 환경에서 정상 작동하려면 Supabase Dashboard의 **Authentication > URL Configuration**을 설정해야 합니다:
- **Site URL**: `https://nexus-kappa-two-10.vercel.app` (또는 실제 배포 도메인)
- **Redirect URLs**:
  - `https://nexus-kappa-two-10.vercel.app/**`
  - `https://nexus-kappa-two-10.vercel.app/auth/callback`
  - `http://localhost:3000/**`

---

## 🏛 기술 스택 및 아키텍처

- **Framework**: Next.js 16 (App Router, Server Actions, React 19)
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS v4, shadcn/ui, Lucide Icons
- **Database / Auth**: Supabase PostgreSQL, Row Level Security (RLS), Supabase SSR
- **Testing**: Node.js Test Runner, PGlite (인메모리 PostgreSQL RLS 검증)

```text
src/
  app/                  # App Router 경로 (/dashboard, /projects, /tasks, /onboarding, /admin, /login)
  components/
    ui/                 # shadcn/ui 기반 원자 컴포넌트 (Button, Input, Card, Label)
    layout/             # AppShell, Sidebar
    common/             # StatusChip
  features/             # 도메인별 응집 (auth, organizations, projects, tasks)
    auth/               # 로그인, 회원가입, 세션 액션 및 소셜 버튼
    organizations/      # 온보딩, 가입/생성 신청, 관리자 심사
    projects/           # 프로젝트 CRUD, 상태 칩, 다이얼로그
    tasks/              # 업무 CRUD, 담당자 배정, 체크박스 토글
  lib/
    supabase/           # client, server, proxy(경로보호), env(설정검증)
    utils/              # cn 클래스 병합
  types/                # Database 타입 및 공통 모델 타입
supabase/migrations/    # 버전 관리되는 SQL 마이그레이션 이력
scripts/                # DB RLS 및 설정 자동 검증 테스트
docs/                   # 아키텍처, 데이터베이스 스키마, 핸드오프 문서
```

---

## 📋 로드맵

- [x] **Phase 1-A**: 개발 기반 및 App Layout, Figma Dashboard Shell
- [x] **Phase 1-B**: Supabase Auth (이메일 및 소셜 로그인) & 전역 세션 경로 보호
- [x] **Phase 1-C**: 학생회 조직 온보딩 (생성 신청, 운영자 승인, 가입 신청)
- [x] **Phase 1-D**: 프로젝트(Projects) CRUD 및 대시보드 실데이터 연동
- [x] **Phase 1-E**: 업무 관리(Tasks) CRUD 및 담당자 배정, 체크리스트 연동
- [ ] **Phase 1-F**: 회의록(Meetings) & 결정사항(Decisions) 도메인 구축
- [ ] **Phase 1-G**: AI 회의록 분석 (안건 요약, 태스크/결정사항 후보 추출 및 사용자 승인)
- [ ] **Phase 2**: 캘린더 연동, 예산(Budget), 제휴/업체(Vendor) 관리
- [ ] **Phase 3**: Google Drive 연동, 인수인계 RAG 어시스턴트
