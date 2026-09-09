import type { NextConfig } from "next";
import { getSupabaseConfig } from "./src/lib/supabase/env";

// Fail before bundling if a server secret was placed in a public variable.
getSupabaseConfig();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
