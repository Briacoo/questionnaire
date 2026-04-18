import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// Singleton - reuse same client instance
let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (client) return client;

  client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        storageKey: "kwiz-auth",
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );

  return client;
}
