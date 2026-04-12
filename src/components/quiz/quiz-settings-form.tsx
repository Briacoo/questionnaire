"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuizSettings } from "@/lib/types/database";

interface QuizSettingsFormProps {
  settings: QuizSettings;
  onChange: (settings: QuizSettings) => void;
}

export function QuizSettingsForm({ settings, onChange }: QuizSettingsFormProps) {
  function update(field: keyof QuizSettings, value: unknown) {
    onChange({ ...settings, [field]: value });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-text-primary text-sm">Temps limite (minutes)</Label>
        <Input
          type="number"
          min={0}
          value={settings.time_limit ?? ""}
          onChange={(e) =>
            update("time_limit", e.target.value ? parseInt(e.target.value) : null)
          }
          placeholder="Aucune limite"
          className="bg-background border-border-default text-text-primary"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-text-primary text-sm">Seuil de reussite (%)</Label>
        <Input
          type="number"
          min={0}
          max={100}
          value={settings.passing_score ?? ""}
          onChange={(e) =>
            update("passing_score", e.target.value ? parseInt(e.target.value) : null)
          }
          placeholder="Pas de seuil"
          className="bg-background border-border-default text-text-primary"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-text-primary text-sm">Nombre max de tentatives</Label>
        <Input
          type="number"
          min={1}
          value={settings.max_attempts ?? ""}
          onChange={(e) =>
            update("max_attempts", e.target.value ? parseInt(e.target.value) : null)
          }
          placeholder="Illimite"
          className="bg-background border-border-default text-text-primary"
        />
      </div>

      {[
        { key: "show_feedback" as const, label: "Afficher le feedback par question" },
        { key: "shuffle_questions" as const, label: "Melanger l'ordre des questions" },
        { key: "shuffle_answers" as const, label: "Melanger l'ordre des reponses" },
        { key: "allow_back_navigation" as const, label: "Autoriser le retour en arriere" },
      ].map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => update(key, !settings[key])}
          className="flex w-full items-center justify-between rounded-card border border-border-default bg-surface p-3"
        >
          <span className="text-sm text-text-primary">{label}</span>
          <div
            className={`h-6 w-11 rounded-full transition-colors ${
              settings[key] ? "bg-accent-blue" : "bg-[#333]"
            } relative`}
          >
            <div
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                settings[key] ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>
      ))}

      <div className="space-y-2">
        <Label className="text-text-primary text-sm">Message d&apos;erreur custom</Label>
        <Input
          value={settings.error_message ?? ""}
          onChange={(e) =>
            update("error_message", e.target.value || null)
          }
          placeholder="Message par defaut"
          className="bg-background border-border-default text-text-primary"
        />
      </div>
    </div>
  );
}
