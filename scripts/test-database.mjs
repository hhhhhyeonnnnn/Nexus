import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const orgTables = ["organizations", "organization_members", "projects", "tasks", "meetings", "decisions", "events", "budgets", "vendors", "files"];

before(async () => {
  // Local PostgreSQL harness only; Supabase supplies these roles and auth objects.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
  `);
  await db.exec(await readFile(new URL("../supabase/migrations/20260909000000_initial_schema.sql", import.meta.url), "utf8"));
  for (const n of [1, 2]) {
    await db.exec(`
      insert into auth.users values ('${id(n)}');
      insert into public.profiles(id, name, email) values ('${id(n)}', 'Member ${n}', 'member${n}@example.test');
      insert into public.organizations(id, name, university_name) values ('${id(n)}', 'Org ${n}', 'University');
      insert into public.organization_members values ('${id(n)}', '${id(n)}', 'MEMBER');
      insert into public.projects(id, organization_id, name) values ('${id(n)}', '${id(n)}', 'Project');
      insert into public.tasks(organization_id, project_id, assignee_id, title) values ('${id(n)}', '${id(n)}', '${id(n)}', 'Task');
      insert into public.meetings(id, organization_id, project_id, title, meeting_date) values ('${id(n)}', '${id(n)}', '${id(n)}', 'Meeting', now());
      insert into public.decisions(organization_id, project_id, meeting_id, title, content) values ('${id(n)}', '${id(n)}', '${id(n)}', 'Decision', 'Confirmed');
      insert into public.events(organization_id, project_id, title, start_at, end_at) values ('${id(n)}', '${id(n)}', 'Event', now(), now());
      insert into public.vendors(id, organization_id, name) values ('${id(n)}', '${id(n)}', 'Vendor');
      insert into public.budgets(organization_id, project_id, vendor_id, title) values ('${id(n)}', '${id(n)}', '${id(n)}', 'Budget');
      insert into public.files(organization_id, project_id, title, external_url) values ('${id(n)}', '${id(n)}', 'Document', 'https://example.test/document');
    `);
  }
});
after(async () => { await db.close(); });

test("all 11 tables have RLS enabled", async () => {
  const { rows } = await db.query("select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'");
  assert.equal(rows.length, 11);
  assert.ok(rows.every((row) => row.relrowsecurity));
});

test("each authenticated member sees only their own organization and profile", async () => {
  for (const n of [1, 2]) {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(n)}';`);
    try {
      for (const table of orgTables) {
        const { rows } = await db.query(`select * from public.${table}`);
        assert.equal(rows.length, 1, table);
        assert.equal(rows[0][table === "organizations" ? "id" : "organization_id"], id(n), table);
      }
      const { rows } = await db.query("select id from public.profiles");
      assert.deepEqual(rows, [{ id: id(n) }]);
    } finally { await db.exec("reset role"); }
  }
});

test("authenticated nonmembers cannot read organization data", async () => {
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(99)}';`);
  try {
    for (const table of orgTables) {
      const { rows } = await db.query(`select * from public.${table}`);
      assert.equal(rows.length, 0, table);
    }
  } finally { await db.exec("reset role"); }
});

test("anonymous reads and authenticated writes are denied", async () => {
  await db.exec("set role anon");
  try {
    for (const table of [...orgTables, "profiles"]) {
      await assert.rejects(db.query(`select * from public.${table}`), /permission denied/);
    }
  } finally { await db.exec("reset role"); }
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(1)}';`);
  try {
    await assert.rejects(db.exec(`insert into public.tasks(organization_id, title) values ('${id(1)}', 'Unconfirmed AI task')`), /permission denied/);
    await assert.rejects(db.exec("update public.organization_members set role = 'PRESIDENT'"), /permission denied/);
    await assert.rejects(db.exec("delete from public.projects"), /permission denied/);
  } finally { await db.exec("reset role"); }
});

test("cross-organization relationships are rejected even for privileged inserts", async () => {
  const invalidStatements = [
    `insert into public.tasks(organization_id, project_id, title) values ('${id(1)}', '${id(2)}', 'Bad project')`,
    `insert into public.tasks(organization_id, assignee_id, title) values ('${id(1)}', '${id(2)}', 'Bad assignee')`,
    `insert into public.decisions(organization_id, meeting_id, title, content) values ('${id(1)}', '${id(2)}', 'Bad meeting', 'Content')`,
    `insert into public.budgets(organization_id, vendor_id, title) values ('${id(1)}', '${id(2)}', 'Bad vendor')`,
  ];
  for (const sql of invalidStatements) await assert.rejects(db.exec(sql), /foreign key constraint/);
});

test("invalid amounts, dates and unsafe link schemes are rejected", async () => {
  for (const sql of [
    `insert into public.budgets(organization_id, title, actual_amount) values ('${id(1)}', 'Bad budget', -1)`,
    `insert into public.events(organization_id, title, start_at, end_at) values ('${id(1)}', 'Bad date', '2026-09-10', '2026-09-09')`,
    `insert into public.files(organization_id, title, external_url) values ('${id(1)}', 'Bad URL', 'javascript:alert(1)')`,
  ]) await assert.rejects(db.exec(sql), /check constraint/);
});
