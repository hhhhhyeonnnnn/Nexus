# Database · 초기 Migration

파일: `supabase/migrations/20260909000000_initial_schema.sql`

**`nexus-dev` 개발 DB에 적용 완료.** Supabase가 제공하는 `auth.users`, `auth.uid()`, `anon`, `authenticated`를 전제로 합니다. 조직별 SELECT만 허용하며 모든 일반 클라이언트 INSERT/UPDATE/DELETE는 닫혀 있습니다. 이 문서는 서비스의 CRUD 완성을 의미하지 않습니다.

## 테이블

| 테이블 | 역할 / 주요 관계 |
| --- | --- |
| organizations | 이름, 대학, 생성일 |
| profiles | auth.users와 1:1, 이름/이메일. 현재 본인만 조회 |
| organization_members | 조직 + 사용자 복합 PK, 조직 역할 |
| projects | 조직, 상태, 기간 |
| tasks | 조직, 선택 프로젝트, 선택 담당자, 상태, 마감일 |
| meetings | 조직, 선택 프로젝트, 회의록, 회의 일시 |
| decisions | 조직, 선택 프로젝트/회의, 결정 내용, 선택 이유, 결정 일시 |
| events | 조직, 선택 프로젝트, 시작/종료 일시 (Phase 2) |
| budgets | 조직, 선택 프로젝트/업체, 계획/실제 금액 (Phase 2) |
| vendors | 조직별 업체 연락처, 평가, 메모 (Phase 2) |
| files | 조직, 선택 프로젝트, HTTPS 외부 문서 URL (Phase 3) |

전체 11개 테이블입니다. UUID PK는 `gen_random_uuid()`를 사용합니다. 프로젝트에 속하지 않은 조직 업무도 허용하도록 `project_id`는 nullable입니다. 회의/결정 같은 조직 기록은 일반 삭제 시 참조 무결성이 유지되도록 FK의 기본 NO ACTION을 사용합니다. 조직/구성원 삭제·탈퇴·보존 정책은 Auth/조직 Issue에서 별도 결정합니다.

## 타입과 제약

- 역할: `PRESIDENT | VICE_PRESIDENT | ADMIN | MEMBER`.
- 프로젝트: `PLANNED | IN_PROGRESS | COMPLETED | ARCHIVED`.
- 업무: `TODO | IN_PROGRESS | REVIEW | DONE`.
- 프로젝트 기간과 업무 마감은 `date`; 실제 회의/이벤트/생성 시간은 `timestamptz`.
- 예산은 KRW 정수 `numeric(14,0)` 및 0 이상. 환불/음수 조정은 후속 재정 정책에서 결정합니다.
- 업체 평가는 미평가 null 또는 1~5.
- 링크는 HTTPS만 저장하며 렌더링할 때 URL parser 검증도 추가해야 합니다.
- `(organization_id, project_id)`, `(organization_id, meeting_id)`, `(organization_id, vendor_id)` 복합 FK로 타 조직 연결을 차단합니다.
- 담당자는 `(organization_id, assignee_id)`로 해당 조직의 membership에 연결합니다.
- 프로젝트와 회의가 **동일 조직**인지는 DB가 보장합니다. Decision의 프로젝트가 원본 회의 프로젝트와 같은지 여부는 후속 도메인 정책에서 검증해야 합니다.
- FK 조회 및 RLS/마감일 조회를 위한 복합 인덱스를 포함합니다.

## RLS

모든 테이블에서 RLS를 활성화합니다. 인증 사용자는 자신의 membership이 있는 조직 데이터만 읽습니다. profiles는 개인 이메일 노출을 막기 위해 본인만 읽습니다. 공개 구성원 이름 조회가 필요하면 별도 최소 필드 인터페이스를 설계합니다.

`private.is_organization_member(uuid)`는 membership 조회에서 재귀 RLS를 피하는 작은 `SECURITY DEFINER` 함수입니다. 빈 search_path와 스키마 명시를 사용하며 PUBLIC/anon의 실행 권한을 회수합니다. `private`는 Data API 노출 스키마에 추가하지 않습니다.

조직 생성, 최초 관리자 등록, 구성원 초대/탈퇴, 역할 변경, 도메인 쓰기 정책은 미구현입니다. 임의 가입이나 자기 역할 상승을 허용하지 않기 위해 일반 클라이언트에 쓰기 grant/policy를 추가하지 않았습니다. 초기 데이터는 로컬 fixture 또는 신뢰된 관리자 작업으로만 넣습니다.

## 검증 / 적용 절차

```sh
npm run test:db
```

PGlite의 실제 PostgreSQL 엔진에서 초안을 실행하고 2개 조직 fixture로 RLS, 익명 차단, 비회원 차단, 쓰기 차단, 교차 조직 FK, 금액/날짜/URL 제약을 검사합니다. auth 함수는 테스트용 대체 구현이며 Supabase Auth 통합·PostgREST·세션 동작은 검증하지 않습니다.

개발 DB(PostgreSQL 17.6)에 migration을 적용하고 11개 테이블의 RLS와 migration 이력을 확인했습니다. 실제 Auth JWT로 조직별 조회 및 쓰기 차단을 검증하는 `npm run test:db:remote -- --development`는 임시 사용자/데이터를 생성하고 정리합니다. Docker 기반 로컬 Supabase 실행은 별도 런타임이 필요하며 이 Mac에서는 검증하지 않았습니다.

DB 타입은 `src/types/database.ts`에 생성하며 browser/server client를 분리합니다. 재현 명령과 개발 프로젝트 정보는 [Supabase 연결 문서](supabase.md)에 정리합니다.

데이터 삭제를 수반하는 `db reset`은 기본 실행 절차에 포함하지 않습니다. 이미 적용한 migration은 수정하지 않고 새 migration을 추가합니다.

## 후속 스키마 범위

예산 증빙/메모, 업체 견적 이력, 문서의 Task/Meeting/Vendor 연결, 회의 분석 상태와 확인 이력, 인수인계 스냅샷은 요청된 초기 필드 밖이므로 아직 추가하지 않았습니다.
