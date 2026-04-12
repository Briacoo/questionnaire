"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_QUIZ_SETTINGS } from "@/lib/types/database";

export default function NewQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Non authentifie");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("quizzes")
      .insert({
        admin_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        settings: DEFAULT_QUIZ_SETTINGS,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/admin/quiz/${data.id}/edit`);
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Nouveau questionnaire
      </h1>
      <Card className="bg-surface border-border-default shadow-card">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-text-primary">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Quiz sur la securite informatique"
                required
                className="bg-background border-border-default text-text-primary placeholder:text-text-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-text-primary">
                Description (optionnelle)
              </Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Decrivez votre questionnaire..."
                rows={3}
                className="flex w-full rounded-lg border border-border-default bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 rounded-badge border-border-default text-text-primary"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading || !title.trim()}
                className="flex-1 rounded-badge bg-accent-blue hover:bg-accent-blue-secondary text-background font-semibold"
              >
                {loading ? "Creation..." : "Creer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
