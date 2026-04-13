"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminUser {
  id: string;
  pseudo: string;
  role: string;
  created_at: string;
  quiz_count: number;
}

export default function ManagerUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const supabase = createClient();

  const loadUsers = useCallback(async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, pseudo, role, created_at")
      .in("role", ["admin", "suspended"])
      .order("created_at", { ascending: false });

    if (!profiles) {
      setLoading(false);
      return;
    }

    // Count quizzes per admin
    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("admin_id");

    const quizCounts = new Map<string, number>();
    for (const q of quizzes ?? []) {
      quizCounts.set(q.admin_id, (quizCounts.get(q.admin_id) ?? 0) + 1);
    }

    setUsers(
      profiles.map((p) => ({
        ...p,
        quiz_count: quizCounts.get(p.id) ?? 0,
      }))
    );
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleSuspend(userId: string) {
    if (!confirm("Suspendre cet admin ? Ses quiz seront depublies.")) return;
    setActionLoading(userId);

    // Update role to suspended
    await supabase
      .from("profiles")
      .update({ role: "suspended" })
      .eq("id", userId);

    // Archive all their published quizzes
    await supabase
      .from("quizzes")
      .update({ status: "archived" })
      .eq("admin_id", userId)
      .eq("status", "published");

    await loadUsers();
    setActionLoading(null);
  }

  async function handleReactivate(userId: string) {
    setActionLoading(userId);

    await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", userId);

    await loadUsers();
    setActionLoading(null);
  }

  async function handleDelete(userId: string) {
    if (!confirm("Supprimer definitivement cet admin et tous ses quiz ?")) return;
    setActionLoading(userId);

    // Delete all quizzes (cascade will handle questions, submissions, answers)
    await supabase.from("quizzes").delete().eq("admin_id", userId);

    // Delete profile
    await supabase.from("profiles").delete().eq("id", userId);

    await loadUsers();
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <p className="text-text-secondary">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-32">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-blue">
        Administration
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Gestion des admins</h1>

      <Card className="bg-surface border-border-default shadow-card">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">
            {users.length} admin{users.length > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.length === 0 ? (
            <p className="text-sm text-text-secondary">Aucun admin inscrit.</p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="rounded-card border border-border-default bg-background p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{user.pseudo}</p>
                    <p className="text-xs text-text-secondary">
                      {user.quiz_count} quiz · Inscrit le{" "}
                      {new Date(user.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-badge ${
                      user.role === "suspended"
                        ? "bg-red-400/10 text-red-400"
                        : "bg-green-400/10 text-green-400"
                    }`}
                  >
                    {user.role === "suspended" ? "Suspendu" : "Actif"}
                  </span>
                </div>

                <div className="flex gap-2">
                  {user.role === "admin" ? (
                    <Button
                      onClick={() => handleSuspend(user.id)}
                      disabled={actionLoading === user.id}
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-badge border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                    >
                      {actionLoading === user.id ? "..." : "Suspendre"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleReactivate(user.id)}
                      disabled={actionLoading === user.id}
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-badge border-green-400/30 text-green-400 hover:bg-green-400/10"
                    >
                      {actionLoading === user.id ? "..." : "Reactiver"}
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(user.id)}
                    disabled={actionLoading === user.id}
                    variant="outline"
                    size="sm"
                    className="rounded-badge border-red-400/30 text-red-400 hover:bg-red-400/10"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
