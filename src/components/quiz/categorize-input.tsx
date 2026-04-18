"use client";

import { useState } from "react";
import type { CategorizeConfig } from "@/lib/types/database";

interface CategorizeInputProps {
  config: CategorizeConfig;
  value?: Record<string, string>;
  onChange: (val: Record<string, string>) => void;
}

export function CategorizeInput({ config, value = {}, onChange }: CategorizeInputProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const unassigned = config.items.filter((item) => !value[item.id]);

  function assignItem(itemId: string, categoryId: string) {
    onChange({ ...value, [itemId]: categoryId });
    setSelectedItem(null);
  }

  function unassignItem(itemId: string) {
    const newVal = { ...value };
    delete newVal[itemId];
    onChange(newVal);
  }

  return (
    <div className="space-y-4">
      {/* Unassigned pool */}
      {unassigned.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Elements a trier :</p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                className={`px-3 py-1.5 rounded-badge text-sm border transition-colors ${
                  selectedItem === item.id
                    ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                    : "border-border-default text-text-primary hover:border-border-strong"
                }`}
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(config.categories.length, 3)}, 1fr)` }}>
        {config.categories.map((cat) => {
          const itemsInCat = config.items.filter((item) => value[item.id] === cat.id);
          return (
            <div
              key={cat.id}
              onClick={() => {
                if (selectedItem) assignItem(selectedItem, cat.id);
              }}
              className={`rounded-card border p-3 min-h-[100px] transition-colors ${
                selectedItem ? "cursor-pointer hover:border-accent-blue/50 border-dashed" : ""
              } border-border-default`}
            >
              <p className="text-xs font-semibold text-text-primary mb-2">{cat.label}</p>
              <div className="space-y-1">
                {itemsInCat.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-2 py-1 rounded bg-accent-blue/10 text-sm text-text-primary">
                    <span>{item.text}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); unassignItem(item.id); }} className="text-text-secondary hover:text-red-400 text-xs ml-2">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedItem && (
        <p className="text-xs text-accent-blue">Cliquez sur une categorie pour y placer l&apos;element</p>
      )}
    </div>
  );
}
