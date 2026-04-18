"use client";

import type { VideoChoiceOption } from "@/lib/types/database";

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

interface VideoChoiceInputProps {
  options: VideoChoiceOption[];
  value?: string | null;
  onChange: (val: string) => void;
}

export function VideoChoiceInput({ options, value, onChange }: VideoChoiceInputProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((opt) => {
        const isSelected = value === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`rounded-card border-2 overflow-hidden transition-colors text-left ${
              isSelected ? "border-accent-blue" : "border-border-default hover:border-border-strong"
            }`}
          >
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              {opt.provider === "youtube" && opt.url ? (() => {
                const videoId = getYouTubeId(opt.url);
                return videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface text-text-secondary text-xs">URL invalide</div>
                );
              })() : opt.provider === "vimeo" && opt.url ? (() => {
                const videoId = getVimeoId(opt.url);
                return videoId ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${videoId}`}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface text-text-secondary text-xs">URL invalide</div>
                );
              })() : opt.url ? (
                <video src={opt.url} controls className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-surface text-text-secondary text-xs">Pas de video</div>
              )}
            </div>
            <div className={`px-3 py-2 text-sm font-medium ${isSelected ? "text-accent-blue" : "text-text-primary"}`}>
              {opt.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
