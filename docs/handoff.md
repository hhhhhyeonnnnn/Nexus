# Nexus 개발 인수인계

2026-09-09 기준. 이 문서는 작업 전환 시점의 기록입니다. 다음 작업에서는 실제 코드, 최신 main과 PR 상태를 먼저 확인하세요.

## 이어서 시작하기

같은 Mac에서는 기존 `/Users/hhhhhyeonnnnn/Nexus` 폴더를 새 개발 도구에서 엽니다. `.env.local`은 이미 설정되어 있으므로 `.env.example`로 덮어쓰지 않습니다. 다른 컴퓨터에서는 저장소를 clone하고 `docs/supabase.md`에 따라 공개 환경변수를 별도로 설정합니다. 채팅 기록은 자동 이전되지 않으므로 아래 시작 프롬프트를 전달합니다.

읽는 순서: `AGENTS.md` → `README.md` → `docs/architecture.md` → `docs/database.md` → `docs/supabase.md` → `docs/api.md`.

저장소: https://github.com/hhhhhyeonnnnn/Nexus

## 완료 상태

- 초기 기반 PR #2 및 Supabase 연결 PR #4의 코드. 실제 병합 상태는 GitHub에서 확인합니다.
- Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4, shadcn/ui 패턴, Lucide. Node.js 24와 npm lockfile 사용.
- Figma 기반 Dashboard Shell과 모바일 메뉴. 루트는 `/dashboard`로 이동.
- Supabase `nexus-dev` / `brknzpcbabwobihxjseq` / Seoul 개발 프로젝트 생성.
- 초기 migration `20260909000000_initial_schema.sql` 적용과 이력 기록 완료. PostgreSQL 17.6, public 테이블 11개.
- 브라우저/서버 Supabase client, 공개 설정 검증, 세션 갱신 Proxy, 생성 DB 타입 준비.
- lint, typecheck, build, 설정 테스트 4개, PGlite DB 테스트 6개 통과.
- 실제 Auth 계정 2명의 로그인·토큰 갱신, 11개 테이블의 조직/프로필 격리와 쓰기 차단 검증. 테스트 계정과 데이터 정리 완료.

## 아직 구현하지 않은 것

로그인 UI, callback, 조직 생성/가입, CRUD, 실제 Dashboard 데이터 조회, AI, Drive 연동, 웹 배포. `/login`과 `/auth/callback`은 현재 404입니다. Proxy가 세션을 갱신하지만 로그인 강제나 서버 작업 권한 검사를 대신하지 않습니다. 사용자 결정에 따라 배포는 미룹니다.

## 다음 작업 제안

Auth와 조직 온보딩을 한 번에 크게 만들기보다 순서대로 진행합니다.

1. 로그인 방식과 가입 정책을 정리한 뒤 Auth Issue를 생성합니다. 이메일/비밀번호, 이메일 링크, 소셜 로그인 중 어떤 방식을 쓸지는 아직 정하지 않았습니다. 조직 가입 방식도 미정입니다.
2. 첫 PR에서 로그인/로그아웃, 필요한 callback, 실제 브라우저 세션 갱신, 인증이 필요한 경로 보호를 구현합니다. 오류 및 만료된 세션도 확인합니다.
3. 다음 PR에서 profiles 생성과 조직 생성/가입을 구현합니다. 조직 생성과 최초 관리자 등록은 한 트랜잭션이어야 하며, 임의 조직 가입이나 자기 역할 상승을 막습니다.
4. 이후 Project CRUD → Figma 기반 목록/상세 → Task → Meeting → AI 분석 검토/반영 순서로 진행합니다.

## 데이터와 인증 주의점

- 현재 정책은 본인 조직 SELECT만 허용합니다. profiles는 본인만 조회됩니다. INSERT/UPDATE/DELETE 차단은 의도된 초기 상태입니다.
- 쓰기를 구현할 때 새 migration과 최소 권한 RLS를 추가합니다. 일반 요청에 service-role client를 사용해 우회하지 않습니다.
- 이미 적용한 migration을 수정하거나 초기 migration을 원격에 다시 실행하지 않습니다.
- 조직 간 연결을 막는 복합 FK와 `private.is_organization_member` 함수를 유지합니다.
- 쓰기 정책이 추가되면 기존 테스트의 '모든 쓰기 거부' 기대값도 새 정책에 맞게 바꾸되, 타 조직 접근과 권한 상승 차단 검증은 유지합니다.
- DB 변경 후 `npm run db:types -- --project-id brknzpcbabwobihxjseq`로 타입을 다시 생성합니다.
- 로컬 CLI 인증은 이 Mac에 연결되어 있습니다. 다른 도구의 실행 환경·권한에 따라 재인증이 필요할 수 있습니다. 토큰과 DB 비밀번호를 채팅에 붙여넣지 않습니다.
- Docker 기반 로컬 Supabase 구동은 이 Mac에서 검증하지 않았습니다. `supabase/config.toml`은 원격 설정을 자동 변경하지 않습니다.
- ESLint는 Next.js 플러그인 호환성 때문에 9.x를 사용합니다. 무조건 최신 major로 업그레이드하지 않습니다.

## 검증과 협업

최신 `origin/main`을 확인하고 `feature/*` 작업 브랜치를 만듭니다. main 직접 작업·push 금지, develop 미사용. Issue → 작업 브랜치 → 검증 → PR → Review → Merge 절차를 유지합니다. 실행 중인 다른 코딩 도구가 같은 폴더를 동시에 수정하지 않도록 합니다.

```sh
npm ci
npm run lint
npm run typecheck
npm run test:config
npm run test:db
npm run build
npm run db:check
```

원격 RLS 재검증이 필요한 경우 `npm run test:db:remote -- --development`를 사용합니다. 이 명령은 실제 개발 프로젝트에 임시 계정/데이터를 생성한 뒤 정리하며 CLI 관리 권한이 필요합니다. 자세한 절차와 중단 시 복구 위치는 `docs/supabase.md`에 있습니다.

## 새 도구에 붙여넣을 시작 프롬프트

```text
이 저장소의 Nexus 개발을 이어서 진행해줘.
먼저 AGENTS.md, README.md, docs/handoff.md와 여기서 참조하는 문서를 읽고, git 상태와 최신 main을 확인해줘.
초기 기반과 Supabase 개발 연결은 완료됐어. 이미 적용한 migration을 다시 실행하지 말고 기존 .env.local을 보존해줘.
배포는 미루고 다음은 로그인과 학생회 조직 온보딩이야.
우선 코드와 문서로 현재 상태를 확인한 뒤, 아직 결정되지 않은 로그인 방식과 조직 가입 정책만 짧게 확인해줘.
정책이 정해지면 Issue와 feature 브랜치를 만들고 로그인/세션부터 작은 PR 단위로 구현해줘.
기존 Figma 디자인, 조직별 RLS, 사용자 세션 기반 접근, 테스트 및 PR 절차를 유지해줘.
비밀 키를 출력하거나 저장소에 커밋하지 마.
```
