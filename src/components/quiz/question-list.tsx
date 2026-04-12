"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { QuestionItem } from "./question-item";
import type { Question } from "@/lib/types/database";

interface QuestionListProps {
  questions: Question[];
  onReorder: (oldIndex: number, newIndex: number) => void;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
}

export function QuestionList({
  questions,
  onReorder,
  onEdit,
  onDelete,
}: QuestionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    onReorder(oldIndex, newIndex);
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-card border border-border-default bg-surface p-6 text-center">
        <p className="text-text-secondary text-sm">Aucune question.</p>
        <p className="text-text-secondary text-xs mt-1">
          Appuyez sur + pour ajouter une question.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={questions.map((q) => q.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {questions.map((question, index) => (
            <QuestionItem
              key={question.id}
              question={question}
              index={index}
              onEdit={() => onEdit(question)}
              onDelete={() => onDelete(question.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
