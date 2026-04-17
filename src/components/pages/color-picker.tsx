"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const PRESET_COLORS = [
  "#ffffff", "#e5e5e5", "#a3a3a3", "#737373", "#404040", "#171717", "#000000",
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981",
  "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#d946ef", "#ec4899", "#f43f5e",
  "#fca5a5", "#fdba74", "#fcd34d", "#fde047", "#bef264", "#86efac", "#6ee7b7",
  "#5eead4", "#67e8f9", "#7dd3fc", "#93c5fd", "#a5b4fc", "#c4b5fd", "#d8b4fe",
  "#f0abfc", "#f9a8d4", "#fda4af",
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

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

  const handleHexChange = useCallback(
    (hex: string) => {
      setHexInput(hex);
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
        onChange(hex);
      }
    },
    [onChange]
  );

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label className="text-xs text-text-secondary block mb-1">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-badge border border-border-default bg-background hover:border-accent-blue/50 transition-colors"
      >
        <span
          className="w-5 h-5 rounded-full border border-white/20 shrink-0"
          style={{ backgroundColor: value }}
        />
        <span className="text-xs text-text-primary font-mono uppercase">
          {value}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 p-3 rounded-card border border-border-default bg-surface shadow-lg w-[260px]">
          {/* Preset grid */}
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setHexInput(color);
                }}
                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  value.toLowerCase() === color.toLowerCase()
                    ? "border-accent-blue scale-110"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          {/* Native color input for fine-grained picking */}
          <div className="mb-3">
            <input
              type="color"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setHexInput(e.target.value);
              }}
              className="w-full h-8 rounded cursor-pointer border-0 bg-transparent"
              style={{ padding: 0 }}
            />
          </div>

          {/* Hex input */}
          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded border border-white/20 shrink-0"
              style={{ backgroundColor: value }}
            />
            <div className="flex items-center flex-1 rounded border border-border-default bg-background px-2">
              <span className="text-xs text-text-secondary">#</span>
              <input
                type="text"
                value={hexInput.replace("#", "")}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
                  handleHexChange(`#${val}`);
                }}
                onBlur={() => {
                  if (!/^#[0-9a-fA-F]{6}$/.test(hexInput)) {
                    setHexInput(value);
                  }
                }}
                className="flex-1 bg-transparent text-text-primary text-xs font-mono py-1.5 px-1 focus:outline-none uppercase"
                maxLength={6}
                placeholder="000000"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface OptionalColorPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
  defaultColor: string;
  label?: string;
}

export function OptionalColorPicker({
  value,
  onChange,
  defaultColor,
  label,
}: OptionalColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value || defaultColor);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexInput(value || defaultColor);
  }, [value, defaultColor]);

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

  const handleHexChange = useCallback(
    (hex: string) => {
      setHexInput(hex);
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
        onChange(hex);
      }
    },
    [onChange]
  );

  const currentColor = value || defaultColor;

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label className="text-xs text-text-secondary block mb-1">{label}</label>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-badge border border-border-default bg-background hover:border-accent-blue/50 transition-colors"
        >
          <span
            className="w-5 h-5 rounded-full border border-white/20 shrink-0"
            style={{ backgroundColor: currentColor }}
          />
          <span className="text-xs text-text-primary font-mono uppercase">
            {currentColor}
          </span>
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-text-secondary hover:text-red-400"
          >
            Reset
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-2 p-3 rounded-card border border-border-default bg-surface shadow-lg w-[260px]">
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setHexInput(color);
                }}
                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  currentColor.toLowerCase() === color.toLowerCase()
                    ? "border-accent-blue scale-110"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          <div className="mb-3">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => {
                onChange(e.target.value);
                setHexInput(e.target.value);
              }}
              className="w-full h-8 rounded cursor-pointer border-0 bg-transparent"
              style={{ padding: 0 }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded border border-white/20 shrink-0"
              style={{ backgroundColor: currentColor }}
            />
            <div className="flex items-center flex-1 rounded border border-border-default bg-background px-2">
              <span className="text-xs text-text-secondary">#</span>
              <input
                type="text"
                value={hexInput.replace("#", "")}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
                  handleHexChange(`#${val}`);
                }}
                onBlur={() => {
                  if (!/^#[0-9a-fA-F]{6}$/.test(hexInput)) {
                    setHexInput(currentColor);
                  }
                }}
                className="flex-1 bg-transparent text-text-primary text-xs font-mono py-1.5 px-1 focus:outline-none uppercase"
                maxLength={6}
                placeholder="000000"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
