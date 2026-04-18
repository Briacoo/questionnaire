"use client";

import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { HotspotZone } from "@/lib/types/database";

interface HotspotEditorProps {
  mediaUrl: string | null;
  zones: HotspotZone[];
  onMediaUrlChange: (url: string | null) => void;
  onZonesChange: (zones: HotspotZone[]) => void;
}

export function HotspotEditor({ mediaUrl, zones, onMediaUrlChange, onZonesChange }: HotspotEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [radius, setRadius] = useState(5);
  const imgRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onZonesChange([...zones, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, radius }]);
  }, [zones, radius, onZonesChange]);

  function removeZone(index: number) {
    onZonesChange(zones.filter((_, i) => i !== index));
  }

  async function handleUpload(file: File) {
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `quiz-hotspot/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("page-images").upload(path, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from("page-images").getPublicUrl(path);
      onMediaUrlChange(urlData.publicUrl);
    }
    setUploading(false);
  }

  return (
    <div className="space-y-3">
      <Label className="text-text-primary text-sm">Image du hotspot</Label>

      {!mediaUrl ? (
        <label className="flex items-center justify-center w-full h-40 border-2 border-dashed border-border-default rounded-card cursor-pointer hover:border-accent-blue/50 transition-colors">
          <span className="text-sm text-text-secondary">{uploading ? "Upload..." : "Cliquez pour uploader une image"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }} />
        </label>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Label className="text-text-secondary text-xs">Rayon de tolerance (%)</Label>
            <Input
              type="number"
              min={1}
              max={25}
              value={radius}
              onChange={(e) => setRadius(Math.max(1, Math.min(25, parseInt(e.target.value) || 5)))}
              className="w-20 bg-background border-border-default text-text-primary text-sm"
            />
          </div>

          <p className="text-xs text-text-secondary">Cliquez sur l&apos;image pour placer un point correct</p>

          <div ref={imgRef} className="relative cursor-crosshair border border-border-default rounded-lg overflow-hidden" onClick={handleClick}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl} alt="" className="w-full" />
            {zones.map((zone, i) => (
              <div
                key={i}
                className="absolute border-2 border-green-500 rounded-full bg-green-500/20"
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.radius * 2}%`,
                  height: `${zone.radius * 2}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeZone(i); }}
                  className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">{zones.length} zone(s) placee(s)</span>
            <button type="button" onClick={() => onMediaUrlChange(null)} className="text-xs text-red-400 hover:underline ml-auto">
              Changer l&apos;image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
