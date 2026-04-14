"use client";

import { useState } from "react";
import type {
  Block,
  BlockType,
  HeadingBlockProps,
  TextBlockProps,
  ImageBlockProps,
  ButtonBlockProps,
} from "@/lib/types/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "./tiptap-editor";

interface BlockEditorProps {
  block: Block;
  onChange: (block: Block) => void;
  onDelete: () => void;
  quizzes?: { id: string; title: string }[];
}

function HeadingEditor({
  props,
  onChange,
}: {
  props: HeadingBlockProps;
  onChange: (p: HeadingBlockProps) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-text-secondary">Texte du titre</Label>
        <Input
          value={props.text}
          onChange={(e) => onChange({ ...props, text: e.target.value })}
          className="mt-1 bg-background border-border-default text-text-primary"
          placeholder="Mon titre..."
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <Label className="text-xs text-text-secondary">Niveau</Label>
          <div className="flex gap-1 mt-1">
            {([1, 2, 3] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onChange({ ...props, level: lvl })}
                className={`px-3 py-1.5 text-xs rounded-badge font-medium transition-colors ${
                  props.level === lvl
                    ? "bg-accent-blue text-background"
                    : "bg-background border border-border-default text-text-secondary"
                }`}
              >
                H{lvl}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <Label className="text-xs text-text-secondary">Alignement</Label>
          <div className="flex gap-1 mt-1">
            {(["left", "center", "right"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => onChange({ ...props, align: a })}
                className={`px-3 py-1.5 text-xs rounded-badge font-medium transition-colors ${
                  props.align === a
                    ? "bg-accent-blue text-background"
                    : "bg-background border border-border-default text-text-secondary"
                }`}
              >
                {a === "left" ? "⫷" : a === "center" ? "⫶" : "⫸"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <Label className="text-xs text-text-secondary">Couleur (optionnel)</Label>
        <div className="flex gap-2 mt-1 items-center">
          <Input
            type="color"
            value={props.color || "#ffffff"}
            onChange={(e) => onChange({ ...props, color: e.target.value })}
            className="w-10 h-8 p-0.5 bg-background border-border-default cursor-pointer"
          />
          <Input
            value={props.color || ""}
            onChange={(e) => onChange({ ...props, color: e.target.value || null })}
            placeholder="#ffffff"
            className="flex-1 bg-background border-border-default text-text-primary text-xs"
          />
          {props.color && (
            <button
              type="button"
              onClick={() => onChange({ ...props, color: null })}
              className="text-xs text-text-secondary hover:text-red-400"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TextEditor({
  props,
  onChange,
}: {
  props: TextBlockProps;
  onChange: (p: TextBlockProps) => void;
}) {
  return (
    <TiptapEditor
      content={props.html}
      onChange={(html) => onChange({ html })}
    />
  );
}

function ImageEditor({
  props,
  onChange,
}: {
  props: ImageBlockProps;
  onChange: (p: ImageBlockProps) => void;
}) {
  const [mode, setMode] = useState<"url" | "upload">(props.src ? "url" : "url");
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `pages/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("page-images")
        .upload(path, file, { upsert: true });

      if (error) {
        alert("Erreur upload: " + error.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("page-images")
        .getPublicUrl(path);

      onChange({ ...props, src: urlData.publicUrl });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`px-3 py-1.5 text-xs rounded-badge font-medium transition-colors ${
            mode === "url"
              ? "bg-accent-blue text-background"
              : "bg-background border border-border-default text-text-secondary"
          }`}
        >
          URL externe
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`px-3 py-1.5 text-xs rounded-badge font-medium transition-colors ${
            mode === "upload"
              ? "bg-accent-blue text-background"
              : "bg-background border border-border-default text-text-secondary"
          }`}
        >
          Upload
        </button>
      </div>

      {mode === "url" ? (
        <div>
          <Label className="text-xs text-text-secondary">URL de l&apos;image</Label>
          <Input
            value={props.src}
            onChange={(e) => onChange({ ...props, src: e.target.value })}
            placeholder="https://..."
            className="mt-1 bg-background border-border-default text-text-primary text-xs"
          />
        </div>
      ) : (
        <div>
          <Label className="text-xs text-text-secondary">Fichier image</Label>
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            className="mt-1 text-xs text-text-secondary file:mr-2 file:px-3 file:py-1 file:rounded-badge file:border-0 file:bg-accent-blue file:text-background file:text-xs file:font-medium file:cursor-pointer"
          />
          {uploading && (
            <p className="text-xs text-accent-blue mt-1">Upload en cours...</p>
          )}
        </div>
      )}

      {props.src && (
        <div className="rounded-card border border-border-default overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={props.src}
            alt={props.alt}
            className="max-h-40 w-full object-contain bg-black/20"
          />
        </div>
      )}

      <div>
        <Label className="text-xs text-text-secondary">Texte alternatif</Label>
        <Input
          value={props.alt}
          onChange={(e) => onChange({ ...props, alt: e.target.value })}
          placeholder="Description de l'image"
          className="mt-1 bg-background border-border-default text-text-primary text-xs"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={props.fullWidth}
          onChange={(e) => onChange({ ...props, fullWidth: e.target.checked })}
          className="accent-accent-blue"
        />
        <span className="text-xs text-text-secondary">Pleine largeur</span>
      </label>
    </div>
  );
}

function ButtonEditor({
  props,
  onChange,
  quizzes,
}: {
  props: ButtonBlockProps;
  onChange: (p: ButtonBlockProps) => void;
  quizzes?: { id: string; title: string }[];
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-text-secondary">Texte du bouton</Label>
        <Input
          value={props.text}
          onChange={(e) => onChange({ ...props, text: e.target.value })}
          placeholder="Cliquez ici"
          className="mt-1 bg-background border-border-default text-text-primary"
        />
      </div>

      <div>
        <Label className="text-xs text-text-secondary">Action</Label>
        <div className="flex gap-1 mt-1">
          {(["url", "quiz", "anchor"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onChange({ ...props, action: a })}
              className={`px-3 py-1.5 text-xs rounded-badge font-medium transition-colors ${
                props.action === a
                  ? "bg-accent-blue text-background"
                  : "bg-background border border-border-default text-text-secondary"
              }`}
            >
              {a === "url" ? "Lien externe" : a === "quiz" ? "Quiz" : "Ancre"}
            </button>
          ))}
        </div>
      </div>

      {props.action === "url" && (
        <div>
          <Label className="text-xs text-text-secondary">URL</Label>
          <Input
            value={props.url}
            onChange={(e) => onChange({ ...props, url: e.target.value })}
            placeholder="https://..."
            className="mt-1 bg-background border-border-default text-text-primary text-xs"
          />
        </div>
      )}

      {props.action === "quiz" && (
        <div>
          <Label className="text-xs text-text-secondary">Quiz</Label>
          <select
            value={props.quizId || ""}
            onChange={(e) => onChange({ ...props, quizId: e.target.value || null })}
            className="mt-1 w-full rounded-card border border-border-default bg-background text-text-primary text-xs px-3 py-2"
          >
            <option value="">-- Choisir un quiz --</option>
            {(quizzes || []).map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {props.action === "anchor" && (
        <div>
          <Label className="text-xs text-text-secondary">ID du bloc cible</Label>
          <Input
            value={props.anchorBlockId || ""}
            onChange={(e) => onChange({ ...props, anchorBlockId: e.target.value || null })}
            placeholder="block-id"
            className="mt-1 bg-background border-border-default text-text-primary text-xs"
          />
        </div>
      )}

      <div>
        <Label className="text-xs text-text-secondary">Style</Label>
        <div className="flex gap-1 mt-1">
          {(["primary", "outline"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ ...props, style: s })}
              className={`px-3 py-1.5 text-xs rounded-badge font-medium transition-colors ${
                props.style === s
                  ? "bg-accent-blue text-background"
                  : "bg-background border border-border-default text-text-secondary"
              }`}
            >
              {s === "primary" ? "Plein" : "Contour"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs text-text-secondary">Couleur (optionnel)</Label>
        <div className="flex gap-2 mt-1 items-center">
          <Input
            type="color"
            value={props.color || "#60a5fa"}
            onChange={(e) => onChange({ ...props, color: e.target.value })}
            className="w-10 h-8 p-0.5 bg-background border-border-default cursor-pointer"
          />
          <Input
            value={props.color || ""}
            onChange={(e) => onChange({ ...props, color: e.target.value || null })}
            placeholder="#60a5fa"
            className="flex-1 bg-background border-border-default text-text-primary text-xs"
          />
          {props.color && (
            <button
              type="button"
              onClick={() => onChange({ ...props, color: null })}
              className="text-xs text-text-secondary hover:text-red-400"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  heading: "Titre",
  text: "Texte",
  image: "Image",
  button: "Bouton",
};

export function BlockEditor({ block, onChange, onDelete, quizzes }: BlockEditorProps) {
  function updateProps(newProps: Block["props"]) {
    onChange({ ...block, props: newProps });
  }

  return (
    <div className="rounded-card border border-border-default bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="cursor-grab text-text-secondary hover:text-text-primary">⠿</span>
          <span className="text-xs font-semibold text-accent-blue uppercase tracking-wider">
            {BLOCK_TYPE_LABELS[block.type]}
          </span>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-text-secondary hover:text-red-400 transition-colors"
        >
          Supprimer
        </button>
      </div>

      {block.type === "heading" && (
        <HeadingEditor
          props={block.props as HeadingBlockProps}
          onChange={(p) => updateProps(p)}
        />
      )}
      {block.type === "text" && (
        <TextEditor
          props={block.props as TextBlockProps}
          onChange={(p) => updateProps(p)}
        />
      )}
      {block.type === "image" && (
        <ImageEditor
          props={block.props as ImageBlockProps}
          onChange={(p) => updateProps(p)}
        />
      )}
      {block.type === "button" && (
        <ButtonEditor
          props={block.props as ButtonBlockProps}
          onChange={(p) => updateProps(p)}
          quizzes={quizzes}
        />
      )}
    </div>
  );
}
