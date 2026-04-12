"use client";

import type { QuestionType } from "@/lib/types/database";

const questionTypes: { type: QuestionType; label: string; description: string }[] = [
  { type: "mcq_single", label: "QCM choix unique", description: "Une seule bonne reponse" },
  { type: "mcq_multiple", label: "QCM choix multiple", description: "Plusieurs bonnes reponses" },
  { type: "true_false", label: "Vrai / Faux", description: "Question binaire" },
  { type: "free_text", label: "Texte libre", description: "Reponse ouverte" },
  { type: "drag_order", label: "Ordonner", description: "Remettre dans l'ordre" },
  { type: "matching", label: "Association", description: "Relier les paires" },
  { type: "scale", label: "Echelle", description: "Note sur une echelle" },
];

interface QuestionTypePickerProps {
  onSelect: (type: QuestionType) => void;
  onCancel: () => void;
}

export function QuestionTypePicker({ onSelect, onCancel }: QuestionTypePickerProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Type de question
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {questionTypes.map(({ type, label, description }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="flex flex-col items-start rounded-card border border-border-default bg-surface p-3 text-left hover:border-accent-blue transition-colors"
          >
            <span className="text-sm font-medium text-text-primary">{label}</span>
            <span className="text-xs text-text-secondary">{description}</span>
          </button>
        ))}
      </div>
      <button
        onClick={onCancel}
        className="mt-2 text-sm text-text-secondary hover:text-text-primary"
      >
        Annuler
      </button>
    </div>
  );
}
