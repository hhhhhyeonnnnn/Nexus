import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ensureProfile } from "@/features/auth/actions";
import { requireSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Resolve external origin for reverse proxies (e.g. Vercel)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isLocal = process.env.NODE_ENV === "development";
  const redirectOrigin = isLocal
    ? origin
    : forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : origin;

  if (code) {
    const { url, key } = requireSupabaseConfig();
    const cookieStore = await cookies();
    const cookiesToSet: Array<{
      name: string;
      value: string;
      options?: Parameters<typeof cookieStore.set>[2];
    }> = [];

    const supabase = createServerClient<Database>(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach((cookie) => {
            cookiesToSet.push(cookie);
            try {
              cookieStore.set(cookie.name, cookie.value, cookie.options);
            } catch {
              // Ignore in contexts where cookieStore cannot write
            }
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Bootstrap profile on first social login using authenticated client
      await ensureProfile(supabase);

      // Check if user belongs to any organization
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let destination = "/onboarding";
      if (user) {
        const { data: membership } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        destination = membership ? next : "/onboarding";
      }

      const redirectUrl = new URL(destination, redirectOrigin);
      const response = NextResponse.redirect(redirectUrl);

      // Explicitly set session cookies on the redirect response so browser receives Set-Cookie
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });

      return response;
    }

    // Code exchange failed — redirect with specific error message
    const errorUrl = new URL("/login", redirectOrigin);
    errorUrl.searchParams.set("error", error.message || "auth_callback_failed");
    return NextResponse.redirect(errorUrl);
  }

  // Missing code in callback URL
  const errorUrl = new URL("/login", redirectOrigin);
  errorUrl.searchParams.set("error", "no_code");
  return NextResponse.redirect(errorUrl);
}
