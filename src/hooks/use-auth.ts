"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSession, clearSession } from "@/lib/session";
import type { Profile } from "@/lib/types/database";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    async function init() {
      // First check our manual session
      const session = getSession();
      if (!session) {
        setState({ user: null, profile: null, loading: false });
        return;
      }

      // Restore Supabase session from our stored tokens
      const supabase = createClient();
      const { data: { session: supaSession } } = await supabase.auth.getSession();

      if (!supaSession) {
        // Try to restore with refresh token
        const { data, error } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        if (error || !data.user) {
          clearSession();
          setState({ user: null, profile: null, loading: false });
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        setState({ user: data.user, profile, loading: false });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", supaSession.user.id)
        .single();

      setState({ user: supaSession.user, profile, loading: false });
    }

    init();
  }, []);

  return state;
}
