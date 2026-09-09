# Architecture

## 제품 경계

Nexus는 별도 백엔드 서버 없이 Next.js에서 UI, Server Actions 및 Route Handlers를 제공합니다. Supabase가 데이터와 인증을 담당하며 OpenAI 요청은 Next.js 서버에서만 실행할 예정입니다. 현재 실행 경로는 정적 Dashboard Shell뿐입니다.

```text
Browser → Next.js App Router
            ├─ Server Components / 공통 UI
            ├─ Server Actions / Route Handlers (예정)
            ├─ Supabase user-scoped client → PostgreSQL + RLS (예정)
            └─ AI schema validation → 사용자 확인 → 원자적 반영 (예정)
```

## 디렉터리 책임

- `src/app`: 라우트, 레이아웃, 페이지 조립. 루트 layout은 폰트/메타데이터만 포함하여 후속 인증 화면에 Sidebar가 붙지 않도록 합니다.
- `src/components/layout`: 224px Sidebar와 56px Header를 가진 AppShell. 현재 dashboard layout이 사용하며 다른 Core 라우트에서도 공유합니다.
- `src/components/ui`: shadcn/ui의 로컬 소스 패턴으로 Button, Card를 관리합니다. Figma에 맞춰 크기와 shadow를 조정했습니다.
- `src/components/common`: 도메인에 의존하지 않는 StatusChip 등.
- `src/features/<domain>`: 후속 도메인 조회/변경/검증 및 도메인 컴포넌트.
- `src/lib/supabase`: 후속 browser/server client. 연결 전이라 빈 위치만 준비했습니다.
- `src/lib/ai`: 후속 server-only OpenAI 호출과 schema 검증.
- `src/types`: 후속 생성 Supabase 타입. 아직 사용하지 않는 가상 DB 타입을 작성하지 않습니다.

AppShell의 모바일 토글만 client state를 사용하고 Dashboard 본문은 Server Component입니다. 데이터 저장소나 전역 상태 관리 라이브러리는 도입하지 않았습니다.

## 디자인

Figma `aGiZ5xJjFH21tDgvJLALi0`, Dashboard `3:2`의 design context와 화면을 확인했습니다. 색상은 `globals.css` CSS 변수 및 Tailwind theme으로 관리하고 간격은 Tailwind의 4px 기반 scale을 사용합니다. 반응형 추가 외에 원래의 Sidebar → Header → 제목 → 요약 카드 → 안내 영역 → 2열 카드 구성을 유지합니다.

Figma의 데이터 예시는 복사하지 않았습니다. 버튼/메뉴가 실제 CRUD로 동작하는 것으로 오해하지 않도록 미구현 동작은 disabled 처리했습니다. 검색 단축키, 알림 수치, 프로필 설정은 아직 제공하지 않습니다.

## 인증 및 저장 원칙

RLS와 사용자 세션을 함께 검증할 예정입니다. 서버 호출이라는 이유만으로 권한 검사를 생략하지 않습니다. 조직 생성과 첫 관리자 가입은 한 트랜잭션으로 구현해야 하며 현재는 API 및 쓰기 권한을 열지 않았습니다.

AI 분석 결과는 UI의 검토 상태로만 전달합니다. 확인 시 서버가 schema와 조직 권한을 다시 검사하고 Task/Decision을 원자적으로 저장해야 합니다. 동일 결과의 재확인으로 중복 생성되지 않도록 후속 구현에서 멱등성을 설계합니다.

## 개발 및 배포

Node.js 24 / npm lockfile / strict TypeScript / ESLint / GitHub Actions를 공통 기준으로 합니다. Next.js build를 Vercel에서 실행하는 구조이며 Supabase 연결 및 배포는 아직 구성하지 않았습니다. 외부 폰트 서버가 빌드 가용성에 영향을 주지 않도록 Fontsource를 번들링합니다.

## 공식 참고

- [Next.js 설치](https://nextjs.org/docs/app/getting-started/installation)
- [shadcn/ui 수동 설정](https://ui.shadcn.com/docs/installation/manual)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
