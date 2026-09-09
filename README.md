# Nexus

대학 학생회의 업무와 기억을 다음 기수까지 이어주는 **Student Council OS**.
기존 Drive·Calendar를 대체하기보다 프로젝트, 업무, 회의, 결정사항의 맥락을 연결합니다.

## 현재 범위

초기 개발 기반만 구성했습니다. `/`는 `/dashboard`로 이동하며 Figma 기반 공통 App Layout, Sidebar와 데이터 미연결 상태의 Dashboard Shell을 표시합니다. 모바일 메뉴 열기/닫기와 본문 건너뛰기를 지원합니다. 비활성 메뉴와 생성 버튼은 후속 개발 대상입니다.

로그인, 조직 생성, CRUD, 실제 데이터 조회, OpenAI 호출, RAG, Drive 연동은 아직 구현하지 않았습니다. DB migration은 초안이며 원격 Supabase에 적용하지 않았습니다.

## 빠른 시작

Node.js 24 LTS와 npm을 사용합니다. `.nvmrc`가 팀의 기준 버전입니다.

```sh
git clone https://github.com/hhhhhyeonnnnn/Nexus.git
cd Nexus
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

[http://localhost:3000](http://localhost:3000)을 열면 됩니다. **현재 Shell은 환경변수를 채우지 않아도 실행됩니다.**

```sh
npm run lint
npm run typecheck
npm run test:db
npm run build
npm start
```

`typecheck`는 Next.js 라우트 타입 생성 후 strict TypeScript 검사를 실행합니다. `test:db`는 메모리 내 PostgreSQL(PGlite)에서 migration과 조직 분리를 확인합니다. 실제 Supabase Auth/API 통합 테스트를 대체하지 않습니다.

## 기술 구성

- Next.js 16 App Router / React 19 / TypeScript strict
- Tailwind CSS 4 / shadcn/ui 호환 컴포넌트 및 CLI 설정 / Lucide
- Noto Sans KR: Fontsource 패키지에서 로컬 번들링
- Supabase PostgreSQL / Auth / RLS: DB 초안과 디렉터리 준비
- OpenAI API: 향후 서버에서만 연동
- Vercel + Supabase 배포 예정; 현재 배포 없음

설치 버전은 `package-lock.json`을 기준으로 재현합니다.

## 폴더 구조

```text
src/
  app/                  # App Router, dashboard shell, 후속 라우트 자리
  components/
    ui/                 # shadcn/ui 패턴 Button, Card
    layout/             # AppShell, Sidebar
    common/             # StatusChip
  features/             # organizations, projects, tasks, meetings 등 도메인
  lib/
    supabase/           # 후속 browser/server client
    ai/                 # 후속 서버 AI + schema validation
    utils/              # cn
  types/                # 후속 공통 타입 / 생성 DB 타입
supabase/migrations/    # 초기 SQL 초안
scripts/                # DB 경계 검증
docs/                   # 구조, DB, API, 설계 결정
.github/                # PR / Issue 템플릿, 품질 CI
```

`.gitkeep`만 있는 폴더는 확장 위치를 예약하며 라우트나 기능을 생성하지 않습니다.

## 디자인 기준

[Figma Dashboard · 3:2](https://www.figma.com/design/aGiZ5xJjFH21tDgvJLALi0/?node-id=3-2)를 확인하고 적용했습니다.
224px Sidebar, 56px Header, 32px 본문 여백, 24px 섹션 간격, 얇은 테두리, 4/6/8px 모서리, `#5b5bd6` Indigo Accent, `#f7f7f9` Sidebar와 Noto Sans KR을 사용합니다.

실제 데이터가 없는 초기 단계이므로 이름·조직·통계·활동 샘플은 미연결 상태로 바꿨습니다. Figma의 `S` 로고와 학생회 OS 명칭은 제품명 Nexus / `N`으로 표시합니다. 모바일은 동일한 패턴을 접이식 메뉴와 단일 열로 확장했습니다.

추가 UI는 `npx shadcn@latest add <component>`로 가져올 수 있습니다. `components.json`의 alias와 `globals.css` 토큰을 유지하고 기존 컴포넌트를 덮어쓰기 전에 차이를 확인하세요.

## 환경변수

| 이름 | 용도 | 현재 필수 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 아니요 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | RLS가 적용되는 공개 클라이언트 키 | 아니요 |
| `SUPABASE_SERVICE_ROLE_KEY` | 필요한 경우에만 사용하는 서버 관리 키 | 아니요 |
| `OPENAI_API_KEY` | 서버 AI 분석 API | 아니요 |

실제 값은 `.env.local`에만 보관합니다. 마지막 두 키는 절대 `NEXT_PUBLIC_`로 노출하지 않습니다. 일반 사용자 요청에 service-role 키를 사용하지 않습니다.

## 협업

작업 전 [AGENTS.md](AGENTS.md)를 읽습니다. Issue → 작업 브랜치 → 개발/검증 → Commit → Push → PR → Review → Merge 순서를 따릅니다. main 직접 작업·push 금지, develop 미사용.

`main`을 팀의 공통 기준 브랜치로 사용합니다. 빈 저장소 초기화를 위한 최초 기준 커밋만 예외로 생성하고, 초기 설정을 포함한 코드 변경은 작업 브랜치에서 PR로 반영합니다. 새 작업은 최신 `origin/main`에서 작업 브랜치를 만들어 시작하세요.

PR CI는 lint, typecheck, DB 테스트, production build를 실행합니다. GitHub에서 PR 필수 리뷰와 필수 CI를 별도로 설정해야 합니다.

## 문서 / 다음 Issue

- [Architecture](docs/architecture.md)
- [Database](docs/database.md)
- [API 및 AI 경계](docs/api.md)
- [초기 설계 결정](docs/decisions/0001-foundation.md)

권장 순서:
1. `[SETUP] Supabase 로컬/개발 환경 연결 및 migration 검증`
2. `[AUTH] 로그인·세션·profiles 및 Organization 생성/가입 정책`
3. `[BE] Project CRUD와 조직별 쓰기 RLS`
4. `[FE] Figma 기반 Project 목록/상세와 Dashboard 데이터 연결`
5. `[BE/FE] Task → Meeting → AI 분석 schema → 확인 및 반영`

Phase 2는 Calendar/Budget/Vendor, Phase 3는 Drive/AI Assistant·RAG/Handover입니다.
