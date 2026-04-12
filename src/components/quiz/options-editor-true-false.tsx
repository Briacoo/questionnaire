"use client";

interface TrueFalseEditorProps {
  correctAnswer: string;
  onChange: (correctAnswer: string) => void;
}

export function TrueFalseEditor({ correctAnswer, onChange }: TrueFalseEditorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-text-secondary">Selectionnez la bonne reponse</p>
      <div className="flex gap-3">
        {[
          { value: "true", label: "Vrai" },
          { value: "false", label: "Faux" },
        ].map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`flex-1 rounded-badge border p-3 text-center text-sm font-medium transition-colors ${
              correctAnswer === value
                ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                : "border-border-default text-text-secondary hover:border-border-strong"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
