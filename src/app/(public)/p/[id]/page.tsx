"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { BlockRenderer } from "@/components/pages/block-renderer";
import type { Page, PageSettings } from "@/lib/types/database";
import { DEFAULT_PAGE_SETTINGS } from "@/lib/types/database";

export default function PublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data } = await supabase
        .from("pages")
        .select("*")
        .eq("id", id)
        .eq("status", "published")
        .single();

      if (data) {
        setPage(data as Page);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-text-secondary">Chargement...</p>
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">Page introuvable</h1>
          <p className="mt-2 text-text-secondary">
            Cette page n&apos;existe pas ou n&apos;est pas publiee.
          </p>
        </div>
      </div>
    );
  }

  const settings: PageSettings = {
    ...DEFAULT_PAGE_SETTINGS,
    ...page.settings,
  };

  return (
    <>
      {settings.customFontUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={settings.customFontUrl} />
      )}
      <div
        className="min-h-dvh"
        style={{
          backgroundColor: settings.backgroundColor,
          fontFamily: settings.fontFamily,
          color: "#e5e5e5",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-8">
          {settings.logoUrl && (
            <div className="flex justify-center mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.logoUrl} alt="Logo" className="max-h-16" />
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: `${settings.blockSpacing}px`,
            }}
          >
            {page.blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} settings={settings} />
            ))}
          </div>

          {page.blocks.length === 0 && (
            <div className="text-center py-16">
              <p className="text-text-secondary">Cette page est vide.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
