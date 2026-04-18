"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { VideoChoiceOption } from "@/lib/types/database";

function detectProvider(url: string): "youtube" | "vimeo" | "upload" {
  if (/youtu\.?be/.test(url)) return "youtube";
  if (/vimeo\.com/.test(url)) return "vimeo";
  return "upload";
}

interface VideoChoiceEditorProps {
  options: VideoChoiceOption[];
  correctAnswer: string | string[];
  multiple: boolean;
  onChange: (options: VideoChoiceOption[], correctAnswer: string | string[]) => void;
}

export function VideoChoiceEditor({ options, correctAnswer, multiple, onChange }: VideoChoiceEditorProps) {
  const [uploading, setUploading] = useState<string | null>(null);

  function addOption() {
    if (options.length >= 4) return;
    const label = `Video ${String.fromCharCode(65 + options.length)}`;
    const newOpt: VideoChoiceOption = { id: crypto.randomUUID(), label, url: "", provider: "youtube" };
    onChange([...options, newOpt], correctAnswer);
  }

  function removeOption(id: string) {
    if (options.length <= 2) return;
    const filtered = options.filter((o) => o.id !== id);
    if (multiple) {
      const ca = Array.isArray(correctAnswer) ? correctAnswer.filter((a) => a !== id) : [];
      onChange(filtered, ca);
    } else {
      onChange(filtered, correctAnswer === id ? "" : correctAnswer);
    }
  }

  function updateOption(id: string, updates: Partial<VideoChoiceOption>) {
    onChange(
      options.map((o) => (o.id === id ? { ...o, ...updates } : o)),
      correctAnswer
    );
  }

  function toggleCorrect(id: string) {
    if (multiple) {
      const arr = Array.isArray(correctAnswer) ? correctAnswer : [];
      onChange(options, arr.includes(id) ? arr.filter((a) => a !== id) : [...arr, id]);
    } else {
      onChange(options, id);
    }
  }

  async function handleVideoUpload(optionId: string, file: File) {
    setUploading(optionId);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `quiz-videos/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("page-images").upload(path, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from("page-images").getPublicUrl(path);
      updateOption(optionId, { url: urlData.publicUrl, provider: "upload" });
    }
    setUploading(null);
  }

  return (
    <div className="space-y-3">
      <Label className="text-text-primary text-sm">
        Videos {multiple ? "(plusieurs bonnes reponses)" : "(une seule bonne reponse)"}
      </Label>
      {options.map((opt) => {
        const isCorrect = multiple
          ? (Array.isArray(correctAnswer) && correctAnswer.includes(opt.id))
          : correctAnswer === opt.id;

        return (
          <div key={opt.id} className="rounded-card border border-border-default p-3 space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleCorrect(opt.id)}
                className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                  isCorrect ? "border-green-500 bg-green-500" : "border-border-default"
                }`}
              >
                {isCorrect && <span className="text-white text-xs">✓</span>}
              </button>
              <Input
                value={opt.label}
                onChange={(e) => updateOption(opt.id, { label: e.target.value })}
                placeholder="Label..."
                className="bg-background border-border-default text-text-primary text-sm w-32"
              />
              {options.length > 2 && (
                <button type="button" onClick={() => removeOption(opt.id)} className="text-text-secondary hover:text-red-400 text-sm ml-auto">
                  ✕
                </button>
              )}
            </div>
            <div className="pl-7 space-y-2">
              <Input
                value={opt.url}
                onChange={(e) => {
                  const url = e.target.value;
                  updateOption(opt.id, { url, provider: detectProvider(url) });
                }}
                placeholder="URL YouTube, Vimeo, ou uploadez..."
                className="bg-background border-border-default text-text-primary text-sm"
              />
              <div className="flex items-center gap-2">
                <label className="cursor-pointer text-xs text-accent-blue hover:underline">
                  {uploading === opt.id ? "Upload..." : "Ou uploader un fichier"}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVideoUpload(opt.id, file);
                    }}
                  />
                </label>
                {opt.provider !== "upload" && opt.url && (
                  <span className="text-xs text-text-secondary capitalize">{opt.provider}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {options.length < 4 && (
        <Button type="button" variant="outline" size="sm" onClick={addOption} className="rounded-badge border-border-default text-text-secondary text-xs">
          + Ajouter une video
        </Button>
      )}
    </div>
  );
}
