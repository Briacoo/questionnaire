"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";

// Simple external store for session check
function subscribe(callback: () => void) {
  // Re-check on storage events (other tabs)
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): boolean {
  return getSession() !== null;
}

function getServerSnapshot(): boolean {
  return false;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasAuth = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!hasAuth) {
    // Use setTimeout to avoid calling router during render
    if (typeof window !== "undefined") {
      router.replace("/auth/login");
    }
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
