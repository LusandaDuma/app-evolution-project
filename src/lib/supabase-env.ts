import { missingSupabaseEnvMessage } from "@/lib/errors";

export type SupabaseClientEnv = {
  url: string;
  publishableKey: string;
};

export type SupabaseAdminEnv = SupabaseClientEnv & {
  serviceRoleKey: string;
};

function readEnv(
  viteKey: string,
  serverKey: string,
): string | undefined {
  const fromVite =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env as Record<string, string | undefined>)[viteKey];
  if (fromVite) return fromVite;
  if (typeof process !== "undefined" && process.env[serverKey]) {
    return process.env[serverKey];
  }
  return undefined;
}

export function getSupabaseClientEnv(): SupabaseClientEnv {
  const url = readEnv("VITE_SUPABASE_URL", "SUPABASE_URL");
  const publishableKey = readEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY");

  const missing: string[] = [];
  if (!url) missing.push("VITE_SUPABASE_URL / SUPABASE_URL");
  if (!publishableKey) missing.push("VITE_SUPABASE_PUBLISHABLE_KEY / SUPABASE_PUBLISHABLE_KEY");

  if (missing.length > 0) {
    throw new Error(missingSupabaseEnvMessage(missing));
  }

  return { url: url!, publishableKey: publishableKey! };
}

export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  const client = getSupabaseClientEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      missingSupabaseEnvMessage(["SUPABASE_SERVICE_ROLE_KEY"]),
    );
  }

  return { ...client, serviceRoleKey };
}
