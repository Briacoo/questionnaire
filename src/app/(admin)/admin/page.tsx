"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { QuizCard } from "@/components/quiz/quiz-card";
import type { Quiz } from "@/lib/types/database";

export default function AdminDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quizzes, setQuizzes] = useState<(Quiz & { questions?: any[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("quizzes")
        .select("*, questions(count)")
        .eq("admin_id", user.id)
        .order("updated_at", { ascending: false });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (data) setQuizzes(data as any);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  const handleQuizUpdated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-blue">
        Mes Quiz
      </div>
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>

      {quizzes.length > 0 ? (
        <div className="mt-6 space-y-3">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              questionCount={quiz.questions?.[0]?.count ?? 0}
              onQuizUpdated={handleQuizUpdated}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-card bg-surface p-6 border border-border-default shadow-card text-center">
          <p className="text-text-secondary">Aucun quiz pour le moment.</p>
          <p className="mt-1 text-sm text-text-secondary">
            Appuyez sur + pour creer votre premier quiz.
          </p>
        </div>
      )}

      {/* FAB */}
      <Link
        href="/admin/quiz/new"
        className="fixed bottom-24 right-4 flex h-14 w-14 items-center justify-center rounded-fab bg-accent-blue text-background shadow-fab hover:bg-accent-blue-secondary transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>
    </div>
  );
}
