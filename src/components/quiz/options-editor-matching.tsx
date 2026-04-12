"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MatchingPair } from "@/lib/types/database";

interface MatchingEditorProps {
  pairs: MatchingPair[];
  onChange: (pairs: MatchingPair[]) => void;
}

export function MatchingEditor({ pairs, onChange }: MatchingEditorProps) {
  function addPair() {
    onChange([...pairs, { id: crypto.randomUUID(), left: "", right: "" }]);
  }

  function updatePair(id: string, side: "left" | "right", value: string) {
    onChange(pairs.map((p) => (p.id === id ? { ...p, [side]: value } : p)));
  }

  function removePair(id: string) {
    onChange(pairs.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-secondary">
        Definissez les paires. L&apos;ordre sera melange pour le participant.
      </p>
      {pairs.map((pair) => (
        <div key={pair.id} className="flex items-center gap-2">
          <Input
            value={pair.left}
            onChange={(e) => updatePair(pair.id, "left", e.target.value)}
            placeholder="Element gauche"
            className="flex-1 bg-background border-border-default text-text-primary text-sm"
          />
          <span className="text-text-secondary text-xs shrink-0">→</span>
          <Input
            value={pair.right}
            onChange={(e) => updatePair(pair.id, "right", e.target.value)}
            placeholder="Element droit"
            className="flex-1 bg-background border-border-default text-text-primary text-sm"
          />
          {pairs.length > 2 && (
            <button
              type="button"
              onClick={() => removePair(pair.id)}
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
        onClick={addPair}
        className="text-xs border-border-default text-text-secondary"
      >
        + Ajouter une paire
      </Button>
    </div>
  );
}
