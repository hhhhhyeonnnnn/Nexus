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
const ORG_PATHS = ["/dashboard", "/projects", "/tasks", "/calendar", "/finance", "/vendors", "/members"];
const PROTECTED_PATHS = [...ORG_PATHS, "/onboarding", "/admin"];

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isOrgPath(pathname: string) {
  return ORG_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
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

  function redirectWithCookies(url: URL | string): NextResponse {
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  // /auth/** is always public (OAuth callback, magic link)
  if (pathname.startsWith("/auth/")) return response;

  if (!user) {
    // Unauthenticated: redirect protected paths to /login
    if (isProtectedPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return redirectWithCookies(url);
    }
    return response;
  }

  // Authenticated: check org membership for redirect decisions.
  // When navigating within org pages (/dashboard, /projects, etc.), leverage
  // the lightweight 'nexus-has-org' cookie flag to bypass repeated DB SELECTs.
  const isBypassed = pathname.startsWith("/onboarding") || pathname.startsWith("/auth");
  const orgCookie = isBypassed ? undefined : request.cookies.get("nexus-has-org")?.value;
  let hasOrg: boolean;

  if (orgCookie === "1") {
    hasOrg = true;
  } else if (orgCookie === "0") {
    hasOrg = false;
  } else {
    // Cookie not present or onboarding bypass: query database
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    hasOrg = !!membership;
    response.cookies.set("nexus-has-org", hasOrg ? "1" : "0", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  if (isAuthPath(pathname)) {
    // Already logged in — redirect away from auth pages
    const url = request.nextUrl.clone();
    url.pathname = hasOrg ? "/dashboard" : "/onboarding";
    return redirectWithCookies(url);
  }

  if (isOrgPath(pathname)) {
    if (!hasOrg) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return redirectWithCookies(url);
    }
  }

  if (pathname.startsWith("/onboarding")) {
    if (hasOrg) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return redirectWithCookies(url);
    }
  }

  return response;
}
