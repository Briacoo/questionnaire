"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import QRCode from "qrcode";

interface QrCodeDialogProps {
  quizId: string;
  quizTitle: string;
  isPublished: boolean;
  onClose: () => void;
  onPublished?: () => void;
}

export function QrCodeDialog({
  quizId,
  quizTitle,
  isPublished: initialPublished,
  onClose,
  onPublished,
}: QrCodeDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [publishing, setPublishing] = useState(false);

  const quizUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/q/${quizId}`
      : `/q/${quizId}`;

  useEffect(() => {
    if (isPublished && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, quizUrl, {
        width: 200,
        margin: 2,
        color: { dark: "#f0f0f0", light: "#0D0D0F" },
      });
    }
  }, [quizUrl, isPublished]);

  async function handlePublish() {
    setPublishing(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("quizzes")
      .update({ status: "published" })
      .eq("id", quizId);

    if (!error) {
      setIsPublished(true);
      onPublished?.();
    }
    setPublishing(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(quizUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-card bg-surface border border-border-default shadow-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {isPublished ? (
          <>
            <h2 className="text-lg font-bold text-text-primary text-center mb-1">
              QR Code
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
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-text-primary text-center mb-2">
              Quiz non publie
            </h2>
            <p className="text-sm text-text-secondary text-center mb-6">
              Ce quiz doit etre publie pour generer un QR code. Voulez-vous le
              publier maintenant ?
            </p>

            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 rounded-badge border-border-default text-text-primary"
              >
                Annuler
              </Button>
              <Button
                onClick={handlePublish}
                disabled={publishing}
                className="flex-1 rounded-badge bg-accent-blue hover:bg-accent-blue-secondary text-background font-semibold"
              >
                {publishing ? "Publication..." : "Publier"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
