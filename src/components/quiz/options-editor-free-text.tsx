"use client";

import { Input } from "@/components/ui/input";

interface FreeTextEditorProps {
  correctAnswer: string;
  onChange: (correctAnswer: string) => void;
}

export function FreeTextEditor({ correctAnswer, onChange }: FreeTextEditorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-text-secondary">
        Reponse attendue (laisser vide pour une question ouverte sans correction automatique)
      </p>
      <Input
        value={correctAnswer}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Reponse attendue (optionnel)"
        className="bg-background border-border-default text-text-primary text-sm"
      />
    </div>
  );
}
