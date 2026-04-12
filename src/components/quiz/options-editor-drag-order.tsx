"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DragOrderEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
}

export function DragOrderEditor({ items, onChange }: DragOrderEditorProps) {
  function addItem() {
    onChange([...items, ""]);
  }

  function updateItem(index: number, value: string) {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-secondary">
        Entrez les elements dans l&apos;ordre correct. Ils seront melanges pour le participant.
      </p>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-xs text-text-secondary w-5 shrink-0">{index + 1}.</span>
          <Input
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder={`Element ${index + 1}`}
            className="flex-1 bg-background border-border-default text-text-primary text-sm"
          />
          {items.length > 2 && (
            <button
              type="button"
              onClick={() => removeItem(index)}
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
        onClick={addItem}
        className="text-xs border-border-default text-text-secondary"
      >
        + Ajouter un element
      </Button>
    </div>
  );
}
