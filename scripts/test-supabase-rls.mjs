import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "../src/lib/supabase/env.ts";

// Intentionally restricted to Nexus's disposable development project.
// Admin credentials are used only for temporary Auth users, never data assertions.
const projectRef = "brknzpcbabwobihxjseq";
nextEnv.loadEnvConfig(process.cwd());
const config = requireSupabaseConfig();
assert.equal(config.url, `https://${projectRef}.supabase.co`, "nexus-dev에서만 실행할 수 있습니다.");
assert.ok(process.argv.includes("--development"), "임시 사용자/데이터 생성: npm run test:db:remote -- --development");

function cli(args) {
  const result = spawnSync("supabase", [...args, "--agent", "no", "--output", "json"], {
    encoding: "utf8", timeout: 60_000, maxBuffer: 10 * 1024 * 1024,
  });
  // Do not relay CLI output: the API-key command contains admin credentials.
  assert.ok(!result.error && result.status === 0, `Supabase CLI ${args[0]} ${args[1]} 실패`);
  return result.stdout;
}
const keys = JSON.parse(cli(["projects", "api-keys", "--project-ref", projectRef]));
const adminKey = keys.find((key) => key.id === "service_role")?.api_key;
assert.ok(adminKey, "개발 프로젝트 Auth 테스트용 관리 키를 찾지 못했습니다.");
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(20_000) }) } };
const admin = createClient(config.url, adminKey, options);
const runId = randomUUID();
const directory = resolve("supabase/.temp", `rls-${runId}`);
mkdirSync(directory, { recursive: true, mode: 0o700 });
const users = [];
const rows = [{}, {}];
const organizations = [randomUUID(), randomUUID()];
function saveManifest() {
  writeFileSync(resolve(directory, "fixtures.json"), JSON.stringify({ projectRef, organizations, users, rows }, null, 2), { mode: 0o600 });
}
function query(sql) {
  const file = resolve(directory, "query.sql");
  writeFileSync(file, sql, { mode: 0o600 });
  return cli(["db", "query", "--linked", "--project-ref", projectRef, "--file", file]);
}
const tables = ["organizations", "profiles", "organization_members", "projects", "tasks", "meetings", "decisions", "events", "vendors", "budgets", "files"];
const clients = [];
let seeded = false;
saveManifest();
try {
  for (let i = 0; i < 2; i++) {
    const email = `nexus-rls-${runId}-${i}@example.test`;
    const password = randomBytes(32).toString("base64url");
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    assert.ok(!error && data.user, "임시 Auth 사용자 생성 실패");
    users.push(data.user.id);
    saveManifest();
    const client = createClient(config.url, config.key, options);
    const login = await client.auth.signInWithPassword({ email, password });
    assert.ok(!login.error && login.data.session, "실제 Auth 로그인 실패");
    const refresh = await client.auth.refreshSession();
    assert.ok(!refresh.error && refresh.data.session, "Auth 토큰 갱신 실패");
    clients.push(client);
    const org = organizations[i];
    const own = rows[i];
    own.organizations = { id: org, name: `RLS test ${runId}`, university_name: "Nexus test" };
    own.profiles = { id: users[i], name: "RLS test", email };
    own.organization_members = { organization_id: org, user_id: users[i], role: "MEMBER" };
    for (const table of tables.slice(3)) own[table] = { id: randomUUID(), organization_id: org };
    Object.assign(own.projects, { name: "RLS test" });
    for (const table of ["tasks", "meetings", "decisions", "events", "budgets", "files"]) {
      Object.assign(own[table], { title: "RLS test", project_id: own.projects.id });
    }
    own.tasks.assignee_id = users[i];
    own.meetings.meeting_date = new Date().toISOString();
    Object.assign(own.decisions, { content: "Test", meeting_id: own.meetings.id });
    Object.assign(own.events, { start_at: new Date().toISOString(), end_at: new Date(Date.now() + 60_000).toISOString() });
    own.vendors.name = "RLS test";
    own.budgets.vendor_id = own.vendors.id;
    own.files.external_url = "https://example.test/rls";
  }
  saveManifest();
  // All values are generated above; quote SQL literals even for fixture strings.
  const literal = (value) => `'${String(value).replaceAll("'", "''")}'`;
  const inserts = rows.flatMap((own) => tables.map((table) => {
    const row = own[table];
    return `insert into public.${table} (${Object.keys(row).join(",")}) values (${Object.values(row).map(literal).join(",")});`;
  }));
  // Mark before sending: clean up even if the network response is lost after commit.
  seeded = true;
  query(`begin;\n${inserts.join("\n")}\ncommit;`);
  for (let i = 0; i < clients.length; i++) {
    for (const table of tables) {
      const column = table === "organization_members" ? "organization_id" : "id";
      const own = rows[i][table];
      const other = rows[1 - i][table];
      const read = await clients[i].from(table).select("*").in(column, [own[column], other[column]]);
      assert.ok(!read.error, `${table}: 인증된 조회 실패`);
      assert.equal(read.data.length, 1, `${table}: 조직/개인 정보 격리 실패`);
      assert.equal(read.data[0][column], own[column], `${table}: 타 조직 데이터 노출`);
      const insert = await clients[i].from(table).insert(own);
      assert.equal(insert.error?.code, "42501", `${table}: INSERT 차단 실패`);
      const update = await clients[i].from(table).update({ [column]: own[column] }).eq(column, own[column]);
      assert.equal(update.error?.code, "42501", `${table}: UPDATE 차단 실패`);
      const deletion = await clients[i].from(table).delete().eq(column, own[column]);
      assert.equal(deletion.error?.code, "42501", `${table}: DELETE 차단 실패`);
    }
  }
  console.log("PASS 실제 Auth 로그인·토큰 갱신 (2명)");
  console.log("PASS 11개 테이블 조직/프로필 격리 및 INSERT/UPDATE/DELETE 차단 (양방향)");
} finally {
  // Exact fixture IDs only. Retain a recovery manifest if cleanup fails.
  if (seeded) {
    const cleanupOrder = ["files", "budgets", "decisions", "events", "tasks", "meetings", "vendors", "projects", "organization_members", "profiles", "organizations"];
    const statements = cleanupOrder.map((table) => {
      const column = table === "organization_members" ? "organization_id" : "id";
      const ids = rows.map((own) => own[table][column]);
      assert.ok(ids.every((id) => /^[0-9a-f-]{36}$/.test(id)), "정리 대상 ID 검증 실패");
      return `delete from public.${table} where ${column} in (${ids.map((id) => `'${id}'`).join(",")});`;
    });
    query(`begin;\n${statements.join("\n")}\ncommit;`);
  }
  for (const id of users) {
    const { error } = await admin.auth.admin.deleteUser(id);
    assert.ok(!error, `임시 사용자 정리 실패. 복구 정보: ${directory}/fixtures.json`);
  }
  rmSync(directory, { recursive: true });
  console.log("PASS 임시 사용자 및 데이터 정리 완료");
}
