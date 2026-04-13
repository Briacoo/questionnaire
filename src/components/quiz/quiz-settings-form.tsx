"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuizSettings } from "@/lib/types/database";
import { ENTRY_FORM_FIELD_OPTIONS } from "@/lib/types/database";

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
        { key: "require_answer" as const, label: "Reponse obligatoire avant de continuer" },
        { key: "allow_restart" as const, label: "Autoriser a recommencer le quiz" },
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

      {/* Entry form toggle */}
      <button
        type="button"
        onClick={() => update("entry_form_enabled", !settings.entry_form_enabled)}
        className="flex w-full items-center justify-between rounded-card border border-border-default bg-surface p-3"
      >
        <span className="text-sm text-text-primary">Formulaire d&apos;entree (infos participant)</span>
        <div
          className={`h-6 w-11 rounded-full transition-colors ${
            settings.entry_form_enabled ? "bg-accent-blue" : "bg-[#333]"
          } relative`}
        >
          <div
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              settings.entry_form_enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </div>
      </button>

      {/* Entry form fields checkboxes */}
      {settings.entry_form_enabled && (
        <div className="rounded-card border border-border-default bg-surface p-3 space-y-2">
          <Label className="text-text-secondary text-xs">Champs a afficher</Label>
          {ENTRY_FORM_FIELD_OPTIONS.map(({ key, label }) => {
            const checked = settings.entry_form_fields.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  const fields = checked
                    ? settings.entry_form_fields.filter((f) => f !== key)
                    : [...settings.entry_form_fields, key];
                  update("entry_form_fields", fields);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5"
              >
                <div
                  className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                    checked
                      ? "bg-accent-blue border-accent-blue"
                      : "border-border-default bg-background"
                  }`}
                >
                  {checked && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-text-primary">{label}</span>
              </button>
            );
          })}
        </div>
      )}

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
