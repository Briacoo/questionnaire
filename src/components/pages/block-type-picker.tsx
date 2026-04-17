"use client";

import type { BlockType } from "@/lib/types/database";

interface BlockTypePickerProps {
  onSelect: (type: BlockType) => void;
  onCancel: () => void;
}

const BLOCK_TYPES: { type: BlockType; label: string; description: string; icon: string }[] = [
  { type: "heading", label: "Titre", description: "H1, H2 ou H3", icon: "H" },
  { type: "text", label: "Texte", description: "Editeur riche WYSIWYG", icon: "T" },
  { type: "image", label: "Image", description: "Upload ou URL externe", icon: "🖼" },
  { type: "button", label: "Bouton", description: "Lien, quiz ou ancre", icon: "▶" },
  { type: "video", label: "Video", description: "YouTube, Vimeo ou upload", icon: "🎬" },
  { type: "pdf", label: "PDF", description: "Viewer ou telechargement", icon: "📄" },
  { type: "carousel", label: "Carousel", description: "Galerie d'images", icon: "🎠" },
  { type: "banner", label: "Banniere", description: "Image + texte overlay", icon: "🏞" },
  { type: "quiz", label: "Quiz", description: "Integrer un questionnaire", icon: "❓" },
  { type: "section", label: "Section", description: "Colonnes imbriquees", icon: "▦" },
];

export function BlockTypePicker({ onSelect, onCancel }: BlockTypePickerProps) {
  return (
    <div className="rounded-card border border-border-default bg-surface p-4 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-text-primary">Ajouter un bloc</h3>
        <button onClick={onCancel} className="text-xs text-text-secondary hover:text-text-primary">
          Annuler
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {BLOCK_TYPES.map(({ type, label, description, icon }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="flex items-center gap-3 rounded-card border border-border-default bg-background p-3 hover:bg-white/5 transition-colors text-left"
          >
            <span className="text-lg w-8 h-8 flex items-center justify-center rounded bg-accent-blue/10 text-accent-blue font-bold">
              {icon}
            </span>
            <div>
              <p className="text-sm font-medium text-text-primary">{label}</p>
              <p className="text-xs text-text-secondary">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
