"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";

interface QuizPublishDialogProps {
  quizId: string;
  quizTitle: string;
  onClose: () => void;
}

export function QuizPublishDialog({
  quizId,
  quizTitle,
  onClose,
}: QuizPublishDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const quizUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/q/${quizId}`
      : `/q/${quizId}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, quizUrl, {
        width: 200,
        margin: 2,
        color: { dark: "#f0f0f0", light: "#0D0D0F" },
      });
    }
  }, [quizUrl]);

  async function copyLink() {
    await navigator.clipboard.writeText(quizUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-card bg-surface border border-border-default shadow-card p-6">
        <h2 className="text-lg font-bold text-text-primary text-center mb-1">
          Quiz publie
        </h2>
        <p className="text-xs text-text-secondary text-center mb-4">
          {quizTitle}
        </p>

        <div className="flex justify-center mb-4">
          <canvas ref={canvasRef} />
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border-default bg-background p-2 mb-4">
          <span className="flex-1 text-xs text-text-secondary truncate">
            {quizUrl}
          </span>
          <Button
            onClick={copyLink}
            size="sm"
            variant="outline"
            className="shrink-0 rounded-badge border-border-default text-text-primary text-xs"
          >
            {copied ? "Copie !" : "Copier"}
          </Button>
        </div>

        <Button
          onClick={onClose}
          className="w-full rounded-badge bg-accent-blue hover:bg-accent-blue-secondary text-background font-semibold"
        >
          Fermer
        </Button>
      </div>
    </div>
  );
}
