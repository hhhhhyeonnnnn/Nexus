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
  await db.exec(await readFile(new URL("../supabase/migrations/20260909400000_tasks_write_policies.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../supabase/migrations/20260909500000_profiles_shared_read_policies.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../supabase/migrations/20260909600000_calendar_vendors_finance.sql", import.meta.url), "utf8"));

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

test("non-admin member cannot write unpermitted tables like meetings", async () => {
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(2)}';`);
  try {
    await assert.rejects(db.exec(`insert into public.meetings(organization_id, title, meeting_date) values ('${id(2)}', 'Unpermitted meeting', now())`), /permission denied/);
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
  await db.exec(`update public.profiles set is_site_admin = true where id = '${id(1)}'`);
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(1)}';`);
  try {
    await db.exec(`insert into public.organizations(id, name, university_name) values ('${id(10)}', 'Approved Org', 'Univ')`);
    const { rows } = await db.query(`select name from public.organizations where id = '${id(10)}'`);
    assert.equal(rows[0].name, "Approved Org");
  } finally {
    await db.exec("reset role");
    await db.exec(`update public.profiles set is_site_admin = false where id = '${id(1)}'`);
  }
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

test("organization member can create, update, and delete tasks within own org only", async () => {
  // Member 2 creates task in Org 2 -> SUCCESS
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(2)}';`);
  try {
    await db.exec(`
      insert into public.tasks(id, organization_id, project_id, assignee_id, title, status)
      values ('${id(30)}', '${id(2)}', '${id(2)}', '${id(2)}', 'Stage Setup', 'TODO')
    `);
    const { rows } = await db.query(`select title, status from public.tasks where id = '${id(30)}'`);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].title, "Stage Setup");

    // Member 2 tries to insert task in Org 1 -> REJECTED
    await assert.rejects(
      db.exec(`insert into public.tasks(organization_id, title) values ('${id(1)}', 'Cross-org Task')`),
      /row-level security policy/,
    );

    // Member 2 updates status of own task -> SUCCESS
    await db.exec(`update public.tasks set status = 'DONE' where id = '${id(30)}'`);
    const { rows: updatedRows } = await db.query(`select status from public.tasks where id = '${id(30)}'`);
    assert.equal(updatedRows[0].status, "DONE");

    // Member 2 deletes own task (as assignee) -> SUCCESS
    const { rowCount: deletedRows } = await db.query(`delete from public.tasks where id = '${id(30)}'`);
    assert.equal(deletedRows, 1);

    // Member 2 tries to delete task belonging to Member 1 in Org 1 -> 0 rows deleted
    const { rowCount: crossDelete } = await db.query(`delete from public.tasks where id = '${id(1)}'`);
    assert.equal(crossDelete, 0);
  } finally { await db.exec("reset role"); }
});

test("members of the same organization can view each other's profiles, but not members of other organizations", async () => {
  // Add User 3 to Org 1
  await db.exec(`
    insert into auth.users values ('${id(3)}');
    insert into public.profiles(id, name, email) values ('${id(3)}', 'Member 3', 'member3@example.test');
    insert into public.organization_members values ('${id(1)}', '${id(3)}', 'MEMBER');
  `);

  // User 3 (in Org 1) queries profiles: should see User 1 and User 3 (both in Org 1), but NOT User 2 (in Org 2)
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(3)}';`);
  try {
    const { rows } = await db.query("select id, name, email from public.profiles order by name");
    const ids = rows.map((r) => r.id).sort();
    assert.deepEqual(ids, [id(1), id(3)].sort());
  } finally { await db.exec("reset role"); }

  // User 2 (in Org 2) queries profiles: should see only User 2
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(2)}';`);
  try {
    const { rows } = await db.query("select id, name, email from public.profiles");
    assert.deepEqual(rows.map((r) => r.id), [id(2)]);
  } finally { await db.exec("reset role"); }
});

test("organization admin can view profiles of applicants who requested to join their organization", async () => {
  // User 4 is an applicant who submitted a join request to Org 1
  await db.exec(`
    insert into auth.users values ('${id(4)}');
    insert into public.profiles(id, name, email) values ('${id(4)}', 'Applicant 4', 'applicant4@example.test');
    insert into public.organization_join_requests(organization_id, requester_id, message, status)
    values ('${id(1)}', '${id(4)}', 'Please accept me', 'pending');
  `);

  // Set User 1 as PRESIDENT of Org 1
  await db.exec(`update public.organization_members set role = 'PRESIDENT' where organization_id = '${id(1)}' and user_id = '${id(1)}'`);

  // User 1 (Admin of Org 1) queries profiles: should see User 1, User 3 (co-members) AND User 4 (applicant to Org 1)
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(1)}';`);
  try {
    const { rows } = await db.query("select id from public.profiles");
    const ids = rows.map((r) => r.id);
    assert.ok(ids.includes(id(4)), "Org admin should be able to view applicant profile");
    assert.ok(!ids.includes(id(2)), "Org admin should not view members of unrelated orgs without site-admin");
  } finally { await db.exec("reset role"); }

  // User 2 (in Org 2) queries profiles: should NOT see User 4
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(2)}';`);
  try {
    const { rows } = await db.query("select id from public.profiles");
    const ids = rows.map((r) => r.id);
    assert.ok(!ids.includes(id(4)), "Unrelated org member should NOT view applicant profile");
  } finally { await db.exec("reset role"); }

  // User 3 (regular MEMBER of Org 1, not admin) queries profiles: should NOT see User 4
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(3)}';`);
  try {
    const { rows } = await db.query("select id from public.profiles");
    const ids = rows.map((r) => r.id);
    assert.ok(!ids.includes(id(4)), "Regular member (non-admin) should NOT view applicant profile");
  } finally { await db.exec("reset role"); }
});

test("site admin can view all profiles", async () => {
  await db.exec(`update public.profiles set is_site_admin = true where id = '${id(1)}'`);
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(1)}';`);
  try {
    const { rows } = await db.query("select id from public.profiles");
    const ids = rows.map((r) => r.id);
    // Should see users 1, 2, 3, 4
    assert.ok(ids.includes(id(1)));
    assert.ok(ids.includes(id(2)));
    assert.ok(ids.includes(id(3)));
    assert.ok(ids.includes(id(4)));
  } finally {
    await db.exec("reset role");
    await db.exec(`update public.profiles set is_site_admin = false where id = '${id(1)}'`);
  }
});

test("organization member can create, update, and delete events within own org only", async () => {
  // Member 2 creates event in Org 2 -> SUCCESS
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(2)}';`);
  try {
    await db.exec(`
      insert into public.events(id, organization_id, title, start_at, end_at)
      values ('${id(40)}', '${id(2)}', 'Autumn Festival', '2026-10-01 10:00:00+09', '2026-10-02 20:00:00+09')
    `);
    const { rows } = await db.query(`select title from public.events where id = '${id(40)}'`);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].title, "Autumn Festival");

    // Member 2 tries to insert event in Org 1 -> REJECTED
    await assert.rejects(
      db.exec(`insert into public.events(organization_id, title, start_at, end_at) values ('${id(1)}', 'Cross-org Event', now(), now())`),
      /row-level security policy/,
    );

    // Member 2 updates own event -> SUCCESS
    await db.exec(`update public.events set title = 'Festival Day 1' where id = '${id(40)}'`);
    const { rows: updatedRows } = await db.query(`select title from public.events where id = '${id(40)}'`);
    assert.equal(updatedRows[0].title, "Festival Day 1");

    // Member 2 deletes own event -> SUCCESS
    const { rowCount: deleted } = await db.query(`delete from public.events where id = '${id(40)}'`);
    assert.equal(deleted, 1);
  } finally { await db.exec("reset role"); }
});

test("organization member can create and update vendors, but only admin can delete", async () => {
  // Member 2 creates vendor in Org 2 -> SUCCESS
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(2)}';`);
  try {
    await db.exec(`
      insert into public.vendors(id, organization_id, name, category, phone, rating)
      values ('${id(50)}', '${id(2)}', 'Hanbit Print', '인쇄/홍보', '010-1234-5678', 5)
    `);
    const { rows } = await db.query(`select name from public.vendors where id = '${id(50)}'`);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, "Hanbit Print");

    // Member 2 (regular MEMBER) tries to delete vendor -> REJECTED (0 rows deleted)
    const { rowCount } = await db.query(`delete from public.vendors where id = '${id(50)}'`);
    assert.equal(rowCount, 0);

    // Promote Member 2 to ADMIN of Org 2
    await db.exec("reset role");
    await db.exec(`update public.organization_members set role = 'ADMIN' where organization_id = '${id(2)}' and user_id = '${id(2)}'`);
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(2)}';`);

    // Admin Member 2 deletes vendor -> SUCCESS
    const { rowCount: adminDeleted } = await db.query(`delete from public.vendors where id = '${id(50)}'`);
    assert.equal(adminDeleted, 1);
  } finally {
    await db.exec("reset role");
    await db.exec(`update public.organization_members set role = 'MEMBER' where organization_id = '${id(2)}' and user_id = '${id(2)}'`);
  }
});

test("organization member can create and update budgets/ledger, but only admin can delete", async () => {
  // Member 2 creates budget/ledger in Org 2 -> SUCCESS
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(2)}';`);
  try {
    await db.exec(`
      insert into public.budgets(id, organization_id, title, category, type, actual_amount, transaction_date)
      values ('${id(60)}', '${id(2)}', 'Snack Expense', '복지비', 'EXPENSE', 150000, '2026-09-10')
    `);
    const { rows } = await db.query(`select title, type, actual_amount from public.budgets where id = '${id(60)}'`);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].title, "Snack Expense");
    assert.equal(rows[0].type, "EXPENSE");
    assert.equal(Number(rows[0].actual_amount), 150000);

    // Member 2 (regular MEMBER) tries to delete budget -> REJECTED (0 rows deleted)
    const { rowCount } = await db.query(`delete from public.budgets where id = '${id(60)}'`);
    assert.equal(rowCount, 0);

    // Promote Member 2 to ADMIN of Org 2
    await db.exec("reset role");
    await db.exec(`update public.organization_members set role = 'ADMIN' where organization_id = '${id(2)}' and user_id = '${id(2)}'`);
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${id(2)}';`);

    // Admin Member 2 deletes budget -> SUCCESS
    const { rowCount: adminDeleted } = await db.query(`delete from public.budgets where id = '${id(60)}'`);
    assert.equal(adminDeleted, 1);
  } finally {
    await db.exec("reset role");
    await db.exec(`update public.organization_members set role = 'MEMBER' where organization_id = '${id(2)}' and user_id = '${id(2)}'`);
  }
});


