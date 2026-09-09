import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/projects",
    "/tasks/:path*",
    "/tasks",
    "/calendar/:path*",
    "/calendar",
    "/finance/:path*",
    "/finance",
    "/vendors/:path*",
    "/vendors",
    "/members/:path*",
    "/members",
    "/auth/:path*",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/onboarding/:path*",
    "/onboarding",
    "/admin/:path*",
    "/admin",
  ],
};
