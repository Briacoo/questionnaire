"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { ImageMcqOption } from "@/lib/types/database";

interface ImageMcqEditorProps {
  options: ImageMcqOption[];
  correctAnswer: string | string[];
  multiple: boolean;
  onChange: (options: ImageMcqOption[], correctAnswer: string | string[]) => void;
}

export function ImageMcqEditor({ options, correctAnswer, multiple, onChange }: ImageMcqEditorProps) {
  const [uploading, setUploading] = useState<string | null>(null);

  function addOption() {
    const newOpt: ImageMcqOption = { id: crypto.randomUUID(), text: "", imageUrl: null };
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

  function updateOption(id: string, field: "text" | "imageUrl", value: string | null) {
    onChange(
      options.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
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

  async function handleImageUpload(optionId: string, file: File) {
    setUploading(optionId);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `quiz-options/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("page-images").upload(path, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from("page-images").getPublicUrl(path);
      updateOption(optionId, "imageUrl", urlData.publicUrl);
    }
    setUploading(null);
  }

  return (
    <div className="space-y-3">
      <Label className="text-text-primary text-sm">
        Options {multiple ? "(plusieurs bonnes reponses)" : "(une seule bonne reponse)"}
      </Label>
      {options.map((opt) => {
        const isCorrect = multiple
          ? (Array.isArray(correctAnswer) && correctAnswer.includes(opt.id))
          : correctAnswer === opt.id;

        return (
          <div key={opt.id} className="flex flex-col gap-2 rounded-card border border-border-default p-3">
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
                value={opt.text}
                onChange={(e) => updateOption(opt.id, "text", e.target.value)}
                placeholder="Texte de l'option..."
                className="bg-background border-border-default text-text-primary text-sm flex-1"
              />
              {options.length > 2 && (
                <button type="button" onClick={() => removeOption(opt.id)} className="text-text-secondary hover:text-red-400 text-sm">
                  ✕
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 pl-7">
              {opt.imageUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={opt.imageUrl} alt="" className="w-16 h-16 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => updateOption(opt.id, "imageUrl", null)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer text-xs text-accent-blue hover:underline">
                  {uploading === opt.id ? "Upload..." : "+ Image (optionnel)"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(opt.id, file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={addOption} className="rounded-badge border-border-default text-text-secondary text-xs">
        + Ajouter une option
      </Button>
    </div>
  );
}
