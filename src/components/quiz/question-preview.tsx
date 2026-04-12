"use client";

import { useState } from "react";
import type { Question, McqOption, ScaleConfig, MatchingPair } from "@/lib/types/database";

interface QuestionPreviewProps {
  question: Question;
  index: number;
  total: number;
  selectedAnswer?: unknown;
  onAnswerChange?: (answer: unknown) => void;
}

export function QuestionPreview({
  question,
  index,
  total,
  selectedAnswer: externalAnswer,
  onAnswerChange,
}: QuestionPreviewProps) {
  const [internalAnswer, setInternalAnswer] = useState<unknown>(null);

  const selectedAnswer = externalAnswer !== undefined ? externalAnswer : internalAnswer;
  const setSelectedAnswer = (val: unknown) => {
    if (onAnswerChange) {
      onAnswerChange(val);
    } else {
      setInternalAnswer(val);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">
          Question {index + 1} / {total}
        </span>
        <span className="text-xs text-text-secondary">
          {question.points} pt{question.points > 1 ? "s" : ""}
        </span>
      </div>

      <h2 className="text-lg font-semibold text-text-primary">
        {question.content}
      </h2>

      {(question.type === "mcq_single" || question.type === "mcq_multiple") && (
        <div className="space-y-2">
          {(question.options as McqOption[]).map((opt) => {
            const isSelected = question.type === "mcq_multiple"
              ? ((selectedAnswer as string[]) || []).includes(opt.id)
              : selectedAnswer === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (question.type === "mcq_multiple") {
                    const arr = (selectedAnswer as string[]) || [];
                    setSelectedAnswer(
                      arr.includes(opt.id)
                        ? arr.filter((id) => id !== opt.id)
                        : [...arr, opt.id]
                    );
                  } else {
                    setSelectedAnswer(opt.id);
                  }
                }}
                className={`w-full text-left rounded-card border p-3 text-sm transition-colors ${
                  isSelected
                    ? "border-accent-blue bg-accent-blue/10 text-text-primary"
                    : "border-border-default text-text-secondary hover:border-border-strong"
                }`}
              >
                {opt.text}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "true_false" && (
        <div className="flex gap-3">
          {["Vrai", "Faux"].map((label, i) => {
            const value = i === 0 ? "true" : "false";
            return (
              <button
                key={value}
                onClick={() => setSelectedAnswer(value)}
                className={`flex-1 rounded-card border p-3 text-center text-sm font-medium transition-colors ${
                  selectedAnswer === value
                    ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                    : "border-border-default text-text-secondary"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "free_text" && (
        <textarea
          value={(selectedAnswer as string) || ""}
          onChange={(e) => setSelectedAnswer(e.target.value)}
          placeholder="Votre reponse..."
          rows={3}
          className="w-full rounded-lg border border-border-default bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        />
      )}

      {question.type === "drag_order" && (
        <div className="space-y-2">
          {(question.options as string[]).map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-card border border-border-default p-3"
            >
              <span className="text-xs text-text-secondary">{i + 1}.</span>
              <span className="text-sm text-text-primary">{item}</span>
            </div>
          ))}
          <p className="text-xs text-text-secondary italic">
            (Les elements seront melanges et deplacables dans la version finale)
          </p>
        </div>
      )}

      {question.type === "matching" && (
        <div className="space-y-2">
          {(question.options as MatchingPair[]).map((pair) => (
            <div
              key={pair.id}
              className="flex items-center gap-2 rounded-card border border-border-default p-3"
            >
              <span className="text-sm text-text-primary flex-1">{pair.left}</span>
              <span className="text-text-secondary">→</span>
              <span className="text-sm text-text-primary flex-1">{pair.right}</span>
            </div>
          ))}
          <p className="text-xs text-text-secondary italic">
            (Les paires seront melangees dans la version finale)
          </p>
        </div>
      )}

      {question.type === "scale" && (() => {
        const config = question.options as ScaleConfig;
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-text-secondary">
              <span>{config.minLabel || config.min}</span>
              <span>{config.maxLabel || config.max}</span>
            </div>
            <input
              type="range"
              min={config.min}
              max={config.max}
              step={config.step}
              value={(selectedAnswer as number) ?? config.min}
              onChange={(e) => setSelectedAnswer(parseInt(e.target.value))}
              className="w-full accent-accent-blue"
            />
            <div className="text-center text-sm text-text-primary">
              {(selectedAnswer as number) ?? config.min}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
