import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// Singleton per environment — prevent SSR instance from leaking to client
let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  const isBrowser = typeof window !== "undefined";

  if (isBrowser && browserClient) return browserClient;

  const client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: isBrowser,
        storage: isBrowser ? window.localStorage : undefined,
        storageKey: "kwiz-auth",
        autoRefreshToken: isBrowser,
        detectSessionInUrl: isBrowser,
      },
    }
  );

  if (isBrowser) browserClient = client;

  return client;
}
