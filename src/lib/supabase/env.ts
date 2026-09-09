export type SupabasePublicConfig = { url: string; key: string };

type PublicEnvironment = {
  url?: string;
  publishableKey?: string;
  anonKey?: string;
};

/** Only public credentials belong here. Never read server secrets in this module. */
export function parseSupabaseConfig(env: PublicEnvironment): SupabasePublicConfig | null {
  const url = env.url?.trim();
  const key = env.publishableKey?.trim() || env.anonKey?.trim();
  if (!url && !key) return null;
  if (!url || !key) {
    throw new Error("Supabase URL과 공개 API 키를 함께 설정하세요. .env.example을 확인하세요.");
  }

  let parsed: URL;
  try { parsed = new URL(url); } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL이 올바른 URL이 아닙니다.");
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if ((parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) ||
    parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") {
    throw new Error("Supabase URL에는 프로젝트의 HTTPS origin 또는 로컬 HTTP origin만 사용하세요.");
  }

  // Both public variables are inlined by Next.js, including an unused fallback.
  for (const publicKey of [env.publishableKey?.trim(), env.anonKey?.trim()]) {
    if (!publicKey || /^sb_publishable_[A-Za-z0-9_-]+$/.test(publicKey)) continue;
    // Legacy anon JWTs remain supported. Decoding checks the key kind only;
    // identity verification still belongs to Supabase Auth, never this parser.
    let role: unknown;
    try {
      const parts = publicKey.split(".");
      if (parts.length !== 3) throw new Error("Invalid JWT");
      const payload: unknown = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      role = payload && typeof payload === "object" && "role" in payload ? payload.role : null;
    } catch { role = null; }
    if (role !== "anon") {
      throw new Error("Supabase 공개 환경변수에는 publishable 또는 anon 키만 사용할 수 있습니다.");
    }
  }
  return { url: parsed.origin, key };
}

export function getSupabaseConfig() {
  // Next.js requires static property access to inline public environment values.
  return parseSupabaseConfig({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function requireSupabaseConfig(): SupabasePublicConfig {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase 연결이 설정되지 않았습니다. .env.local을 확인하세요.");
  return config;
}
