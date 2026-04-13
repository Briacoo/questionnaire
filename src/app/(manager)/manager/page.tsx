"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStats {
  totalQuizzes: number;
  totalAdmins: number;
  totalSubmissions: number;
  avgScore: number;
}

interface TopQuiz {
  id: string;
  title: string;
  admin_pseudo: string;
  submission_count: number;
  avg_score: number;
}

interface TopAdmin {
  pseudo: string;
  quiz_count: number;
  submission_count: number;
}

interface DailyActivity {
  date: string;
  count: number;
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topQuizzes, setTopQuizzes] = useState<TopQuiz[]>([]);
  const [topAdmins, setTopAdmins] = useState<TopAdmin[]>([]);
  const [activity, setActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Fetch all data in parallel
      const [quizzesRes, adminsRes, submissionsRes, profilesRes] = await Promise.all([
        supabase.from("quizzes").select("id, title, admin_id"),
        supabase.from("profiles").select("id, pseudo, role").in("role", ["admin", "suspended"]),
        supabase.from("submissions").select("id, quiz_id, score, completed_at"),
        supabase.from("profiles").select("id, pseudo"),
      ]);

      const quizzes = quizzesRes.data ?? [];
      const admins = adminsRes.data ?? [];
      const submissions = submissionsRes.data ?? [];
      const profiles = profilesRes.data ?? [];

      // Global stats
      const avgScore = submissions.length > 0
        ? Math.round(submissions.reduce((s, sub) => s + sub.score, 0) / submissions.length)
        : 0;

      setStats({
        totalQuizzes: quizzes.length,
        totalAdmins: admins.length,
        totalSubmissions: submissions.length,
        avgScore,
      });

      // Top 5 quizzes
      const quizSubmissionCounts = new Map<string, { count: number; totalScore: number }>();
      for (const sub of submissions) {
        const existing = quizSubmissionCounts.get(sub.quiz_id) ?? { count: 0, totalScore: 0 };
        existing.count++;
        existing.totalScore += sub.score;
        quizSubmissionCounts.set(sub.quiz_id, existing);
      }

      const profileMap = new Map(profiles.map((p) => [p.id, p.pseudo]));

      const topQ: TopQuiz[] = quizzes
        .map((q) => {
          const data = quizSubmissionCounts.get(q.id) ?? { count: 0, totalScore: 0 };
          return {
            id: q.id,
            title: q.title,
            admin_pseudo: profileMap.get(q.admin_id) ?? "Inconnu",
            submission_count: data.count,
            avg_score: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
          };
        })
        .sort((a, b) => b.submission_count - a.submission_count)
        .slice(0, 5);

      setTopQuizzes(topQ);

      // Top 5 admins
      const adminQuizCounts = new Map<string, number>();
      for (const q of quizzes) {
        adminQuizCounts.set(q.admin_id, (adminQuizCounts.get(q.admin_id) ?? 0) + 1);
      }

      const adminSubmissionCounts = new Map<string, number>();
      for (const sub of submissions) {
        const quiz = quizzes.find((q) => q.id === sub.quiz_id);
        if (quiz) {
          adminSubmissionCounts.set(quiz.admin_id, (adminSubmissionCounts.get(quiz.admin_id) ?? 0) + 1);
        }
      }

      const topA: TopAdmin[] = admins
        .map((a) => ({
          pseudo: a.pseudo,
          quiz_count: adminQuizCounts.get(a.id) ?? 0,
          submission_count: adminSubmissionCounts.get(a.id) ?? 0,
        }))
        .sort((a, b) => b.submission_count - a.submission_count)
        .slice(0, 5);

      setTopAdmins(topA);

      // Activity last 30 days
      const now = new Date();
      const days: DailyActivity[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const count = submissions.filter(
          (s) => s.completed_at?.startsWith(dateStr)
        ).length;
        days.push({ date: dateStr, count });
      }
      setActivity(days);

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <p className="text-text-secondary">Chargement...</p>
      </div>
    );
  }

  const maxActivity = Math.max(...activity.map((d) => d.count), 1);

  return (
    <div className="px-4 pt-6 pb-32">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-blue">
        Administration
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Dashboard</h1>

      {/* Global stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="bg-surface border-border-default">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-accent-blue">{stats.totalQuizzes}</p>
              <p className="text-xs text-text-secondary">Quiz</p>
            </CardContent>
          </Card>
          <Card className="bg-surface border-border-default">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-accent-blue">{stats.totalAdmins}</p>
              <p className="text-xs text-text-secondary">Admins</p>
            </CardContent>
          </Card>
          <Card className="bg-surface border-border-default">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-accent-blue">{stats.totalSubmissions}</p>
              <p className="text-xs text-text-secondary">Soumissions</p>
            </CardContent>
          </Card>
          <Card className="bg-surface border-border-default">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-accent-blue">{stats.avgScore}%</p>
              <p className="text-xs text-text-secondary">Score moyen</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity chart */}
      <Card className="bg-surface border-border-default shadow-card mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Activite (30 jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-[2px] h-24">
            {activity.map((day) => (
              <div
                key={day.date}
                className="flex-1 bg-accent-blue/80 rounded-t-sm hover:bg-accent-blue transition-colors relative group"
                style={{ height: `${Math.max((day.count / maxActivity) * 100, 2)}%` }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-surface border border-border-default rounded px-2 py-1 text-xs text-text-primary whitespace-nowrap z-10">
                  {new Date(day.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} : {day.count}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-text-secondary">
            <span>{new Date(activity[0]?.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
            <span>Aujourd&apos;hui</span>
          </div>
        </CardContent>
      </Card>

      {/* Top 5 quizzes */}
      <Card className="bg-surface border-border-default shadow-card mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Top 5 Quiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topQuizzes.length === 0 ? (
            <p className="text-sm text-text-secondary">Aucun quiz.</p>
          ) : (
            topQuizzes.map((q, i) => (
              <div key={q.id} className="flex items-center gap-3">
                <span className="text-lg font-bold text-text-secondary w-6">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{q.title}</p>
                  <p className="text-xs text-text-secondary">par {q.admin_pseudo}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-accent-blue">{q.submission_count}</p>
                  <p className="text-xs text-text-secondary">{q.avg_score}% moy.</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Top 5 admins */}
      <Card className="bg-surface border-border-default shadow-card">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Top 5 Admins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topAdmins.length === 0 ? (
            <p className="text-sm text-text-secondary">Aucun admin.</p>
          ) : (
            topAdmins.map((a, i) => (
              <div key={a.pseudo} className="flex items-center gap-3">
                <span className="text-lg font-bold text-text-secondary w-6">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{a.pseudo}</p>
                  <p className="text-xs text-text-secondary">{a.quiz_count} quiz</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-accent-blue">{a.submission_count}</p>
                  <p className="text-xs text-text-secondary">soumissions</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
