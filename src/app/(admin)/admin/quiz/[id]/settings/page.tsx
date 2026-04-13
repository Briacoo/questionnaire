"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizSettingsForm } from "@/components/quiz/quiz-settings-form";
import { QuizPublishDialog } from "@/components/quiz/quiz-publish-dialog";
import type { Quiz, QuizSettings, QuizStatus } from "@/lib/types/database";
import { DEFAULT_QUIZ_SETTINGS } from "@/lib/types/database";

export default function QuizSettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quizId = params.id;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [settings, setSettings] = useState<QuizSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (data) {
        setQuiz(data);
        // Merge with defaults to ensure new fields exist
        setSettings({ ...DEFAULT_QUIZ_SETTINGS, ...data.settings });
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);

    await supabase
      .from("quizzes")
      .update({ settings })
      .eq("id", quizId);

    setSaving(false);
    router.push(`/admin/quiz/${quizId}/edit`);
  }

  async function updateStatus(newStatus: QuizStatus) {
    await supabase
      .from("quizzes")
      .update({ status: newStatus })
      .eq("id", quizId);

    setQuiz((q) => (q ? { ...q, status: newStatus } : null));
  }

  async function handleDelete() {
    if (!confirm("Supprimer ce questionnaire ?")) return;

    await supabase.from("quizzes").delete().eq("id", quizId);
    router.push("/admin");
  }

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <p className="text-text-secondary">Chargement...</p>
      </div>
    );
  }

  if (!quiz || !settings) {
    return (
      <div className="px-4 pt-6">
        <p className="text-text-secondary">Quiz introuvable.</p>
      </div>
    );
  }

  const statusConfig = {
    draft: { label: "Brouillon", color: "text-status-draft", bg: "bg-status-draft/10" },
    published: { label: "Publie", color: "text-green-400", bg: "bg-green-400/10" },
    archived: { label: "Archive", color: "text-text-secondary", bg: "bg-white/5" },
  };

  const current = statusConfig[quiz.status];

  return (
    <div className="px-4 pt-6 pb-32">
      <button
        onClick={() => router.push(`/admin/quiz/${quizId}/edit`)}
        className="text-xs text-accent-blue hover:text-accent-blue-light mb-1 inline-block"
      >
        ← Retour a l&apos;editeur
      </button>
      <h1 className="text-xl font-bold text-text-primary mb-6">Parametres</h1>

      {/* Settings form */}
      <Card className="bg-surface border-border-default shadow-card mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <QuizSettingsForm settings={settings} onChange={setSettings} />
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-badge bg-accent-blue hover:bg-accent-blue-secondary text-background font-semibold mb-6"
      >
        {saving ? "Enregistrement..." : "Enregistrer les parametres"}
      </Button>

      {/* Publication section */}
      <Card className="bg-surface border-border-default shadow-card mb-4">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Publication</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-badge ${current.color} ${current.bg}`}>
              {current.label}
            </span>
          </div>

          {/* Status actions */}
          <div className="space-y-2">
            {quiz.status === "draft" && (
              <Button
                onClick={() => updateStatus("published")}
                size="sm"
                className="w-full rounded-badge bg-green-500 hover:bg-green-600 text-white font-semibold"
              >
                Publier le questionnaire
              </Button>
            )}

            {quiz.status === "published" && (
              <div className="flex gap-2">
                <Button
                  onClick={() => updateStatus("archived")}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-badge border-border-default text-text-secondary"
                >
                  Archiver
                </Button>
                <Button
                  onClick={() => updateStatus("draft")}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-badge border-border-default text-status-draft"
                >
                  Depublier
                </Button>
              </div>
            )}

            {quiz.status === "archived" && (
              <div className="flex gap-2">
                <Button
                  onClick={() => updateStatus("published")}
                  size="sm"
                  className="flex-1 rounded-badge bg-green-500 hover:bg-green-600 text-white font-semibold"
                >
                  Republier
                </Button>
                <Button
                  onClick={() => updateStatus("draft")}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-badge border-border-default text-text-primary"
                >
                  Remettre en brouillon
                </Button>
              </div>
            )}
          </div>

          {/* QR Code section */}
          <div className="border-t border-border-default pt-4">
            <h4 className="text-xs font-semibold text-text-secondary mb-2">QR Code & Lien</h4>
            {quiz.status === "published" ? (
              <Button
                onClick={() => setShowQR(true)}
                variant="outline"
                size="sm"
                className="w-full rounded-badge border-border-default text-text-primary"
              >
                <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
                Afficher le QR Code
              </Button>
            ) : (
              <p className="text-xs text-text-secondary italic">
                Publiez le questionnaire pour generer un QR code et un lien partageable.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="bg-surface border-red-400/20 shadow-card">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-red-400 mb-2">Zone de danger</h3>
          <Button
            onClick={handleDelete}
            variant="outline"
            size="sm"
            className="rounded-badge border-red-400/30 text-red-400 hover:bg-red-400/10"
          >
            Supprimer ce questionnaire
          </Button>
        </CardContent>
      </Card>

      {showQR && (
        <QuizPublishDialog
          quizId={quizId}
          quizTitle={quiz.title}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
}
