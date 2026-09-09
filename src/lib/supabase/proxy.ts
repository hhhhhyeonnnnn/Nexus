import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

// ---------------------------------------------------------------------------
// Route protection rules
// ---------------------------------------------------------------------------
//
// | Path            | Unauthenticated | Authenticated (no org) | Authenticated (has org) |
// |-----------------|-----------------|------------------------|-------------------------|
// | /login          | allow           | → /onboarding          | → /dashboard            |
// | /dashboard/**   | → /login        | → /onboarding          | allow                   |
// | /onboarding/**  | → /login        | allow                  | → /dashboard            |
// | /admin/**       | → /login        | → /login               | allow (admin check done in page) |
// | /auth/**        | allow           | allow                  | allow                   |
//
// ---------------------------------------------------------------------------

const AUTH_PATHS = ["/login", "/forgot-password", "/reset-password"];
const PROTECTED_PATHS = ["/dashboard", "/onboarding", "/admin"];

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = getSupabaseConfig();
  // Unconfigured contributors can still run the public app shell.
  if (!config) return response;

  const supabase = createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const previousCookies = response.cookies.getAll();
        const previousHeaders = new Headers(response.headers);
        response = NextResponse.next({ request });
        previousCookies.forEach((cookie) => response.cookies.set(cookie));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Preserve the SDK's no-store headers across multiple cookie writes.
        for (const name of ["cache-control", "expires", "pragma"]) {
          const value = previousHeaders.get(name);
          if (value) response.headers.set(name, value);
        }
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  // Refresh session (required before reading user)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // /auth/** is always public (OAuth callback, magic link)
  if (pathname.startsWith("/auth/")) return response;

  if (!user) {
    // Unauthenticated: redirect protected paths to /login
    if (isProtectedPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Authenticated: check org membership for redirect decisions
  // Use a lightweight query — only the first row matters.
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const hasOrg = !!membership;

  if (isAuthPath(pathname)) {
    // Already logged in — redirect away from auth pages
    const url = request.nextUrl.clone();
    url.pathname = hasOrg ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!hasOrg) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/onboarding")) {
    if (hasOrg) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
