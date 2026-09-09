# 0001 · 초기 개발 기반

상태: 초기 구현 / 2026-09-09

- 첨부 개발 지시문 14항에 따라 전체 MVP 대신 개발 기반과 App Shell까지만 구현한다.
- 지정 GitHub 저장소는 커밋 없는 빈 저장소였다. 사용자 승인에 따라 최초 빈 기준 커밋으로 `main`을 초기화하고, 초기 설정 코드는 `chore/initial-setup` PR을 통해 반영한다. 이후 main 직접 push 금지 원칙을 유지하며 원격 배포는 하지 않는다.
- 별도 backend 없이 Next.js App Router를 사용한다. 도메인별 features 폴더를 예약한다.
- Figma Dashboard `3:2`를 읽고 Sidebar, Header, 타입/색상/간격/카드 패턴을 따른다. 샘플 개인 정보/수치는 초기 미연결 상태로 바꾼다.
- shadcn/ui CLI alias, Tailwind 토큰, Button/Card의 로컬 소스 패턴을 준비한다.
- Supabase 초기 schema는 11개 테이블과 조직별 RLS를 포함하되 복잡한 권한 정책을 확정하지 않도록 일반 쓰기를 차단한다.
- RLS와 FK는 데이터 격리에 직접 영향을 주므로 PGlite 개발 의존성으로 SQL 회귀 검증을 추가한다. 제품 런타임에서는 사용하지 않는다.
- 배포, Auth, live Supabase client 및 OpenAI 연결은 다음 Issue의 범위다.
- ESLint 10.10.0은 현재 Next.js가 사용하는 React lint 플러그인의 `context.getFilename` 호출과 충돌했다. 초기 기준은 검증된 9.39.5이며 플러그인 호환성 확보 후 함께 갱신한다.
