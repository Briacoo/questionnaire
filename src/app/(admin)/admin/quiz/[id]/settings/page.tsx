"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizSettingsForm } from "@/components/quiz/quiz-settings-form";
import { QuizPublishDialog } from "@/components/quiz/quiz-publish-dialog";
import type { Quiz, QuizSettings } from "@/lib/types/database";

export default function QuizSettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quizId = params.id;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [settings, setSettings] = useState<QuizSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
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
        setSettings(data.settings);
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

  async function handlePublish() {
    await supabase
      .from("quizzes")
      .update({ status: "published" })
      .eq("id", quizId);

    setQuiz((q) => (q ? { ...q, status: "published" } : null));
    setShowPublish(true);
  }

  async function handleUnpublish() {
    await supabase
      .from("quizzes")
      .update({ status: "draft" })
      .eq("id", quizId);

    setQuiz((q) => (q ? { ...q, status: "draft" } : null));
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

  return (
    <div className="px-4 pt-6 pb-32">
      <button
        onClick={() => router.push(`/admin/quiz/${quizId}/edit`)}
        className="text-xs text-accent-blue hover:text-accent-blue-light mb-1 inline-block"
      >
        ← Retour a l&apos;editeur
      </button>
      <h1 className="text-xl font-bold text-text-primary mb-6">Parametres</h1>

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
        className="w-full rounded-badge bg-accent-blue hover:bg-accent-blue-secondary text-background font-semibold mb-4"
      >
        {saving ? "Enregistrement..." : "Enregistrer les parametres"}
      </Button>

      <Card className="bg-surface border-border-default shadow-card mb-4">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Publication</h3>
          {quiz.status === "published" ? (
            <div className="space-y-2">
              <p className="text-xs text-text-secondary">Ce quiz est publie et accessible.</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowPublish(true)}
                  variant="outline"
                  size="sm"
                  className="rounded-badge border-border-default text-text-primary"
                >
                  Voir le lien
                </Button>
                <Button
                  onClick={handleUnpublish}
                  variant="outline"
                  size="sm"
                  className="rounded-badge border-border-default text-status-draft"
                >
                  Depublier
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-text-secondary">Publiez pour generer un lien partageable.</p>
              <Button
                onClick={handlePublish}
                size="sm"
                className="rounded-badge bg-accent-blue hover:bg-accent-blue-secondary text-background font-semibold"
              >
                Publier
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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

      {showPublish && (
        <QuizPublishDialog
          quizId={quizId}
          quizTitle={quiz.title}
          onClose={() => setShowPublish(false)}
        />
      )}
    </div>
  );
}
