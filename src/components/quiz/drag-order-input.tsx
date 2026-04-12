"use client";

import { useState, useEffect } from "react";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableItemProps {
  id: string;
  label: string;
  position: number;
}

function SortableItem({ id, label, position }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-card border p-3 transition-colors ${
        isDragging
          ? "border-accent-blue bg-accent-blue/10 shadow-lg z-10"
          : "border-border-default bg-surface"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none text-text-secondary hover:text-text-primary cursor-grab active:cursor-grabbing"
        aria-label="Deplacer"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="text-xs text-text-secondary">{position}.</span>
      <span className="text-sm text-text-primary">{label}</span>
    </div>
  );
}

interface DragOrderInputProps {
  options: string[];
  value?: string[];
  onChange: (value: string[]) => void;
}

export function DragOrderInput({ options, value, onChange }: DragOrderInputProps) {
  // Shuffle on first render if no value yet
  const [items] = useState<string[]>(() => {
    if (value && value.length > 0) return value;
    return [...options].sort(() => Math.random() - 0.5);
  });

  const currentItems = value && value.length > 0 ? value : items;

  // Set initial value
  useEffect(() => {
    if (!value || value.length === 0) {
      onChange(items);
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentItems.indexOf(active.id as string);
      const newIndex = currentItems.indexOf(over.id as string);
      const newOrder = arrayMove(currentItems, oldIndex, newIndex);
      onChange(newOrder);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={currentItems} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {currentItems.map((item, i) => (
            <SortableItem key={item} id={item} label={item} position={i + 1} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
