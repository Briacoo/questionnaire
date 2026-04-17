"use client";

import { useState } from "react";
import type {
  Block,
  BlockType,
  HeadingBlockProps,
  TextBlockProps,
  ImageBlockProps,
  ButtonBlockProps,
  VideoBlockProps,
  PdfBlockProps,
  CarouselBlockProps,
  BannerBlockProps,
  QuizBlockProps,
  SectionBlockProps,
} from "@/lib/types/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "./tiptap-editor";
import { OptionalColorPicker } from "./color-picker";

interface BlockEditorProps {
  block: Block;
  onChange: (block: Block) => void;
  onDelete: () => void;
  quizzes?: { id: string; title: string }[];
  dragHandleProps?: Record<string, unknown>;
}

/* ─── Heading ─── */
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
      <OptionalColorPicker
        value={props.color}
        onChange={(color) => onChange({ ...props, color })}
        defaultColor="#ffffff"
        label="Couleur (optionnel)"
      />
    </div>
  );
}

/* ─── Text ─── */
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

/* ─── Image ─── */
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
      const { error } = await supabase.storage.from("page-images").upload(path, file, { upsert: true });
      if (error) { alert("Erreur upload: " + error.message); return; }
      const { data: urlData } = supabase.storage.from("page-images").getPublicUrl(path);
      onChange({ ...props, src: urlData.publicUrl });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {(["url", "upload"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`px-3 py-1.5 text-xs rounded-badge font-medium transition-colors ${mode === m ? "bg-accent-blue text-background" : "bg-background border border-border-default text-text-secondary"}`}>
            {m === "url" ? "URL externe" : "Upload"}
          </button>
        ))}
      </div>
      {mode === "url" ? (
        <div>
          <Label className="text-xs text-text-secondary">URL de l&apos;image</Label>
          <Input value={props.src} onChange={(e) => onChange({ ...props, src: e.target.value })} placeholder="https://..." className="mt-1 bg-background border-border-default text-text-primary text-xs" />
        </div>
      ) : (
        <div>
          <Label className="text-xs text-text-secondary">Fichier image</Label>
          <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
            className="mt-1 text-xs text-text-secondary file:mr-2 file:px-3 file:py-1 file:rounded-badge file:border-0 file:bg-accent-blue file:text-background file:text-xs file:font-medium file:cursor-pointer" />
          {uploading && <p className="text-xs text-accent-blue mt-1">Upload en cours...</p>}
        </div>
      )}
      {props.src && (
        <div className="rounded-card border border-border-default overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={props.src} alt={props.alt} className="max-h-40 w-full object-contain bg-black/20" />
        </div>
      )}
      <div>
        <Label className="text-xs text-text-secondary">Texte alternatif</Label>
        <Input value={props.alt} onChange={(e) => onChange({ ...props, alt: e.target.value })} placeholder="Description de l'image" className="mt-1 bg-background border-border-default text-text-primary text-xs" />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={props.fullWidth} onChange={(e) => onChange({ ...props, fullWidth: e.target.checked })} className="accent-accent-blue" />
        <span className="text-xs text-text-secondary">Pleine largeur</span>
      </label>
    </div>
  );
}

/* ─── Button ─── */
function ButtonEditor({
  props, onChange, quizzes,
}: {
  props: ButtonBlockProps;
  onChange: (p: ButtonBlockProps) => void;
  quizzes?: { id: string; title: string }[];
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-text-secondary">Texte du bouton</Label>
        <Input value={props.text} onChange={(e) => onChange({ ...props, text: e.target.value })} placeholder="Cliquez ici" className="mt-1 bg-background border-border-default text-text-primary" />
      </div>
      <div>
        <Label className="text-xs text-text-secondary">Action</Label>
        <div className="flex gap-1 mt-1">
          {(["url", "quiz", "anchor"] as const).map((a) => (
            <button key={a} type="button" onClick={() => onChange({ ...props, action: a })}
              className={`px-3 py-1.5 text-xs rounded-badge font-medium transition-colors ${props.action === a ? "bg-accent-blue text-background" : "bg-background border border-border-default text-text-secondary"}`}>
              {a === "url" ? "Lien externe" : a === "quiz" ? "Quiz" : "Ancre"}
            </button>
          ))}
        </div>
      </div>
      {props.action === "url" && (
        <div>
          <Label className="text-xs text-text-secondary">URL</Label>
          <Input value={props.url} onChange={(e) => onChange({ ...props, url: e.target.value })} placeholder="https://..." className="mt-1 bg-background border-border-default text-text-primary text-xs" />
        </div>
      )}
      {props.action === "quiz" && (
        <div>
          <Label className="text-xs text-text-secondary">Quiz</Label>
          <select value={props.quizId || ""} onChange={(e) => onChange({ ...props, quizId: e.target.value || null })}
            className="mt-1 w-full rounded-card border border-border-default bg-background text-text-primary text-xs px-3 py-2">
            <option value="">-- Choisir un quiz --</option>
            {(quizzes || []).map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
          </select>
        </div>
      )}
      {props.action === "anchor" && (
        <div>
          <Label className="text-xs text-text-secondary">ID du bloc cible</Label>
          <Input value={props.anchorBlockId || ""} onChange={(e) => onChange({ ...props, anchorBlockId: e.target.value || null })} placeholder="block-id" className="mt-1 bg-background border-border-default text-text-primary text-xs" />
        </div>
      )}
      <div>
        <Label className="text-xs text-text-secondary">Style</Label>
        <div className="flex gap-1 mt-1">
          {(["primary", "outline"] as const).map((s) => (
            <button key={s} type="button" onClick={() => onChange({ ...props, style: s })}
              className={`px-3 py-1.5 text-xs rounded-badge font-medium transition-colors ${props.style === s ? "bg-accent-blue text-background" : "bg-background border border-border-default text-text-secondary"}`}>
              {s === "primary" ? "Plein" : "Contour"}
            </button>
          ))}
        </div>
      </div>
      <OptionalColorPicker value={props.color} onChange={(color) => onChange({ ...props, color })} defaultColor="#60a5fa" label="Couleur (optionnel)" />
    </div>
  );
}

/* ─── Video ─── */
function VideoEditor({
  props, onChange,
}: {
  props: VideoBlockProps;
  onChange: (p: VideoBlockProps) => void;
}) {
  const [uploading, setUploading] = useState(false);

  function detectProvider(url: string): VideoBlockProps["provider"] {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("vimeo.com")) return "vimeo";
    return "upload";
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `videos/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("page-images").upload(path, file, { upsert: true });
      if (error) { alert("Erreur upload: " + error.message); return; }
      const { data: urlData } = supabase.storage.from("page-images").getPublicUrl(path);
      onChange({ ...props, url: urlData.publicUrl, provider: "upload" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-text-secondary">URL de la video (YouTube, Vimeo)</Label>
        <Input
          value={props.provider !== "upload" ? props.url : ""}
          onChange={(e) => onChange({ ...props, url: e.target.value, provider: detectProvider(e.target.value) })}
          placeholder="https://youtube.com/watch?v=..."
          className="mt-1 bg-background border-border-default text-text-primary text-xs"
        />
      </div>
      <div className="text-center text-xs text-text-secondary">ou</div>
      <div>
        <Label className="text-xs text-text-secondary">Upload une video</Label>
        <input type="file" accept="video/*" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          className="mt-1 text-xs text-text-secondary file:mr-2 file:px-3 file:py-1 file:rounded-badge file:border-0 file:bg-accent-blue file:text-background file:text-xs file:font-medium file:cursor-pointer" />
        {uploading && <p className="text-xs text-accent-blue mt-1">Upload en cours...</p>}
      </div>
      {props.url && (
        <p className="text-xs text-green-400">Source : {props.provider}</p>
      )}
      <div>
        <Label className="text-xs text-text-secondary">Legende (optionnel)</Label>
        <Input value={props.caption} onChange={(e) => onChange({ ...props, caption: e.target.value })} placeholder="Description..." className="mt-1 bg-background border-border-default text-text-primary text-xs" />
      </div>
    </div>
  );
}

/* ─── PDF ─── */
function PdfEditor({
  props, onChange,
}: {
  props: PdfBlockProps;
  onChange: (p: PdfBlockProps) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const path = `pdfs/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("page-images").upload(path, file, { upsert: true });
      if (error) { alert("Erreur upload: " + error.message); return; }
      const { data: urlData } = supabase.storage.from("page-images").getPublicUrl(path);
      onChange({ ...props, url: urlData.publicUrl, fileName: file.name });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-text-secondary">URL du PDF ou upload</Label>
        <Input value={props.url} onChange={(e) => onChange({ ...props, url: e.target.value })} placeholder="https://..." className="mt-1 bg-background border-border-default text-text-primary text-xs" />
      </div>
      <div>
        <input type="file" accept=".pdf" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          className="text-xs text-text-secondary file:mr-2 file:px-3 file:py-1 file:rounded-badge file:border-0 file:bg-accent-blue file:text-background file:text-xs file:font-medium file:cursor-pointer" />
        {uploading && <p className="text-xs text-accent-blue mt-1">Upload en cours...</p>}
      </div>
      <div>
        <Label className="text-xs text-text-secondary">Nom du fichier</Label>
        <Input value={props.fileName} onChange={(e) => onChange({ ...props, fileName: e.target.value })} placeholder="document.pdf" className="mt-1 bg-background border-border-default text-text-primary text-xs" />
      </div>
      <div>
        <Label className="text-xs text-text-secondary">Affichage</Label>
        <div className="flex gap-1 mt-1">
          {(["embed", "link"] as const).map((m) => (
            <button key={m} type="button" onClick={() => onChange({ ...props, displayMode: m })}
              className={`px-3 py-1.5 text-xs rounded-badge font-medium transition-colors ${props.displayMode === m ? "bg-accent-blue text-background" : "bg-background border border-border-default text-text-secondary"}`}>
              {m === "embed" ? "Viewer integre" : "Lien de telechargement"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Carousel ─── */
function CarouselEditor({
  props, onChange,
}: {
  props: CarouselBlockProps;
  onChange: (p: CarouselBlockProps) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `carousel/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("page-images").upload(path, file, { upsert: true });
      if (error) { alert("Erreur upload: " + error.message); return; }
      const { data: urlData } = supabase.storage.from("page-images").getPublicUrl(path);
      onChange({ ...props, images: [...props.images, { src: urlData.publicUrl, alt: "" }] });
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    onChange({ ...props, images: props.images.filter((_, i) => i !== index) });
  }

  function updateImageAlt(index: number, alt: string) {
    const updated = [...props.images];
    updated[index] = { ...updated[index], alt };
    onChange({ ...props, images: updated });
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-text-secondary">Images ({props.images.length})</Label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {props.images.map((img, i) => (
            <div key={i} className="relative group rounded border border-border-default overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} className="w-full h-20 object-cover" />
              <button type="button" onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                ✕
              </button>
              <input type="text" value={img.alt} onChange={(e) => updateImageAlt(i, e.target.value)} placeholder="Alt..."
                className="w-full text-[10px] bg-black/60 text-white px-1 py-0.5 absolute bottom-0 left-0 right-0" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <input type="file" accept="image/*" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          className="text-xs text-text-secondary file:mr-2 file:px-3 file:py-1 file:rounded-badge file:border-0 file:bg-accent-blue file:text-background file:text-xs file:font-medium file:cursor-pointer" />
        {uploading && <p className="text-xs text-accent-blue">Upload...</p>}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={props.autoPlay} onChange={(e) => onChange({ ...props, autoPlay: e.target.checked })} className="accent-accent-blue" />
        <span className="text-xs text-text-secondary">Lecture automatique</span>
      </label>
      {props.autoPlay && (
        <div>
          <Label className="text-xs text-text-secondary">Intervalle ({props.interval}s)</Label>
          <input type="range" min={2} max={15} value={props.interval} onChange={(e) => onChange({ ...props, interval: Number(e.target.value) })} className="w-full accent-accent-blue" />
        </div>
      )}
    </div>
  );
}

/* ─── Banner ─── */
function BannerEditor({
  props, onChange,
}: {
  props: BannerBlockProps;
  onChange: (p: BannerBlockProps) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `banners/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("page-images").upload(path, file, { upsert: true });
      if (error) { alert("Erreur upload: " + error.message); return; }
      const { data: urlData } = supabase.storage.from("page-images").getPublicUrl(path);
      onChange({ ...props, imageUrl: urlData.publicUrl });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-text-secondary">Image de fond</Label>
        <Input value={props.imageUrl} onChange={(e) => onChange({ ...props, imageUrl: e.target.value })} placeholder="https://..." className="mt-1 bg-background border-border-default text-text-primary text-xs" />
        <input type="file" accept="image/*" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          className="mt-1 text-xs text-text-secondary file:mr-2 file:px-3 file:py-1 file:rounded-badge file:border-0 file:bg-accent-blue file:text-background file:text-xs file:font-medium file:cursor-pointer" />
        {uploading && <p className="text-xs text-accent-blue mt-1">Upload...</p>}
      </div>
      {props.imageUrl && (
        <div className="rounded-card border border-border-default overflow-hidden relative" style={{ height: 120 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={props.imageUrl} alt="" className="w-full h-full object-cover" />
          {props.overlay && <div className="absolute inset-0" style={{ backgroundColor: props.overlayColor, opacity: props.overlayOpacity / 100 }} />}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-white font-bold text-sm">{props.title || "Titre"}</p>
            <p className="text-white/70 text-xs">{props.subtitle}</p>
          </div>
        </div>
      )}
      <div>
        <Label className="text-xs text-text-secondary">Titre</Label>
        <Input value={props.title} onChange={(e) => onChange({ ...props, title: e.target.value })} placeholder="Titre de la banniere" className="mt-1 bg-background border-border-default text-text-primary" />
      </div>
      <div>
        <Label className="text-xs text-text-secondary">Sous-titre</Label>
        <Input value={props.subtitle} onChange={(e) => onChange({ ...props, subtitle: e.target.value })} placeholder="Sous-titre..." className="mt-1 bg-background border-border-default text-text-primary text-xs" />
      </div>
      <div>
        <Label className="text-xs text-text-secondary">Alignement</Label>
        <div className="flex gap-1 mt-1">
          {(["left", "center", "right"] as const).map((a) => (
            <button key={a} type="button" onClick={() => onChange({ ...props, align: a })}
              className={`px-3 py-1.5 text-xs rounded-badge font-medium transition-colors ${props.align === a ? "bg-accent-blue text-background" : "bg-background border border-border-default text-text-secondary"}`}>
              {a === "left" ? "⫷" : a === "center" ? "⫶" : "⫸"}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={props.overlay} onChange={(e) => onChange({ ...props, overlay: e.target.checked })} className="accent-accent-blue" />
        <span className="text-xs text-text-secondary">Overlay sombre</span>
      </label>
      {props.overlay && (
        <div>
          <Label className="text-xs text-text-secondary">Opacite ({props.overlayOpacity}%)</Label>
          <input type="range" min={10} max={90} value={props.overlayOpacity} onChange={(e) => onChange({ ...props, overlayOpacity: Number(e.target.value) })} className="w-full accent-accent-blue" />
        </div>
      )}
      <div>
        <Label className="text-xs text-text-secondary">Hauteur ({props.height}px)</Label>
        <input type="range" min={150} max={600} step={10} value={props.height} onChange={(e) => onChange({ ...props, height: Number(e.target.value) })} className="w-full accent-accent-blue" />
      </div>
    </div>
  );
}

/* ─── Quiz embed ─── */
function QuizEditor({
  props, onChange, quizzes,
}: {
  props: QuizBlockProps;
  onChange: (p: QuizBlockProps) => void;
  quizzes?: { id: string; title: string }[];
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-text-secondary">Quiz</Label>
        <select value={props.quizId || ""} onChange={(e) => {
          const qId = e.target.value || null;
          const quiz = quizzes?.find((q) => q.id === qId);
          onChange({ ...props, quizId: qId, title: quiz?.title || props.title });
        }}
          className="mt-1 w-full rounded-card border border-border-default bg-background text-text-primary text-xs px-3 py-2">
          <option value="">-- Choisir un quiz --</option>
          {(quizzes || []).map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
        </select>
      </div>
      <div>
        <Label className="text-xs text-text-secondary">Titre affiche</Label>
        <Input value={props.title} onChange={(e) => onChange({ ...props, title: e.target.value })} placeholder="Titre du quiz" className="mt-1 bg-background border-border-default text-text-primary text-xs" />
      </div>
      <div>
        <Label className="text-xs text-text-secondary">Description</Label>
        <Input value={props.description} onChange={(e) => onChange({ ...props, description: e.target.value })} placeholder="Testez vos connaissances..." className="mt-1 bg-background border-border-default text-text-primary text-xs" />
      </div>
      <div>
        <Label className="text-xs text-text-secondary">Style</Label>
        <div className="flex gap-1 mt-1">
          {(["embedded", "link"] as const).map((s) => (
            <button key={s} type="button" onClick={() => onChange({ ...props, style: s })}
              className={`px-3 py-1.5 text-xs rounded-badge font-medium transition-colors ${props.style === s ? "bg-accent-blue text-background" : "bg-background border border-border-default text-text-secondary"}`}>
              {s === "embedded" ? "Integre dans la page" : "Lien vers le quiz"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Section (colonnes imbriquées) ─── */
function SectionEditor({
  props, onChange, quizzes,
}: {
  props: SectionBlockProps;
  onChange: (p: SectionBlockProps) => void;
  quizzes?: { id: string; title: string }[];
}) {
  function updateColumn(colIndex: number, blocks: Block[]) {
    const newChildren = [...props.children];
    newChildren[colIndex] = blocks;
    onChange({ ...props, children: newChildren });
  }

  function addBlockToColumn(colIndex: number, type: BlockType) {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      props: getDefaultPropsForType(type),
    };
    const newChildren = [...props.children];
    newChildren[colIndex] = [...newChildren[colIndex], newBlock];
    onChange({ ...props, children: newChildren });
  }

  function removeBlockFromColumn(colIndex: number, blockIndex: number) {
    const newChildren = [...props.children];
    newChildren[colIndex] = newChildren[colIndex].filter((_, i) => i !== blockIndex);
    onChange({ ...props, children: newChildren });
  }

  function setColumns(count: 1 | 2 | 3) {
    const newChildren: Block[][] = [];
    for (let i = 0; i < count; i++) {
      newChildren.push(props.children[i] || []);
    }
    onChange({ ...props, columns: count, children: newChildren });
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-text-secondary">Colonnes</Label>
        <div className="flex gap-1 mt-1">
          {([1, 2, 3] as const).map((n) => (
            <button key={n} type="button" onClick={() => setColumns(n)}
              className={`px-3 py-1.5 text-xs rounded-badge font-medium transition-colors ${props.columns === n ? "bg-accent-blue text-background" : "bg-background border border-border-default text-text-secondary"}`}>
              {n} col.
            </button>
          ))}
        </div>
      </div>

      <OptionalColorPicker value={props.backgroundColor} onChange={(c) => onChange({ ...props, backgroundColor: c })} defaultColor="#111111" label="Fond de section" />

      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${props.columns}, 1fr)` }}>
        {Array.from({ length: props.columns }).map((_, colIdx) => (
          <div key={colIdx} className="rounded border border-dashed border-border-default p-2 space-y-2">
            <p className="text-[10px] text-text-secondary text-center uppercase">Col {colIdx + 1}</p>
            {(props.children[colIdx] || []).map((block, blockIdx) => (
              <div key={block.id} className="rounded bg-background border border-border-default p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-accent-blue uppercase font-semibold">{BLOCK_TYPE_LABELS[block.type] || block.type}</span>
                  <button type="button" onClick={() => removeBlockFromColumn(colIdx, blockIdx)} className="text-[10px] text-red-400">✕</button>
                </div>
                <BlockEditor
                  block={block}
                  onChange={(b) => {
                    const newCol = [...(props.children[colIdx] || [])];
                    newCol[blockIdx] = b;
                    updateColumn(colIdx, newCol);
                  }}
                  onDelete={() => removeBlockFromColumn(colIdx, blockIdx)}
                  quizzes={quizzes}
                />
              </div>
            ))}
            <select
              value=""
              onChange={(e) => { if (e.target.value) addBlockToColumn(colIdx, e.target.value as BlockType); }}
              className="w-full text-xs rounded border border-border-default bg-background text-text-secondary px-2 py-1"
            >
              <option value="">+ Ajouter...</option>
              {(["heading", "text", "image", "button", "video", "pdf"] as BlockType[]).map((t) => (
                <option key={t} value={t}>{BLOCK_TYPE_LABELS[t] || t}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function getDefaultPropsForType(type: BlockType): Block["props"] {
  const defaults: Record<BlockType, Block["props"]> = {
    heading: { text: "", level: 1, align: "left", color: null } as HeadingBlockProps,
    text: { html: "" } as TextBlockProps,
    image: { src: "", alt: "", fullWidth: false } as ImageBlockProps,
    button: { text: "Cliquez ici", action: "url", url: "", quizId: null, anchorBlockId: null, style: "primary", color: null } as ButtonBlockProps,
    video: { url: "", provider: "youtube", caption: "" } as VideoBlockProps,
    pdf: { url: "", fileName: "", displayMode: "embed" } as PdfBlockProps,
    carousel: { images: [], autoPlay: false, interval: 5 } as CarouselBlockProps,
    banner: { imageUrl: "", title: "", subtitle: "", overlay: true, overlayColor: "#000000", overlayOpacity: 50, height: 300, align: "center" } as BannerBlockProps,
    quiz: { quizId: null, title: "", description: "", style: "link" } as QuizBlockProps,
    section: { columns: 2, gap: 16, children: [[], []], backgroundColor: null, padding: 16 } as SectionBlockProps,
  };
  return defaults[type];
}

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  heading: "Titre",
  text: "Texte",
  image: "Image",
  button: "Bouton",
  video: "Video",
  pdf: "PDF",
  carousel: "Carousel",
  banner: "Banniere",
  quiz: "Quiz",
  section: "Section",
};

export function BlockEditor({ block, onChange, onDelete, quizzes, dragHandleProps }: BlockEditorProps) {
  function updateProps(newProps: Block["props"]) {
    onChange({ ...block, props: newProps });
  }

  return (
    <div className="rounded-card border border-border-default bg-surface p-4 pl-10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {dragHandleProps && (
            <span className="cursor-grab active:cursor-grabbing text-text-secondary hover:text-text-primary" {...dragHandleProps}>
              ⠿
            </span>
          )}
          <span className="text-xs font-semibold text-accent-blue uppercase tracking-wider">
            {BLOCK_TYPE_LABELS[block.type]}
          </span>
        </div>
        <button type="button" onClick={onDelete} className="text-xs text-text-secondary hover:text-red-400 transition-colors">
          Supprimer
        </button>
      </div>

      {block.type === "heading" && <HeadingEditor props={block.props as HeadingBlockProps} onChange={(p) => updateProps(p)} />}
      {block.type === "text" && <TextEditor props={block.props as TextBlockProps} onChange={(p) => updateProps(p)} />}
      {block.type === "image" && <ImageEditor props={block.props as ImageBlockProps} onChange={(p) => updateProps(p)} />}
      {block.type === "button" && <ButtonEditor props={block.props as ButtonBlockProps} onChange={(p) => updateProps(p)} quizzes={quizzes} />}
      {block.type === "video" && <VideoEditor props={block.props as VideoBlockProps} onChange={(p) => updateProps(p)} />}
      {block.type === "pdf" && <PdfEditor props={block.props as PdfBlockProps} onChange={(p) => updateProps(p)} />}
      {block.type === "carousel" && <CarouselEditor props={block.props as CarouselBlockProps} onChange={(p) => updateProps(p)} />}
      {block.type === "banner" && <BannerEditor props={block.props as BannerBlockProps} onChange={(p) => updateProps(p)} />}
      {block.type === "quiz" && <QuizEditor props={block.props as QuizBlockProps} onChange={(p) => updateProps(p)} quizzes={quizzes} />}
      {block.type === "section" && <SectionEditor props={block.props as SectionBlockProps} onChange={(p) => updateProps(p)} quizzes={quizzes} />}
    </div>
  );
}
