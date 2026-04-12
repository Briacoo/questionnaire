"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { McqOption } from "@/lib/types/database";

interface McqOptionsEditorProps {
  options: McqOption[];
  correctAnswer: string | string[];
  multiple: boolean;
  onChange: (options: McqOption[], correctAnswer: string | string[]) => void;
}

export function McqOptionsEditor({
  options,
  correctAnswer,
  multiple,
  onChange,
}: McqOptionsEditorProps) {
  function addOption() {
    const newOption: McqOption = {
      id: crypto.randomUUID(),
      text: "",
    };
    onChange([...options, newOption], correctAnswer);
  }

  function updateOption(id: string, text: string) {
    onChange(
      options.map((o) => (o.id === id ? { ...o, text } : o)),
      correctAnswer
    );
  }

  function removeOption(id: string) {
    const newOptions = options.filter((o) => o.id !== id);
    if (multiple) {
      const arr = Array.isArray(correctAnswer) ? correctAnswer : [];
      onChange(newOptions, arr.filter((a) => a !== id));
    } else {
      onChange(newOptions, correctAnswer === id ? "" : correctAnswer);
    }
  }

  function toggleCorrect(id: string) {
    if (multiple) {
      const arr = Array.isArray(correctAnswer) ? correctAnswer : [];
      const newAnswer = arr.includes(id)
        ? arr.filter((a) => a !== id)
        : [...arr, id];
      onChange(options, newAnswer);
    } else {
      onChange(options, id);
    }
  }

  const correctIds = multiple
    ? (Array.isArray(correctAnswer) ? correctAnswer : [])
    : [correctAnswer];

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-secondary">
        {multiple
          ? "Cochez toutes les bonnes reponses"
          : "Cochez la bonne reponse"}
      </p>
      {options.map((option) => (
        <div key={option.id} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleCorrect(option.id)}
            className={`flex h-5 w-5 shrink-0 items-center justify-center ${multiple ? "rounded-sm" : "rounded-full"} border ${
              correctIds.includes(option.id)
                ? "border-accent-blue bg-accent-blue"
                : "border-border-default"
            } transition-colors`}
          >
            {correctIds.includes(option.id) && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
          <Input
            value={option.text}
            onChange={(e) => updateOption(option.id, e.target.value)}
            placeholder="Texte de l'option"
            className="flex-1 bg-background border-border-default text-text-primary text-sm"
          />
          {options.length > 2 && (
            <button
              type="button"
              onClick={() => removeOption(option.id)}
              className="text-text-secondary hover:text-red-400"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addOption}
        className="text-xs border-border-default text-text-secondary"
      >
        + Ajouter une option
      </Button>
    </div>
  );
}
