"use client";

import { useState } from "react";
import type { Question, McqOption, ScaleConfig, MatchingPair, ImageMcqOption, CategorizeConfig, NumericConfig, VideoChoiceOption } from "@/lib/types/database";
import { DragOrderInput } from "./drag-order-input";
import { MatchingInput } from "./matching-input";
import { CategorizeInput } from "./categorize-input";
import { HotspotInput } from "./hotspot-input";
import { VideoChoiceInput } from "./video-choice-input";

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
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary">
            Question {index + 1} / {total}
          </span>
          <span className="text-xs text-text-secondary">
            {question.points} pt{question.points > 1 ? "s" : ""}
          </span>
        </div>
        {question.type === "drag_order" && (
          <p className="text-xs text-text-secondary mt-1">
            Maintenez et glissez pour reordonner
          </p>
        )}
        {question.type === "matching" && (
          <p className="text-xs text-text-secondary mt-1">
            Associez chaque element a sa correspondance
          </p>
        )}
        {question.type === "categorize" && (
          <p className="text-xs text-text-secondary mt-1">
            Triez les elements dans les bonnes categories
          </p>
        )}
        {question.type === "hotspot" && (
          <p className="text-xs text-text-secondary mt-1">
            Cliquez sur la bonne zone de l&apos;image
          </p>
        )}
      </div>

      <h2 className="text-lg font-semibold text-text-primary">
        {question.content}
      </h2>

      {(question.type === "mcq_single" || question.type === "mcq_multiple") && (
        <div className="space-y-2">
          {(question.options as McqOption[]).map((opt) => {
            const isSelected = question.type === "mcq_multiple"
              ? (Array.isArray(selectedAnswer) ? selectedAnswer : []).includes(opt.id)
              : selectedAnswer === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (question.type === "mcq_multiple") {
                    const arr = Array.isArray(selectedAnswer) ? selectedAnswer : [];
                    setSelectedAnswer(
                      arr.includes(opt.id)
                        ? arr.filter((id: string) => id !== opt.id)
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
        <DragOrderInput
          options={question.options as string[]}
          value={Array.isArray(selectedAnswer) ? selectedAnswer as string[] : undefined}
          onChange={(val) => setSelectedAnswer(val)}
        />
      )}

      {question.type === "matching" && (
        <MatchingInput
          pairs={question.options as MatchingPair[]}
          value={selectedAnswer && typeof selectedAnswer === "object" && !Array.isArray(selectedAnswer) ? selectedAnswer as Record<string, string> : undefined}
          onChange={(val) => setSelectedAnswer(val)}
        />
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
              value={typeof selectedAnswer === "number" ? selectedAnswer : config.min}
              onChange={(e) => setSelectedAnswer(parseInt(e.target.value))}
              className="w-full accent-accent-blue"
            />
            <div className="text-center text-sm text-text-primary">
              {typeof selectedAnswer === "number" ? selectedAnswer : config.min}
            </div>
          </div>
        );
      })()}

      {question.type === "image_mcq" && (
        <div className="space-y-3">
          {question.media_url && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={question.media_url} alt="" className="max-h-64 rounded-lg" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {(question.options as ImageMcqOption[]).map((opt) => {
              const isSelected = selectedAnswer === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedAnswer(opt.id)}
                  className={`rounded-card border-2 p-2 text-left transition-colors ${
                    isSelected ? "border-accent-blue bg-accent-blue/10" : "border-border-default hover:border-border-strong"
                  }`}
                >
                  {opt.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={opt.imageUrl} alt="" className="w-full h-24 object-cover rounded mb-1" />
                  )}
                  <span className="text-sm text-text-primary">{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {question.type === "hotspot" && question.media_url && (
        <HotspotInput
          imageUrl={question.media_url}
          value={selectedAnswer as { x: number; y: number } | null}
          onChange={(val) => setSelectedAnswer(val)}
        />
      )}

      {question.type === "categorize" && (
        <CategorizeInput
          config={question.options as CategorizeConfig}
          value={(selectedAnswer && typeof selectedAnswer === "object" && !Array.isArray(selectedAnswer)) ? selectedAnswer as Record<string, string> : {}}
          onChange={(val) => setSelectedAnswer(val)}
        />
      )}

      {question.type === "numeric" && (() => {
        const config = question.options as NumericConfig;
        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={selectedAnswer !== null && selectedAnswer !== undefined ? String(selectedAnswer) : ""}
              onChange={(e) => setSelectedAnswer(e.target.value === "" ? null : parseFloat(e.target.value))}
              placeholder="Votre reponse..."
              className="w-40 rounded-lg border border-border-default bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            />
            {config.unit && <span className="text-sm text-text-secondary">{config.unit}</span>}
          </div>
        );
      })()}

      {question.type === "video_choice" && (
        <VideoChoiceInput
          options={question.options as VideoChoiceOption[]}
          value={selectedAnswer as string | null}
          onChange={(val) => setSelectedAnswer(val)}
        />
      )}
    </div>
  );
}
