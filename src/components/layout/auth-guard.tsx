"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Only runs on the client, after mount
    const session = getSession();
    if (!session) {
      // Hard redirect like thcv2 — no React router, no SSR issues
      window.location.replace("/auth/login");
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
