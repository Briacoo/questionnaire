"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScaleConfig } from "@/lib/types/database";

interface ScaleEditorProps {
  config: ScaleConfig;
  correctAnswer: number | null;
  onChange: (config: ScaleConfig, correctAnswer: number | null) => void;
}

export function ScaleEditor({ config, correctAnswer, onChange }: ScaleEditorProps) {
  function updateConfig(field: keyof ScaleConfig, value: string | number) {
    onChange({ ...config, [field]: value }, correctAnswer);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-secondary">Configurez l&apos;echelle de notation</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-text-secondary">Min</Label>
          <Input
            type="number"
            value={config.min}
            onChange={(e) => updateConfig("min", parseInt(e.target.value) || 0)}
            className="bg-background border-border-default text-text-primary text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-text-secondary">Max</Label>
          <Input
            type="number"
            value={config.max}
            onChange={(e) => updateConfig("max", parseInt(e.target.value) || 10)}
            className="bg-background border-border-default text-text-primary text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-text-secondary">Label min</Label>
          <Input
            value={config.minLabel}
            onChange={(e) => updateConfig("minLabel", e.target.value)}
            placeholder="Ex: Pas du tout"
            className="bg-background border-border-default text-text-primary text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-text-secondary">Label max</Label>
          <Input
            value={config.maxLabel}
            onChange={(e) => updateConfig("maxLabel", e.target.value)}
            placeholder="Ex: Tout a fait"
            className="bg-background border-border-default text-text-primary text-sm"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-text-secondary">Bonne reponse (optionnel)</Label>
        <Input
          type="number"
          value={correctAnswer ?? ""}
          onChange={(e) =>
            onChange(config, e.target.value ? parseInt(e.target.value) : null)
          }
          placeholder="Laisser vide si pas de bonne reponse"
          className="bg-background border-border-default text-text-primary text-sm"
        />
      </div>
    </div>
  );
}
