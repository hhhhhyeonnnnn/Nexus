# Supabase 개발 환경

## Nexus 개발 프로젝트

- 프로젝트: `nexus-dev` (개인 Free 조직)
- 리전: Seoul / `ap-northeast-2`
- Project ref: `brknzpcbabwobihxjseq`
- URL: `https://brknzpcbabwobihxjseq.supabase.co`
- 초기 migration `20260909000000_initial_schema` 적용 및 이력 기록 완료
- PostgreSQL 17.6 / 11개 테이블 RLS 활성화
- Auth 연결과 11개 테이블의 익명 조회 차단 확인
- 실제 Auth 계정 2명으로 11개 테이블의 양방향 조회 격리·쓰기 차단 검증 완료, 임시 데이터 정리 완료

공개 API 키는 각 개발자의 `.env.local`에 설정합니다. DB 비밀번호는 앱 실행에 필요하지 않습니다.

## 연결 원칙

Next.js 브라우저/서버 클라이언트 모두 publishable 키(또는 기존 anon 키)와 사용자 세션을 사용합니다. 서버 client는 요청마다 새로 만들며 service-role 키로 RLS를 우회하지 않습니다.

`.env.example`을 `.env.local`로 복사하고 다음 값을 설정합니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Supabase 프로젝트의 Connect 또는 Settings → API Keys에서 프로젝트 URL과 publishable 키를 확인합니다. 기존 프로젝트는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`로 대체할 수 있습니다. 두 키를 함께 설정하면 publishable 키가 우선합니다.

공개 URL과 키가 모두 비어 있으면 기존 Shell이 실행됩니다. 일부만 설정하거나 HTTPS가 아닌 원격 주소, secret/service-role 키를 공개 변수에 넣으면 명확한 오류로 중단합니다. 사용하지 않는 anon 대체 변수도 검증합니다. `next.config.ts`에서도 검증하여 잘못된 키가 클라이언트 번들에 포함되기 전에 실패합니다.

실제 키는 문서, Issue, PR, 로그에 붙여넣지 않습니다. 서비스 관리 키와 DB 비밀번호는 일반 앱 실행에 필요하지 않습니다.

## 코드 위치

| 파일 | 역할 |
| --- | --- |
| `src/lib/supabase/env.ts` | 공개 설정 검증, 기존 anon 키 호환 |
| `src/lib/supabase/client.ts` | 브라우저 SSR client |
| `src/lib/supabase/server.ts` | 요청별 서버 client, cookies 연동, server-only 경계 |
| `src/lib/supabase/proxy.ts` | 토큰 갱신, 요청/응답 쿠키 동기화, SDK 캐시 방지 헤더 전달 |
| `src/proxy.ts` | dashboard/auth/login 경로의 Proxy 연결 |
| `src/types/database.ts` | 실제 DB에서 생성하는 public schema 타입 |

Proxy는 `getClaims()`로 세션을 검증/갱신합니다. 현재 단계에서는 로그인 강제나 페이지 접근 제어를 구현하지 않았습니다. 인증 UI를 만들 때 각 서버 작업에서 권한을 검증하고, Supabase를 사용하는 새 경로를 Proxy matcher에 추가해야 합니다.

Server Component에서 쿠키 쓰기는 제한되므로 Proxy가 먼저 갱신합니다. 인증 Server Action/Route Handler는 동일 client를 사용하되 응답을 사용자 간 캐시하지 않아야 합니다. `getSession()` 결과의 user 필드를 권한 검사의 근거로 삼지 않습니다.

## 개발 DB 적용

신규 개발 프로젝트만 대상으로 합니다. 기존 프로젝트에는 테이블과 migration 이력을 먼저 확인합니다. 저장소 migration을 검토한 후 적용하며, Dashboard SQL Editor로 직접 적용했다면 CLI 사용 전에 해당 migration의 이력을 정합화해야 합니다.

CLI를 사용할 경우:

```sh
npx supabase login
npx supabase link --project-ref <개발_프로젝트_REF>
npx supabase db push --linked --dry-run
npx supabase db push --linked
npm run db:types -- --linked
npm run db:check
```

CLI 인증 정보와 DB 비밀번호는 로컬 보안 저장소/환경으로 전달합니다. 연결 문자열에 비밀번호를 넣어 명령 기록에 남기지 않습니다. `db push`는 대상 프로젝트를 변경하므로 dry-run 결과와 대상 ref를 확인합니다. 인증·권한이 없는 개발자가 애플리케이션 실행을 위해 CLI 로그인을 할 필요는 없습니다.

기존 `nexus-dev`에서 타입만 갱신할 때는 DB 비밀번호나 link 없이 다음 명령을 사용할 수 있습니다.

```sh
npm run db:types -- --project-id brknzpcbabwobihxjseq
```

## 로컬 Supabase (선택)

Docker 호환 런타임을 별도로 설치·실행한 환경에서 사용할 수 있습니다.

```sh
npm run db:start
npm run db:migrate
npm run db:types -- --local
npm run db:stop
```

기본 API는 `http://127.0.0.1:54321`, Studio는 `http://127.0.0.1:54323`입니다. 로컬 키는 `npx supabase status`에서 확인해 `.env.local`에 설정합니다. `db:stop`에는 볼륨 삭제 옵션을 넣지 않았습니다. `db reset`은 데이터를 삭제하므로 공통 실행 절차에 포함하지 않습니다.

`supabase/config.toml`은 **로컬 환경 설정**이며 원격 설정에 자동 적용되지 않습니다. public schema만 노출하고, 새 테이블의 권한 자동 부여는 비활성화했습니다. 접근은 migration의 명시적 grant와 RLS 정책으로 관리합니다.

## 검증 명령

```sh
npm run test:config
npm run test:db
npm run db:check
npm run lint
npm run typecheck
npm run build
```

- `test:config`: 키 유형, 누락된 설정, 잘못된 URL 및 민감 값 없는 오류를 검증합니다.
- `test:db`: PGlite에서 SQL 제약 및 조직별 RLS를 검증합니다.
- `db:check`: 설정한 프로젝트의 Auth 연결과 11개 테이블의 익명 조회 차단을 읽기 전용으로 확인합니다. 사용자나 fixture를 만들지 않습니다.
- `db:types`: CLI가 실패하면 기존 타입 파일을 유지하며, 성공한 출력만 파일로 교체합니다.

CI는 네트워크나 개발 DB의 비밀 키 없이 로컬 테스트를 실행합니다.

실제 Auth JWT 및 PostgREST 검증:

```sh
npm run test:db:remote -- --development
```

이 명령은 `nexus-dev`에 한해 실행되며 CLI 프로젝트 관리 권한이 필요합니다. 임시 Auth 사용자 2명과 조직별 11개 테이블 fixture를 생성한 뒤 실제 로그인·토큰 갱신, 양방향 조직/프로필 격리, INSERT/UPDATE/DELETE 차단을 확인합니다. 관리 키는 Auth 테스트 계정 생성/삭제에만 사용하고 메모리에 보관합니다. 데이터 접근 검사는 공개 키와 각 사용자의 실제 세션을 사용합니다.

검증 후 생성한 ID만 지정해 정리합니다. 중단/정리 실패 시 `supabase/.temp/rls-*/fixtures.json`을 참고해 해당 fixture만 정리하세요. 이 파일에는 토큰/비밀번호를 저장하지 않습니다. 이 테스트는 Next.js 브라우저 로그인 UI나 쿠키 갱신 통합 테스트를 대체하지 않으며, 해당 흐름은 Auth 구현 시 검증합니다.

## 공식 참고

- [Supabase SSR 클라이언트](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [DB 타입 생성](https://supabase.com/docs/guides/api/rest/generating-types)
- [Next.js Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
