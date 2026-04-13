"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Quiz, Question, Submission, Answer } from "@/lib/types/database";
import { DEFAULT_QUIZ_SETTINGS } from "@/lib/types/database";

interface SubmissionWithAnswers extends Submission {
  answers: Answer[];
}

export default function QuizStatsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quizId = params.id;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithAnswers[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithAnswers | null>(null);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    const [quizRes, questionsRes, submissionsRes] = await Promise.all([
      supabase.from("quizzes").select("*").eq("id", quizId).single(),
      supabase.from("questions").select("*").eq("quiz_id", quizId).order("order"),
      supabase.from("submissions").select("*").eq("quiz_id", quizId).order("completed_at", { ascending: false }),
    ]);

    if (quizRes.data) {
      setQuiz({ ...quizRes.data, settings: { ...DEFAULT_QUIZ_SETTINGS, ...quizRes.data.settings } });
    }
    if (questionsRes.data) setQuestions(questionsRes.data);

    // Load answers for each submission
    if (submissionsRes.data && submissionsRes.data.length > 0) {
      const subIds = submissionsRes.data.map((s) => s.id);
      const { data: allAnswers } = await supabase
        .from("answers")
        .select("*")
        .in("submission_id", subIds);

      const subsWithAnswers: SubmissionWithAnswers[] = submissionsRes.data.map((sub) => ({
        ...sub,
        answers: (allAnswers ?? []).filter((a) => a.submission_id === sub.id),
      }));

      setSubmissions(subsWithAnswers);
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function exportCSV() {
    if (!quiz || submissions.length === 0) return;

    const settings = quiz.settings;
    const entryFields = settings.entry_form_enabled ? settings.entry_form_fields : [];

    // Build headers
    const headers = [
      ...entryFields.map((f) => f.charAt(0).toUpperCase() + f.slice(1)),
      "Score (%)",
      "Reussi",
      "Date",
      "Temps (s)",
      ...questions.map((q, i) => `Q${i + 1}: ${q.content.substring(0, 40)}`),
    ];

    // Build rows
    const rows = submissions.map((sub) => {
      const entryValues = entryFields.map((f) => sub.participant_info?.[f] ?? "");
      const answerValues = questions.map((q) => {
        const ans = sub.answers.find((a) => a.question_id === q.id);
        if (!ans) return "";
        const correct = ans.is_correct ? "✓" : "✗";
        const response = typeof ans.response === "string"
          ? ans.response
          : JSON.stringify(ans.response ?? "");
        return `${correct} ${response}`;
      });

      return [
        ...entryValues,
        String(sub.score),
        sub.passed === null ? "-" : sub.passed ? "Oui" : "Non",
        sub.completed_at ? new Date(sub.completed_at).toLocaleDateString("fr-FR") : "-",
        String(sub.time_spent),
        ...answerValues,
      ];
    });

    // Generate CSV
    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(";")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stats-${quiz.title.replace(/\s+/g, "-").toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <p className="text-text-secondary">Chargement...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="px-4 pt-6">
        <p className="text-text-secondary">Quiz introuvable.</p>
      </div>
    );
  }

  // Compute stats
  const totalSubmissions = submissions.length;
  const avgScore = totalSubmissions > 0
    ? Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / totalSubmissions)
    : 0;
  const passRate = totalSubmissions > 0
    ? Math.round((submissions.filter((s) => s.passed).length / totalSubmissions) * 100)
    : 0;
  const avgTime = totalSubmissions > 0
    ? Math.round(submissions.reduce((sum, s) => sum + s.time_spent, 0) / totalSubmissions)
    : 0;

  // Per-question stats
  const questionStats = questions.map((q) => {
    const qAnswers = submissions.flatMap((s) => s.answers.filter((a) => a.question_id === q.id));
    const total = qAnswers.length;
    const correct = qAnswers.filter((a) => a.is_correct).length;
    return {
      question: q,
      total,
      correctRate: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  });

  // Sort by worst success rate first
  const sortedQuestionStats = [...questionStats].sort((a, b) => a.correctRate - b.correctRate);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  }

  return (
    <div className="px-4 pt-6 pb-32">
      <button
        onClick={() => router.push(`/admin/quiz/${quizId}/edit`)}
        className="text-xs text-accent-blue hover:text-accent-blue-light mb-1 inline-block"
      >
        ← Retour a l&apos;editeur
      </button>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-text-primary">Statistiques</h1>
        {totalSubmissions > 0 && (
          <Button
            onClick={exportCSV}
            variant="outline"
            size="sm"
            className="rounded-badge border-border-default text-text-primary"
          >
            <svg className="mr-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </Button>
        )}
      </div>

      <p className="text-sm text-text-secondary mb-4">{quiz.title}</p>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-surface border-border-default">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-accent-blue">{totalSubmissions}</p>
            <p className="text-xs text-text-secondary">Participants</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border-default">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-accent-blue">{avgScore}%</p>
            <p className="text-xs text-text-secondary">Score moyen</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border-default">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{passRate}%</p>
            <p className="text-xs text-text-secondary">Taux de reussite</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border-default">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">{formatTime(avgTime)}</p>
            <p className="text-xs text-text-secondary">Temps moyen</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-question stats */}
      <Card className="bg-surface border-border-default shadow-card mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Par question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedQuestionStats.length === 0 ? (
            <p className="text-sm text-text-secondary">Aucune donnee disponible.</p>
          ) : (
            sortedQuestionStats.map(({ question, correctRate, total }) => (
              <div key={question.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{question.content}</p>
                  <p className="text-xs text-text-secondary">{total} reponse{total > 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-16 h-2 rounded-full bg-[#222]">
                    <div
                      className={`h-full rounded-full ${correctRate >= 70 ? "bg-green-400" : correctRate >= 40 ? "bg-yellow-400" : "bg-red-400"}`}
                      style={{ width: `${correctRate}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium w-8 text-right ${correctRate >= 70 ? "text-green-400" : correctRate >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                    {correctRate}%
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Participants list */}
      <Card className="bg-surface border-border-default shadow-card">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Participants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {submissions.length === 0 ? (
            <p className="text-sm text-text-secondary">Aucun participant pour le moment.</p>
          ) : (
            submissions.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubmission(sub)}
                className="w-full flex items-center justify-between rounded-card border border-border-default bg-background p-3 hover:bg-white/5 transition-colors"
              >
                <div className="text-left min-w-0">
                  <p className="text-sm text-text-primary truncate">
                    {sub.participant_name ?? "Anonyme"}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {sub.completed_at ? new Date(sub.completed_at).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    }) : "-"}
                    {" · "}{formatTime(sub.time_spent)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-bold ${sub.score >= 70 ? "text-green-400" : sub.score >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                    {sub.score}%
                  </span>
                  {sub.passed !== null && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-badge ${sub.passed ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                      {sub.passed ? "✓" : "✗"}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* Participant detail modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-card bg-surface border border-border-default p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">
                {selectedSubmission.participant_name ?? "Anonyme"}
              </h2>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-text-secondary hover:text-text-primary"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Participant info */}
            {Object.keys(selectedSubmission.participant_info ?? {}).length > 0 && (
              <div className="rounded-card bg-background border border-border-default p-3 space-y-1">
                {Object.entries(selectedSubmission.participant_info).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-text-secondary capitalize">{key}</span>
                    <span className="text-text-primary">{value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between text-sm border-b border-border-default pb-3">
              <span className="text-text-secondary">Score</span>
              <span className={`font-bold ${selectedSubmission.score >= 70 ? "text-green-400" : "text-red-400"}`}>
                {selectedSubmission.score}%
              </span>
            </div>

            {/* Answers detail */}
            <div className="space-y-3">
              {questions.map((q, i) => {
                const answer = selectedSubmission.answers.find((a) => a.question_id === q.id);
                return (
                  <div key={q.id} className="rounded-card bg-background border border-border-default p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm text-text-primary">
                        <span className="text-text-secondary">Q{i + 1}.</span> {q.content}
                      </p>
                      {answer && (
                        <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-badge ${answer.is_correct ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                          {answer.is_correct ? "✓" : "✗"}
                        </span>
                      )}
                    </div>
                    {answer ? (
                      <p className="text-xs text-text-secondary">
                        Reponse : {typeof answer.response === "string" ? answer.response : JSON.stringify(answer.response)}
                      </p>
                    ) : (
                      <p className="text-xs text-text-secondary italic">Pas de reponse</p>
                    )}
                  </div>
                );
              })}
            </div>

            <Button
              onClick={() => setSelectedSubmission(null)}
              className="w-full rounded-badge bg-accent-blue text-background"
            >
              Fermer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
