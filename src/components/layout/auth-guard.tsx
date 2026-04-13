"use client";

import { useEffect, useRef } from "react";
import { getSession, clearSession } from "@/lib/session";
import type { Role } from "@/lib/types/database";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: Role;
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const checkedRef = useRef(false);

  const session = typeof window !== "undefined" ? getSession() : null;
  const hasSession = !!session;

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const s = getSession();
    if (!s) {
      window.location.replace("/auth/login");
      return;
    }

    // Check suspended
    if (s.role === "suspended") {
      clearSession();
      window.location.replace("/auth/login?error=suspended");
      return;
    }

    // Check required role
    if (requiredRole && s.role !== requiredRole) {
      // Redirect to appropriate dashboard
      const dest = s.role === "manager" ? "/manager" : "/admin";
      window.location.replace(dest);
    }
  }, [requiredRole]);

  if (!hasSession) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
      </div>
    );
  }

  // Block suspended users
  if (session?.role === "suspended") {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <p className="text-xl font-bold text-red-400">Compte suspendu</p>
          <p className="text-text-secondary text-sm">Contactez votre administrateur.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
