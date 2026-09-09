import nextEnv from "@next/env";
import { getSupabaseConfig } from "../src/lib/supabase/env.ts";

nextEnv.loadEnvConfig(process.cwd());
const config = getSupabaseConfig();
if (!config) throw new Error("Supabase 환경변수를 .env.local에 설정하세요.");

const headers = { apikey: config.key };
const health = await fetch(`${config.url}/auth/v1/health`, {
  headers,
  signal: AbortSignal.timeout(15_000),
});
if (!health.ok) throw new Error(`Auth 연결 실패 (HTTP ${health.status}). URL과 공개 키를 확인하세요.`);
console.log("PASS Supabase Auth 연결");

// The current migration intentionally denies all anonymous table reads.
// This read-only check never creates users, writes fixtures, or runs migrations.
for (const table of ["organizations", "profiles", "organization_members", "projects", "tasks", "meetings", "decisions", "events", "budgets", "vendors", "files"]) {
  const result = await fetch(`${config.url}/rest/v1/${table}?select=*&limit=0`, {
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  const body = await result.json();
  if (![401, 403].includes(result.status) || body.code !== "42501") {
    throw new Error(`${table}: 기대한 익명 접근 차단을 확인하지 못했습니다 (HTTP ${result.status}).`);
  }
}
console.log("PASS 11개 테이블 익명 조회 차단");
console.log("이 검사는 읽기 전용입니다. 인증된 조직별 RLS 검증은 별도로 실행하세요.");
