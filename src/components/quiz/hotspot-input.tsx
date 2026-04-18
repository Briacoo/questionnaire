"use client";

import { useRef, useCallback } from "react";

interface HotspotInputProps {
  imageUrl: string;
  value?: { x: number; y: number } | null;
  onChange: (val: { x: number; y: number }) => void;
}

export function HotspotInput({ imageUrl, value, onChange }: HotspotInputProps) {
  const imgRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onChange({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }, [onChange]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-secondary">Cliquez sur l&apos;image pour repondre</p>
      <div ref={imgRef} className="relative cursor-crosshair border border-border-default rounded-lg overflow-hidden" onClick={handleClick}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="w-full" />
        {value && (
          <div
            className="absolute w-6 h-6 border-3 border-accent-blue rounded-full bg-accent-blue/30 pointer-events-none"
            style={{
              left: `${value.x}%`,
              top: `${value.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
      </div>
    </div>
  );
}
