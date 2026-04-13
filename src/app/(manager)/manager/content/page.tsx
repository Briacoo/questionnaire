"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuizStatus } from "@/lib/types/database";

interface QuizWithAdmin {
  id: string;
  title: string;
  status: QuizStatus;
  created_at: string;
  admin_id: string;
  admin_pseudo: string;
}

const STATUS_FILTERS: { value: QuizStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "published", label: "Publies" },
  { value: "draft", label: "Brouillons" },
  { value: "archived", label: "Archives" },
];

const statusStyles: Record<QuizStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Brouillon", color: "text-status-draft", bg: "bg-status-draft/10" },
  published: { label: "Publie", color: "text-green-400", bg: "bg-green-400/10" },
  archived: { label: "Archive", color: "text-text-secondary", bg: "bg-white/5" },
};

export default function ManagerContentPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizWithAdmin[]>([]);
  const [filter, setFilter] = useState<QuizStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [quizzesRes, profilesRes] = await Promise.all([
        supabase.from("quizzes").select("id, title, status, created_at, admin_id").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, pseudo"),
      ]);

      const profileMap = new Map(
        (profilesRes.data ?? []).map((p) => [p.id, p.pseudo])
      );

      setQuizzes(
        (quizzesRes.data ?? []).map((q) => ({
          ...q,
          admin_pseudo: profileMap.get(q.admin_id) ?? "Inconnu",
        }))
      );
      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredQuizzes = filter === "all"
    ? quizzes
    : quizzes.filter((q) => q.status === filter);

  async function updateStatus(quizId: string, newStatus: QuizStatus) {
    setActionLoading(quizId);
    await supabase.from("quizzes").update({ status: newStatus }).eq("id", quizId);
    setQuizzes((prev) =>
      prev.map((q) => (q.id === quizId ? { ...q, status: newStatus } : q))
    );
    setActionLoading(null);
  }

  async function handleDelete(quizId: string) {
    if (!confirm("Supprimer ce quiz et toutes ses donnees ?")) return;
    setActionLoading(quizId);
    await supabase.from("quizzes").delete().eq("id", quizId);
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
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
      <h1 className="text-2xl font-bold text-text-primary mb-4">Moderation contenu</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-badge text-xs font-medium whitespace-nowrap transition-colors ${
              filter === value
                ? "bg-accent-blue text-background"
                : "bg-surface border border-border-default text-text-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="bg-surface border-border-default shadow-card">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">
            {filteredQuizzes.length} quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredQuizzes.length === 0 ? (
            <p className="text-sm text-text-secondary">Aucun quiz.</p>
          ) : (
            filteredQuizzes.map((quiz) => {
              const st = statusStyles[quiz.status];
              return (
                <div
                  key={quiz.id}
                  className="rounded-card border border-border-default bg-background p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {quiz.title}
                      </p>
                      <p className="text-xs text-text-secondary">
                        par {quiz.admin_pseudo} ·{" "}
                        {new Date(quiz.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-badge ${st.color} ${st.bg}`}>
                      {st.label}
                    </span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => router.push(`/admin/quiz/${quiz.id}/edit`)}
                      size="sm"
                      className="rounded-badge bg-accent-blue text-background text-xs"
                    >
                      Editer
                    </Button>
                    {quiz.status !== "published" && (
                      <Button
                        onClick={() => updateStatus(quiz.id, "published")}
                        disabled={actionLoading === quiz.id}
                        variant="outline"
                        size="sm"
                        className="rounded-badge border-green-400/30 text-green-400 text-xs"
                      >
                        Publier
                      </Button>
                    )}
                    {quiz.status === "published" && (
                      <Button
                        onClick={() => updateStatus(quiz.id, "archived")}
                        disabled={actionLoading === quiz.id}
                        variant="outline"
                        size="sm"
                        className="rounded-badge border-border-default text-text-secondary text-xs"
                      >
                        Archiver
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDelete(quiz.id)}
                      disabled={actionLoading === quiz.id}
                      variant="outline"
                      size="sm"
                      className="rounded-badge border-red-400/30 text-red-400 text-xs"
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
