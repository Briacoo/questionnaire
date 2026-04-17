"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BlockEditor } from "@/components/pages/block-editor";
import { BlockTypePicker } from "@/components/pages/block-type-picker";
import { BlockRenderer } from "@/components/pages/block-renderer";
import type {
  Page,
  Block,
  BlockType,
  HeadingBlockProps,
  TextBlockProps,
  ImageBlockProps,
  ButtonBlockProps,
  PageSettings,
} from "@/lib/types/database";
import { DEFAULT_PAGE_SETTINGS } from "@/lib/types/database";
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
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function createDefaultProps(type: BlockType): Block["props"] {
  switch (type) {
    case "heading":
      return { text: "", level: 1, align: "left", color: null } as HeadingBlockProps;
    case "text":
      return { html: "" } as TextBlockProps;
    case "image":
      return { src: "", alt: "", fullWidth: false } as ImageBlockProps;
    case "button":
      return {
        text: "Cliquez ici",
        action: "url",
        url: "",
        quizId: null,
        anchorBlockId: null,
        style: "primary",
        color: null,
      } as ButtonBlockProps;
  }
}

function SortableBlock({
  block,
  onChange,
  onDelete,
  quizzes,
}: {
  block: Block;
  onChange: (b: Block) => void;
  onDelete: () => void;
  quizzes: { id: string; title: string }[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <BlockEditor
        block={block}
        onChange={onChange}
        onDelete={onDelete}
        quizzes={quizzes}
        dragHandleProps={listeners}
      />
    </div>
  );
}

export default function PageEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: pageId } = use(params);
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [quizzes, setQuizzes] = useState<{ id: string; title: string }[]>([]);

  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    async function load() {
      const session = getSession();
      if (!session) return;

      const [pageRes, quizRes] = await Promise.all([
        supabase.from("pages").select("*").eq("id", pageId).single(),
        supabase
          .from("quizzes")
          .select("id, title")
          .eq("admin_id", session.user_id)
          .eq("status", "published"),
      ]);

      if (pageRes.data) {
        const p = pageRes.data as Page;
        setPage(p);
        setBlocks(p.blocks);
        setTitle(p.title);
      }

      if (quizRes.data) {
        setQuizzes(quizRes.data);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  const handleSave = useCallback(async () => {
    if (!page) return;
    setSaving(true);

    await supabase
      .from("pages")
      .update({
        title,
        blocks,
        updated_at: new Date().toISOString(),
      })
      .eq("id", page.id);

    setSaving(false);
  }, [page, title, blocks, supabase]);

  function addBlock(type: BlockType) {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      props: createDefaultProps(type),
    };
    setBlocks((prev) => [...prev, newBlock]);
    setShowPicker(false);
  }

  function updateBlock(index: number, updated: Block) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? updated : b)));
  }

  function deleteBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setBlocks((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === active.id);
      const newIndex = prev.findIndex((b) => b.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  const settings: PageSettings = page?.settings
    ? { ...DEFAULT_PAGE_SETTINGS, ...page.settings }
    : DEFAULT_PAGE_SETTINGS;

  if (!page) {
    return (
      <div className="px-4 pt-6">
        <p className="text-text-secondary">Chargement...</p>
      </div>
    );
  }

  if (preview) {
    return (
      <div
        className="min-h-dvh"
        style={{
          backgroundColor: settings.backgroundColor,
          fontFamily: settings.fontFamily,
        }}
      >
        <div className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-border-default px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-accent-blue uppercase tracking-wider">
            Preview
          </span>
          <Button
            onClick={() => setPreview(false)}
            size="sm"
            className="rounded-badge bg-accent-blue text-background text-xs"
          >
            Fermer
          </Button>
        </div>
        <div className="pt-14 px-4 pb-8 max-w-2xl mx-auto">
          {settings.logoUrl && (
            <div className="flex justify-center mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.logoUrl} alt="Logo" className="max-h-16" />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: `${settings.blockSpacing}px` }}>
            {blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} settings={settings} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push("/admin/pages")}
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          ← Pages
        </button>
        <div className="flex gap-2">
          <Button
            onClick={() => setPreview(true)}
            variant="outline"
            size="sm"
            className="rounded-badge border-border-default text-text-secondary text-xs"
          >
            Preview
          </Button>
          <Button
            onClick={() => router.push(`/admin/pages/${pageId}/settings`)}
            variant="outline"
            size="sm"
            className="rounded-badge border-border-default text-text-secondary text-xs"
          >
            Reglages
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="rounded-badge bg-accent-blue text-background text-xs font-semibold"
          >
            {saving ? "..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="mb-6">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la page"
          className="text-xl font-bold bg-transparent border-none text-text-primary placeholder:text-text-secondary focus-visible:ring-0 px-0"
        />
      </div>

      {/* Blocks */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {blocks.map((block, index) => (
              <SortableBlock
                key={block.id}
                block={block}
                onChange={(b) => updateBlock(index, b)}
                onDelete={() => deleteBlock(index)}
                quizzes={quizzes}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add block */}
      <div className="mt-4">
        {showPicker ? (
          <BlockTypePicker
            onSelect={addBlock}
            onCancel={() => setShowPicker(false)}
          />
        ) : (
          <button
            onClick={() => setShowPicker(true)}
            className="w-full py-3 rounded-card border-2 border-dashed border-border-default text-text-secondary hover:text-accent-blue hover:border-accent-blue/50 transition-colors text-sm font-medium"
          >
            + Ajouter un bloc
          </button>
        )}
      </div>
    </div>
  );
}
