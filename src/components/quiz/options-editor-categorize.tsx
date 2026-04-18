"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { CategorizeConfig } from "@/lib/types/database";

interface CategorizeEditorProps {
  config: CategorizeConfig;
  correctAnswer: Record<string, string>;
  onChange: (config: CategorizeConfig, correctAnswer: Record<string, string>) => void;
}

export function CategorizeEditor({ config, correctAnswer, onChange }: CategorizeEditorProps) {
  function addCategory() {
    if (config.categories.length >= 4) return;
    const newCat = { id: crypto.randomUUID(), label: "" };
    onChange({ ...config, categories: [...config.categories, newCat] }, correctAnswer);
  }

  function removeCategory(id: string) {
    if (config.categories.length <= 2) return;
    const filtered = config.categories.filter((c) => c.id !== id);
    // Remove assignments to deleted category
    const newAnswer = { ...correctAnswer };
    for (const [itemId, catId] of Object.entries(newAnswer)) {
      if (catId === id) delete newAnswer[itemId];
    }
    onChange({ ...config, categories: filtered }, newAnswer);
  }

  function updateCategoryLabel(id: string, label: string) {
    onChange(
      { ...config, categories: config.categories.map((c) => (c.id === id ? { ...c, label } : c)) },
      correctAnswer
    );
  }

  function addItem() {
    const newItem = { id: crypto.randomUUID(), text: "" };
    onChange({ ...config, items: [...config.items, newItem] }, correctAnswer);
  }

  function removeItem(id: string) {
    if (config.items.length <= 1) return;
    const newAnswer = { ...correctAnswer };
    delete newAnswer[id];
    onChange({ ...config, items: config.items.filter((i) => i.id !== id) }, newAnswer);
  }

  function updateItemText(id: string, text: string) {
    onChange(
      { ...config, items: config.items.map((i) => (i.id === id ? { ...i, text } : i)) },
      correctAnswer
    );
  }

  function assignItem(itemId: string, categoryId: string) {
    onChange(config, { ...correctAnswer, [itemId]: categoryId });
  }

  return (
    <div className="space-y-4">
      {/* Categories */}
      <div className="space-y-2">
        <Label className="text-text-primary text-sm">Categories (2-4)</Label>
        {config.categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-2">
            <Input
              value={cat.label}
              onChange={(e) => updateCategoryLabel(cat.id, e.target.value)}
              placeholder="Nom de la categorie..."
              className="bg-background border-border-default text-text-primary text-sm"
            />
            {config.categories.length > 2 && (
              <button type="button" onClick={() => removeCategory(cat.id)} className="text-text-secondary hover:text-red-400 text-sm shrink-0">
                ✕
              </button>
            )}
          </div>
        ))}
        {config.categories.length < 4 && (
          <Button type="button" variant="outline" size="sm" onClick={addCategory} className="rounded-badge border-border-default text-text-secondary text-xs">
            + Categorie
          </Button>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2">
        <Label className="text-text-primary text-sm">Elements a trier</Label>
        {config.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <Input
              value={item.text}
              onChange={(e) => updateItemText(item.id, e.target.value)}
              placeholder="Element..."
              className="bg-background border-border-default text-text-primary text-sm flex-1"
            />
            <select
              value={correctAnswer[item.id] || ""}
              onChange={(e) => assignItem(item.id, e.target.value)}
              className="bg-background border border-border-default text-text-primary text-sm rounded-card px-2 py-1.5"
            >
              <option value="">-- Categorie --</option>
              {config.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label || "Sans nom"}</option>
              ))}
            </select>
            {config.items.length > 1 && (
              <button type="button" onClick={() => removeItem(item.id)} className="text-text-secondary hover:text-red-400 text-sm shrink-0">
                ✕
              </button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="rounded-badge border-border-default text-text-secondary text-xs">
          + Element
        </Button>
      </div>
    </div>
  );
}
