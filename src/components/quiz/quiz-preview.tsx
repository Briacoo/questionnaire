"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuestionPreview } from "./question-preview";
import type { Question } from "@/lib/types/database";

interface QuizPreviewProps {
  title: string;
  questions: Question[];
  onClose: () => void;
}

export function QuizPreview({ title, questions, onClose }: QuizPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-card bg-surface border border-border-default p-6 text-center">
          <p className="text-text-secondary">Aucune question a previsualiser.</p>
          <Button onClick={onClose} className="mt-4 rounded-badge bg-accent-blue text-background">
            Fermer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <span className="text-sm font-semibold text-text-primary">{title}</span>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="h-1 bg-[#222]">
        <div
          className="h-full bg-accent-blue transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-auto px-4 py-6">
        <QuestionPreview
          question={questions[currentIndex]}
          index={currentIndex}
          total={questions.length}
        />
      </div>

      <div className="flex items-center justify-between border-t border-border-default px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="rounded-badge border-border-default text-text-primary"
        >
          Precedent
        </Button>
        <span className="text-xs text-text-secondary">
          {currentIndex + 1} / {questions.length}
        </span>
        {currentIndex < questions.length - 1 ? (
          <Button
            size="sm"
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="rounded-badge bg-accent-blue text-background"
          >
            Suivant
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onClose}
            className="rounded-badge bg-accent-blue text-background"
          >
            Terminer
          </Button>
        )}
      </div>
    </div>
  );
}
