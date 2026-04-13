"use client";

import { useEffect, useRef } from "react";
import { getSession } from "@/lib/session";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const checkedRef = useRef(false);

  // Initialize ready state from session (avoids setState in effect)
  const hasSession = typeof window !== "undefined" ? !!getSession() : false;

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    // Only redirect on client, after mount
    if (!getSession()) {
      window.location.replace("/auth/login");
    }
  }, []);

  if (!hasSession) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
