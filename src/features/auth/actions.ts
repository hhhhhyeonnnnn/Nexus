"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Email / Password
// ---------------------------------------------------------------------------

export async function loginWithEmail(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "이메일과 비밀번호를 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  await ensureProfile();
  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Social login — redirects to provider (OAuth flow)
// ---------------------------------------------------------------------------

export async function loginWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  });
  if (error || !data.url) return;
  redirect(data.url);
}

export async function loginWithKakao(): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  });
  if (error || !data.url) return;
  redirect(data.url);
}

export async function loginWithNaver(): Promise<void> {
  // Naver is configured as a Custom OAuth provider in Supabase Dashboard
  // with identifier "custom:naver". Falls back gracefully if not configured.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "custom:naver",
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  });
  if (error || !data.url) return;
  redirect(data.url);
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function forgotPassword(
  _prevState: { error: string | null; success: boolean },
  formData: FormData,
): Promise<{ error: string | null; success: boolean }> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email) {
    return { error: "이메일을 입력해 주세요.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: "비밀번호 재설정 이메일 발송에 실패했습니다.", success: false };
  }
  return { error: null, success: true };
}

export async function resetPassword(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const password = formData.get("password");
  if (typeof password !== "string" || password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "비밀번호 변경에 실패했습니다. 링크가 만료됐을 수 있습니다." };
  }
  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Profile bootstrap (idempotent — safe to call after every login)
// ---------------------------------------------------------------------------

export async function ensureProfile(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Check whether the profile already exists (self-only SELECT policy allows this)
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return;

  // Derive display name from provider metadata, fallback to email local part
  const meta = user.user_metadata as Record<string, unknown>;
  const name =
    typeof meta.full_name === "string" && meta.full_name.trim()
      ? meta.full_name.trim()
      : typeof meta.name === "string" && meta.name.trim()
        ? meta.name.trim()
        : (user.email?.split("@")[0] ?? "사용자");

  const email = user.email ?? "";

  await supabase.from("profiles").insert({ id: user.id, name, email });
}
