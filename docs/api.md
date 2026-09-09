# API 및 AI 경계

## 현재 구현

- `GET /`: `/dashboard` redirect.
- `GET /dashboard`: 공개 App Shell. Supabase 설정 시 Proxy가 세션을 갱신하지만 로그인 강제와 데이터 조회는 아직 없습니다.
- 정의되지 않은 경로: 공통 404.

외부 공개 API, Server Actions, 로그인 callback은 아직 없습니다. `src/app/api`는 후속 라우트를 위한 빈 폴더입니다.

## 후속 도메인 API 원칙

Next.js Server Actions 또는 Route Handlers에서 세션, 조직 membership, 입력 schema, 동일 조직의 참조 ID를 검증합니다. 사용자 범위 Supabase client를 사용하고 RLS를 유지합니다. 인증 실패/권한 없음/검증 오류/찾을 수 없음은 구분하며 내부 오류나 키를 응답에 노출하지 않습니다.

조직 생성과 첫 관리자 등록은 원자적으로 처리해야 합니다. CRUD 경로와 입력/출력 스키마는 각각의 Issue에서 확정하며 실제 구현과 동시에 이 문서에 추가합니다.

## AI 분석 → 확인 → 저장

1. 인증 및 해당 회의의 조직 권한 검증.
2. 서버에서 OpenAI structured output 요청 (아직 미연결).
3. JSON schema 검증. 모르는 담당자, 마감일, 이유는 null/미정 유지.
4. 요약, Task 제안, Decision 제안, 미결정 사항을 검토 UI에 전달.
5. 사용자가 수정하고 **확인 및 반영**을 누른 뒤에만 저장 요청.
6. 서버에서 schema/권한/원본 회의를 재검증하고 트랜잭션 및 중복 방지로 저장.

분석 요청 자체는 Task/Decision을 생성하지 않습니다. 모델은 사용자 메시지나 회의록 속 명령을 실행하지 않으며, 회의록은 분석할 데이터로 취급합니다. 서버 API 키, 타 조직 데이터 및 불필요한 개인정보를 모델 입력에 포함하지 않습니다.
