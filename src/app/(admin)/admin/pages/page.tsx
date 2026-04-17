"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Page, PageStatus } from "@/lib/types/database";
import { DEFAULT_PAGE_SETTINGS } from "@/lib/types/database";
import QRCode from "qrcode";

const statusStyles: Record<PageStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Brouillon", color: "text-status-draft", bg: "bg-status-draft/10" },
  published: { label: "Publie", color: "text-green-400", bg: "bg-green-400/10" },
};

function PageQRCode({ pageId }: { pageId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const pageUrl = typeof window !== "undefined"
    ? `${window.location.origin}/p/${pageId}`
    : `/p/${pageId}`;

  useEffect(() => {
    if (show && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, pageUrl, {
        width: 180,
        margin: 2,
        color: { dark: "#f0f0f0", light: "#0D0D0F" },
      });
    }
  }, [show, pageUrl]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [pageUrl]);

  if (!show) {
    return (
      <div className="flex gap-2 mt-2">
        <Button
          onClick={() => window.open(pageUrl, "_blank")}
          variant="outline"
          size="sm"
          className="flex-1 rounded-badge border-green-400/30 text-green-400 text-xs"
        >
          Voir la page
        </Button>
        <Button
          onClick={() => setShow(true)}
          variant="outline"
          size="sm"
          className="rounded-badge border-border-default text-text-secondary text-xs"
        >
          QR Code
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 rounded-card bg-background border border-border-default">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-text-secondary font-medium">QR Code</span>
        <button
          onClick={() => setShow(false)}
          className="text-xs text-text-secondary hover:text-text-primary"
        >
          ✕
        </button>
      </div>
      <div className="flex justify-center mb-3">
        <canvas ref={canvasRef} />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => window.open(pageUrl, "_blank")}
          size="sm"
          className="flex-1 rounded-badge bg-green-500 text-background text-xs"
        >
          Ouvrir
        </Button>
        <Button
          onClick={copyLink}
          variant="outline"
          size="sm"
          className="flex-1 rounded-badge border-border-default text-text-secondary text-xs"
        >
          {copied ? "Copie !" : "Copier le lien"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminPagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const session = getSession();
      if (!session) return;

      const { data } = await supabase
        .from("pages")
        .select("*")
        .eq("admin_id", session.user_id)
        .order("updated_at", { ascending: false });

      if (data) setPages(data);
      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    const session = getSession();
    if (!session) return;
    setCreating(true);

    const slug = `page-${Date.now()}`;

    const { data, error } = await supabase
      .from("pages")
      .insert({
        admin_id: session.user_id,
        title: "Nouvelle page",
        slug,
        blocks: [],
        settings: DEFAULT_PAGE_SETTINGS,
        status: "draft",
      })
      .select("id")
      .single();

    if (!error && data) {
      router.push(`/admin/pages/${data.id}/edit`);
    }
    setCreating(false);
  }

  async function handleDelete(pageId: string) {
    if (!confirm("Supprimer cette page ?")) return;
    await supabase.from("pages").delete().eq("id", pageId);
    setPages((prev) => prev.filter((p) => p.id !== pageId));
  }

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <p className="text-text-secondary">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-32">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Pages</h1>
        <Button
          onClick={handleCreate}
          disabled={creating}
          className="rounded-badge bg-accent-blue hover:bg-accent-blue-secondary text-background font-semibold"
        >
          {creating ? "Creation..." : "+ Nouvelle page"}
        </Button>
      </div>

      {pages.length === 0 ? (
        <Card className="bg-surface border-border-default shadow-card">
          <CardContent className="p-6 text-center">
            <p className="text-text-secondary">Aucune page creee.</p>
            <p className="text-xs text-text-secondary mt-1">
              Creez votre premiere page de contenu.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pages.map((page) => {
            const st = statusStyles[page.status];
            return (
              <Card key={page.id} className="bg-surface border-border-default shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {page.title}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {page.blocks.length} bloc{page.blocks.length > 1 ? "s" : ""} ·{" "}
                        {new Date(page.updated_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-badge ${st.color} ${st.bg}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => router.push(`/admin/pages/${page.id}/edit`)}
                      size="sm"
                      className="flex-1 rounded-badge bg-accent-blue text-background text-xs"
                    >
                      Editer
                    </Button>
                    <Button
                      onClick={() => handleDelete(page.id)}
                      variant="outline"
                      size="sm"
                      className="rounded-badge border-red-400/30 text-red-400 text-xs"
                    >
                      Supprimer
                    </Button>
                  </div>

                  {/* QR Code + lien rapide pour pages publiées */}
                  {page.status === "published" && (
                    <PageQRCode pageId={page.id} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
