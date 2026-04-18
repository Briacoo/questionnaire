"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Question, QuestionType } from "@/lib/types/database";

const typeLabels: Record<QuestionType, string> = {
  mcq_single: "QCM unique",
  mcq_multiple: "QCM multiple",
  true_false: "Vrai/Faux",
  free_text: "Texte libre",
  drag_order: "Ordonner",
  matching: "Association",
  scale: "Echelle",
  image_mcq: "QCM image",
  hotspot: "Hotspot",
  categorize: "Categorisation",
  numeric: "Numerique",
  video_choice: "Choix video",
};

interface QuestionItemProps {
  question: Question;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function QuestionItem({ question, index, onEdit, onDelete }: QuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-card border border-border-default bg-surface p-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab touch-none text-text-secondary hover:text-text-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>

      <button onClick={onEdit} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">{index + 1}.</span>
          <span className="text-sm font-medium text-text-primary truncate">
            {question.content || "Question sans titre"}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-text-secondary">
            {typeLabels[question.type]}
          </span>
          <span className="text-xs text-text-secondary">
            · {question.points} pt{question.points > 1 ? "s" : ""}
          </span>
        </div>
      </button>

      <button
        onClick={onDelete}
        className="shrink-0 text-text-secondary hover:text-red-400"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>
    </div>
  );
}
