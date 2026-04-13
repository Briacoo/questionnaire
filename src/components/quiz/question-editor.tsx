"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { McqOptionsEditor } from "./options-editor-mcq";
import { TrueFalseEditor } from "./options-editor-true-false";
import { FreeTextEditor } from "./options-editor-free-text";
import { DragOrderEditor } from "./options-editor-drag-order";
import { MatchingEditor } from "./options-editor-matching";
import { ScaleEditor } from "./options-editor-scale";
import type { QuestionType, McqOption, MatchingPair, ScaleConfig } from "@/lib/types/database";

interface QuestionData {
  content: string;
  type: QuestionType;
  options: McqOption[] | MatchingPair[] | ScaleConfig | string[] | null;
  correct_answer: string | string[] | number | Record<string, string> | null;
  feedback: string;
  points: number;
}

function getDefaultData(type: QuestionType): QuestionData {
  const base = { content: "", feedback: "", points: 1 };
  switch (type) {
    case "mcq_single":
      return {
        ...base, type,
        options: [
          { id: crypto.randomUUID(), text: "" },
          { id: crypto.randomUUID(), text: "" },
        ] as McqOption[],
        correct_answer: "",
      };
    case "mcq_multiple":
      return {
        ...base, type,
        options: [
          { id: crypto.randomUUID(), text: "" },
          { id: crypto.randomUUID(), text: "" },
        ] as McqOption[],
        correct_answer: [] as string[],
      };
    case "true_false":
      return { ...base, type, options: null, correct_answer: "true" };
    case "free_text":
      return { ...base, type, options: null, correct_answer: "" };
    case "drag_order":
      return { ...base, type, options: ["", ""] as string[], correct_answer: null };
    case "matching":
      return {
        ...base, type,
        options: [
          { id: crypto.randomUUID(), left: "", right: "" },
          { id: crypto.randomUUID(), left: "", right: "" },
        ] as MatchingPair[],
        correct_answer: null,
      };
    case "scale":
      return {
        ...base, type,
        options: { min: 1, max: 10, minLabel: "", maxLabel: "", step: 1 } as ScaleConfig,
        correct_answer: null,
      };
  }
}

interface QuestionEditorProps {
  type: QuestionType;
  initialData?: QuestionData;
  onSave: (data: QuestionData) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function QuestionEditor({
  type,
  initialData,
  onSave,
  onCancel,
  saving = false,
}: QuestionEditorProps) {
  const [data, setData] = useState<QuestionData>(
    initialData ?? getDefaultData(type)
  );

  function handleSave() {
    if (!data.content.trim()) return;

    const finalData = { ...data };

    // Auto-generate correct_answer for drag_order (the order as entered by admin)
    if (type === "drag_order" && Array.isArray(data.options)) {
      finalData.correct_answer = data.options as string[];
    }

    // Auto-generate correct_answer for matching (each pair's id → right value)
    if (type === "matching" && Array.isArray(data.options)) {
      const pairs = data.options as MatchingPair[];
      const correctMap: Record<string, string> = {};
      for (const pair of pairs) {
        correctMap[pair.id] = pair.right;
      }
      finalData.correct_answer = correctMap as unknown as string[];
    }

    onSave(finalData);
  }

  return (
    <Card className="bg-surface border-border-default shadow-card">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-text-primary text-sm">Enonce de la question</Label>
          <Input
            value={data.content}
            onChange={(e) => setData({ ...data, content: e.target.value })}
            placeholder="Saisissez votre question..."
            className="bg-background border-border-default text-text-primary"
          />
        </div>

        {(type === "mcq_single" || type === "mcq_multiple") && (
          <McqOptionsEditor
            options={data.options as McqOption[]}
            correctAnswer={data.correct_answer as string | string[]}
            multiple={type === "mcq_multiple"}
            onChange={(options, correctAnswer) =>
              setData({ ...data, options, correct_answer: correctAnswer })
            }
          />
        )}

        {type === "true_false" && (
          <TrueFalseEditor
            correctAnswer={data.correct_answer as string}
            onChange={(correctAnswer) =>
              setData({ ...data, correct_answer: correctAnswer })
            }
          />
        )}

        {type === "free_text" && (
          <FreeTextEditor
            correctAnswer={data.correct_answer as string}
            onChange={(correctAnswer) =>
              setData({ ...data, correct_answer: correctAnswer })
            }
          />
        )}

        {type === "drag_order" && (
          <DragOrderEditor
            items={data.options as string[]}
            onChange={(items) => setData({ ...data, options: items })}
          />
        )}

        {type === "matching" && (
          <MatchingEditor
            pairs={data.options as MatchingPair[]}
            onChange={(pairs) => setData({ ...data, options: pairs })}
          />
        )}

        {type === "scale" && (
          <ScaleEditor
            config={data.options as ScaleConfig}
            correctAnswer={data.correct_answer as number | null}
            onChange={(config, correctAnswer) =>
              setData({ ...data, options: config, correct_answer: correctAnswer })
            }
          />
        )}

        <div className="space-y-2">
          <Label className="text-text-secondary text-xs">
            Feedback (optionnel — affiche apres la reponse)
          </Label>
          <Input
            value={data.feedback}
            onChange={(e) => setData({ ...data, feedback: e.target.value })}
            placeholder="Explication de la bonne reponse..."
            className="bg-background border-border-default text-text-primary text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-text-secondary text-xs">Points</Label>
          <Input
            type="number"
            min={1}
            value={data.points}
            onChange={(e) =>
              setData({ ...data, points: Math.max(1, parseInt(e.target.value) || 1) })
            }
            className="w-20 bg-background border-border-default text-text-primary text-sm"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-badge border-border-default text-text-primary"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !data.content.trim()}
            className="flex-1 rounded-badge bg-accent-blue hover:bg-accent-blue-secondary text-background font-semibold"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export type { QuestionData };
