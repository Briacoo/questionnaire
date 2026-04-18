"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NumericConfig } from "@/lib/types/database";

interface NumericEditorProps {
  config: NumericConfig;
  onChange: (config: NumericConfig) => void;
}

export function NumericEditor({ config, onChange }: NumericEditorProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-text-primary text-sm">Reponse correcte</Label>
        <Input
          type="number"
          value={config.correctValue}
          onChange={(e) => onChange({ ...config, correctValue: parseFloat(e.target.value) || 0 })}
          placeholder="Ex: 20"
          className="bg-background border-border-default text-text-primary text-sm w-40"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-text-secondary text-xs">Tolerance (±)</Label>
        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-sm">±</span>
          <Input
            type="number"
            min={0}
            step={0.1}
            value={config.tolerance}
            onChange={(e) => onChange({ ...config, tolerance: Math.max(0, parseFloat(e.target.value) || 0) })}
            placeholder="0"
            className="bg-background border-border-default text-text-primary text-sm w-24"
          />
          <span className="text-xs text-text-secondary">
            (accepte {config.correctValue - config.tolerance} a {config.correctValue + config.tolerance})
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-text-secondary text-xs">Unite (optionnel)</Label>
        <Input
          value={config.unit || ""}
          onChange={(e) => onChange({ ...config, unit: e.target.value || null })}
          placeholder="Ex: °C, IBU, %, L..."
          className="bg-background border-border-default text-text-primary text-sm w-40"
        />
      </div>
    </div>
  );
}
