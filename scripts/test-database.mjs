import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const tenantTables = ["organization_members", "projects", "tasks", "meetings", "decisions", "events", "budgets", "vendors", "files"];
const allTables = ["organizations", ...tenantTables, "profiles", "organization_creation_requests", "organization_join_requests"];

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
  await db.exec(await readFile(new URL("../supabase/migrations/20260909100000_auth_write_policies.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../supabase/migrations/20260909200000_org_onboarding.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../supabase/migrations/20260909300000_projects_write_policies.sql", import.meta.url), "utf8"));

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

  // Set user 1 as site admin for testing admin workflows
  await db.exec(`update public.profiles set is_site_admin = true where id = '${id(1)}'`);
});

after(async () => { await db.close(); });

test("all 13 tables have RLS enabled", async () => {
  const { rows } = await db.query("select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'");
  assert.equal(rows.length, 13);
  assert.ok(rows.every((row) => row.relrowsecurity));
});

test("each authenticated member sees only their own tenant data and profile, but can browse org directory", async () => {
  for (const n of [1, 2]) {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(n)}';`);
    try {
      for (const table of tenantTables) {
        const { rows } = await db.query(`select * from public.${table}`);
        assert.equal(rows.length, 1, table);
        assert.equal(rows[0]["organization_id"], id(n), table);
      }
      // Organizations can be browsed by all authenticated users to request join
      const { rows: orgRows } = await db.query("select * from public.organizations");
      assert.equal(orgRows.length, 2);

      const { rows } = await db.query("select id from public.profiles");
      assert.deepEqual(rows, [{ id: id(n) }]);
    } finally { await db.exec("reset role"); }
  }
});

test("authenticated nonmembers cannot read tenant data", async () => {
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(99)}';`);
  try {
    for (const table of tenantTables) {
      const { rows } = await db.query(`select * from public.${table}`);
      assert.equal(rows.length, 0, table);
    }
  } finally { await db.exec("reset role"); }
});

test("anonymous reads are denied for all tables", async () => {
  await db.exec("set role anon");
  try {
    for (const table of allTables) {
      await assert.rejects(db.query(`select * from public.${table}`), /permission denied/);
    }
  } finally { await db.exec("reset role"); }
});

test("non-admin member cannot promote self or insert direct tasks", async () => {
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(2)}';`);
  try {
    await assert.rejects(db.exec(`insert into public.tasks(organization_id, title) values ('${id(2)}', 'Unconfirmed AI task')`), /permission denied/);
    // User 2 (MEMBER) cannot delete projects (blocked by RLS, 0 rows deleted)
    const { rowCount: deletedProjects } = await db.query("delete from public.projects");
    assert.equal(deletedProjects, 0);
    // Tables without delete grant are rejected with permission denied
    await assert.rejects(db.exec("delete from public.meetings"), /permission denied/);
  } finally { await db.exec("reset role"); }
});

test("site admin can create org while regular user is denied", async () => {
  // Non-site-admin (user 2) cannot insert organizations
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(2)}';`);
  try {
    await assert.rejects(
      db.exec(`insert into public.organizations(name, university_name) values ('Illegal Org', 'Univ')`),
      /row-level security policy/,
    );
  } finally { await db.exec("reset role"); }

  // Site admin (user 1) can insert organizations
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(1)}';`);
  try {
    await db.exec(`insert into public.organizations(id, name, university_name) values ('${id(10)}', 'Approved Org', 'Univ')`);
    const { rows } = await db.query(`select name from public.organizations where id = '${id(10)}'`);
    assert.equal(rows[0].name, "Approved Org");
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

test("organization member can create and update projects in own org but not other orgs", async () => {
  // Member 2 creates project in Org 2 -> SUCCESS
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(2)}';`);
  try {
    await db.exec(`insert into public.projects(id, organization_id, name, description) values ('${id(20)}', '${id(2)}', 'Festival', 'Annual Festival')`);
    const { rows } = await db.query(`select name from public.projects where id = '${id(20)}'`);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, "Festival");

    // Member 2 tries to insert project into Org 1 -> REJECTED
    await assert.rejects(
      db.exec(`insert into public.projects(id, organization_id, name) values ('${id(21)}', '${id(1)}', 'Cross-org Project')`),
      /row-level security policy/,
    );

    // Member 2 updates own project -> SUCCESS
    await db.exec(`update public.projects set status = 'IN_PROGRESS' where id = '${id(20)}'`);
    const { rows: updatedRows } = await db.query(`select status from public.projects where id = '${id(20)}'`);
    assert.equal(updatedRows[0].status, "IN_PROGRESS");

    // Member 2 (regular MEMBER) tries to delete project -> REJECTED (only ADMIN+ can delete)
    const { rowCount } = await db.query(`delete from public.projects where id = '${id(20)}'`);
    assert.equal(rowCount, 0);
  } finally { await db.exec("reset role"); }
});

