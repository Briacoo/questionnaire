"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useState, useRef, useEffect } from "react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const QUICK_COLORS = [
  "#ffffff", "#e5e5e5", "#a3a3a3", "#737373", "#000000",
  "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#06b6d4", "#d946ef",
];

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 text-xs rounded transition-colors ${
        active ? "bg-accent-blue text-background" : "text-text-secondary hover:text-text-primary hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

function ColorDropdown({
  onSelect,
  currentColor,
  trigger,
  title,
}: {
  onSelect: (color: string) => void;
  currentColor: string | null;
  trigger: React.ReactNode;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const [pos, setPos] = useState<{ v: "down" | "up"; h: "left" | "right" }>({ v: "down", h: "left" });
  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({
      v: window.innerHeight - rect.bottom < 220 ? "up" : "down",
      h: window.innerWidth - rect.left < 216 ? "right" : "left",
    });
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title={title}
        className="px-2 py-1 text-xs rounded transition-colors text-text-secondary hover:text-text-primary hover:bg-white/5 flex items-center gap-1"
      >
        {trigger}
        {currentColor && (
          <span
            className="w-2.5 h-2.5 rounded-full border border-white/30"
            style={{ backgroundColor: currentColor }}
          />
        )}
      </button>

      {open && (
        <div className={`absolute z-50 ${pos.v === "up" ? "bottom-full mb-1" : "top-full mt-1"} ${pos.h === "right" ? "right-0" : "left-0"} p-2 rounded-card border border-border-default bg-surface shadow-lg w-[200px]`}>
          <div className="grid grid-cols-5 gap-1 mb-2">
            {QUICK_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onSelect(color);
                  setOpen(false);
                }}
                className={`w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform ${
                  currentColor === color ? "border-accent-blue" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <div className="flex items-center flex-1 rounded border border-border-default bg-background px-1.5">
              <span className="text-xs text-text-secondary">#</span>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && hexInput.length === 6) {
                    onSelect(`#${hexInput}`);
                    setOpen(false);
                    setHexInput("");
                  }
                }}
                className="flex-1 bg-transparent text-text-primary text-xs font-mono py-1 px-0.5 focus:outline-none uppercase w-0"
                maxLength={6}
                placeholder="hex"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (hexInput.length === 6) {
                  onSelect(`#${hexInput}`);
                  setOpen(false);
                  setHexInput("");
                }
              }}
              className="px-2 py-1 text-xs rounded bg-accent-blue text-background"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Commencez a ecrire..." }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none min-h-[120px] px-3 py-2 focus:outline-none text-text-primary text-sm",
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const url = prompt("URL du lien :");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
  }, [editor]);

  if (!editor) return null;

  const currentTextColor = editor.getAttributes("textStyle")?.color || null;

  return (
    <div className="rounded-card border border-border-default bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 border-b border-border-default p-1.5 bg-surface">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Gras"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italique"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Souligne"
        >
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Barre"
        >
          <s>S</s>
        </ToolbarButton>

        <span className="w-px bg-border-default mx-1" />

        <ToolbarButton
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Titre 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Titre 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Titre 3"
        >
          H3
        </ToolbarButton>

        <span className="w-px bg-border-default mx-1" />

        <ToolbarButton
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Aligner a gauche"
        >
          ⫷
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Centrer"
        >
          ⫶
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Aligner a droite"
        >
          ⫸
        </ToolbarButton>

        <span className="w-px bg-border-default mx-1" />

        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Liste a puces"
        >
          •
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Liste numerotee"
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Citation"
        >
          &ldquo;
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Bloc de code"
        >
          {"</>"}
        </ToolbarButton>

        <span className="w-px bg-border-default mx-1" />

        <ColorDropdown
          onSelect={(color) => editor.chain().focus().setColor(color).run()}
          currentColor={currentTextColor}
          trigger={<span>A</span>}
          title="Couleur du texte"
        />
        <ColorDropdown
          onSelect={(color) => editor.chain().focus().setHighlight({ color }).run()}
          currentColor={null}
          trigger={<span>🖍</span>}
          title="Couleur de fond"
        />
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={setLink}
          title="Lien"
        >
          🔗
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Separateur"
        >
          ―
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
}
