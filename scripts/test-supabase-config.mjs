import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSupabaseConfig } from "../src/lib/supabase/env.ts";

const publicKey = "sb_publishable_test_only_not_a_real_key";
const jwt = (role) => `header.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.signature`;

test("empty setup is optional, partial setup fails explicitly", () => {
  assert.equal(parseSupabaseConfig({}), null);
  assert.throws(() => parseSupabaseConfig({ url: "https://example.supabase.co" }));
  assert.throws(() => parseSupabaseConfig({ publishableKey: publicKey }));
});

test("publishable keys take precedence and legacy anon keys remain supported", () => {
  const url = "https://example.supabase.co";
  assert.deepEqual(parseSupabaseConfig({ url: `${url}/`, publishableKey: publicKey, anonKey: jwt("anon") }), { url, key: publicKey });
  assert.equal(parseSupabaseConfig({ url, anonKey: jwt("anon") }).key, jwt("anon"));
});

test("secret and service-role keys are rejected without echoing their value", () => {
  for (const key of ["sb_secret_never_expose", jwt("service_role"), jwt("authenticated"), "invalid"]) {
    assert.throws(() => parseSupabaseConfig({ url: "https://example.supabase.co", publishableKey: key }), (error) => {
      assert.ok(!error.message.includes(key));
      return true;
    });
    assert.throws(() => parseSupabaseConfig({ url: "https://example.supabase.co", publishableKey: publicKey, anonKey: key }));
  }
});

test("URLs cannot contain credentials, paths or insecure remote origins", () => {
  for (const url of ["invalid", "http://example.com", "https://user:password@example.com", "https://example.com/rest/v1", "https://example.com?token=secret", "https://example.com#secret"]) {
    assert.throws(() => parseSupabaseConfig({ url, publishableKey: publicKey }));
  }
  for (const url of ["http://127.0.0.1:54321", "http://localhost:54321", "http://[::1]:54321"]) {
    assert.equal(parseSupabaseConfig({ url, publishableKey: publicKey }).url, url);
  }
});
