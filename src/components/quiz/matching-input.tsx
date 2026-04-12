"use client";

import { useState } from "react";
import type { MatchingPair } from "@/lib/types/database";

interface MatchingInputProps {
  pairs: MatchingPair[];
  value?: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

export function MatchingInput({ pairs, value, onChange }: MatchingInputProps) {
  // Shuffle right-side options once
  const [shuffledRights] = useState(() =>
    pairs.map((p) => p.right).sort(() => Math.random() - 0.5)
  );

  const selections = value ?? {};

  function handleSelect(leftId: string, rightValue: string) {
    const updated = { ...selections };
    if (rightValue === "") {
      delete updated[leftId];
    } else {
      updated[leftId] = rightValue;
    }
    onChange(updated);
  }

  // Track which right values are already selected
  const usedRights = new Set(Object.values(selections));

  return (
    <div className="space-y-3">
      {pairs.map((pair) => {
        const currentSelection = selections[pair.id] ?? "";

        return (
          <div
            key={pair.id}
            className="flex items-center gap-3 rounded-card border border-border-default p-3"
          >
            <span className="text-sm text-text-primary flex-1 min-w-0">
              {pair.left}
            </span>
            <span className="text-text-secondary shrink-0">→</span>
            <select
              value={currentSelection}
              onChange={(e) => handleSelect(pair.id, e.target.value)}
              className="flex-1 min-w-0 rounded-lg border border-border-default bg-background px-2 py-1.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            >
              <option value="" className="text-text-secondary">
                Choisir...
              </option>
              {shuffledRights.map((right) => {
                const isUsed = usedRights.has(right) && currentSelection !== right;
                return (
                  <option
                    key={right}
                    value={right}
                    className={isUsed ? "text-text-secondary" : ""}
                  >
                    {right}{isUsed ? " (deja utilise)" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        );
      })}
    </div>
  );
}
