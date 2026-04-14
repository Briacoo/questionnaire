"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Page, PageSettings, PageStatus } from "@/lib/types/database";
import { DEFAULT_PAGE_SETTINGS, PRESET_FONTS } from "@/lib/types/database";

export default function PageSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: pageId } = use(params);
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [settings, setSettings] = useState<PageSettings>(DEFAULT_PAGE_SETTINGS);
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<PageStatus>("draft");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const session = getSession();
      if (!session) return;

      const { data } = await supabase
        .from("pages")
        .select("*")
        .eq("id", pageId)
        .single();

      if (data) {
        const p = data as Page;
        setPage(p);
        setSettings({ ...DEFAULT_PAGE_SETTINGS, ...p.settings });
        setSlug(p.slug);
        setStatus(p.status);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  function updateSettings(partial: Partial<PageSettings>) {
    setSettings((prev) => ({ ...prev, ...partial }));
  }

  async function handleSave() {
    if (!page) return;
    setSaving(true);

    await supabase
      .from("pages")
      .update({
        settings,
        slug,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", page.id);

    setSaving(false);
  }

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logos/${pageId}.${ext}`;

      const { error } = await supabase.storage
        .from("page-images")
        .upload(path, file, { upsert: true });

      if (error) {
        alert("Erreur upload: " + error.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("page-images")
        .getPublicUrl(path);

      updateSettings({ logoUrl: urlData.publicUrl });
    } finally {
      setUploadingLogo(false);
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/p/${pageId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!page) {
    return (
      <div className="px-4 pt-6">
        <p className="text-text-secondary">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push(`/admin/pages/${pageId}/edit`)}
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          ← Editeur
        </button>
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="rounded-badge bg-accent-blue text-background text-xs font-semibold"
        >
          {saving ? "..." : "Sauvegarder"}
        </Button>
      </div>

      <h1 className="text-xl font-bold text-text-primary mb-6">Reglages de la page</h1>

      <div className="space-y-6">
        {/* Publication */}
        <section className="rounded-card border border-border-default bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">Publication</h2>

          <div>
            <Label className="text-xs text-text-secondary">Statut</Label>
            <div className="flex gap-2 mt-1">
              {(["draft", "published"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 text-xs rounded-badge font-medium transition-colors ${
                    status === s
                      ? s === "published"
                        ? "bg-green-400 text-background"
                        : "bg-accent-blue text-background"
                      : "bg-background border border-border-default text-text-secondary"
                  }`}
                >
                  {s === "draft" ? "Brouillon" : "Publie"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-text-secondary">Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 bg-background border-border-default text-text-primary text-xs"
            />
          </div>

          <div>
            <Label className="text-xs text-text-secondary">Lien public</Label>
            <div className="flex gap-2 mt-1">
              <Input
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/p/${pageId}`}
                className="flex-1 bg-background border-border-default text-text-secondary text-xs"
              />
              <Button
                onClick={copyLink}
                variant="outline"
                size="sm"
                className="rounded-badge border-border-default text-text-secondary text-xs shrink-0"
              >
                {copied ? "Copie !" : "Copier"}
              </Button>
            </div>
          </div>
        </section>

        {/* Typographie */}
        <section className="rounded-card border border-border-default bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">Typographie</h2>

          <div>
            <Label className="text-xs text-text-secondary">Police</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {PRESET_FONTS.map((font) => (
                <button
                  key={font}
                  type="button"
                  onClick={() => updateSettings({ fontFamily: font, customFontUrl: null })}
                  className={`px-3 py-1.5 text-xs rounded-badge font-medium transition-colors ${
                    settings.fontFamily === font && !settings.customFontUrl
                      ? "bg-accent-blue text-background"
                      : "bg-background border border-border-default text-text-secondary"
                  }`}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-text-secondary">
              Police personnalisee (URL Google Fonts)
            </Label>
            <Input
              value={settings.customFontUrl || ""}
              onChange={(e) => {
                const url = e.target.value;
                updateSettings({ customFontUrl: url || null });
                // Extract font name from Google Fonts URL
                const match = url.match(/family=([^&:]+)/);
                if (match) {
                  updateSettings({
                    customFontUrl: url,
                    fontFamily: decodeURIComponent(match[1].replace(/\+/g, " ")),
                  });
                }
              }}
              placeholder="https://fonts.googleapis.com/css2?family=..."
              className="mt-1 bg-background border-border-default text-text-primary text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-text-secondary">H1 (px)</Label>
              <Input
                type="number"
                value={settings.h1Size}
                onChange={(e) => updateSettings({ h1Size: Number(e.target.value) })}
                className="mt-1 bg-background border-border-default text-text-primary text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-text-secondary">H2 (px)</Label>
              <Input
                type="number"
                value={settings.h2Size}
                onChange={(e) => updateSettings({ h2Size: Number(e.target.value) })}
                className="mt-1 bg-background border-border-default text-text-primary text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-text-secondary">H3 (px)</Label>
              <Input
                type="number"
                value={settings.h3Size}
                onChange={(e) => updateSettings({ h3Size: Number(e.target.value) })}
                className="mt-1 bg-background border-border-default text-text-primary text-xs"
              />
            </div>
          </div>
        </section>

        {/* Couleurs */}
        <section className="rounded-card border border-border-default bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">Couleurs</h2>

          <div className="grid grid-cols-3 gap-3">
            {([
              { key: "primaryColor" as const, label: "Primaire" },
              { key: "secondaryColor" as const, label: "Secondaire" },
              { key: "backgroundColor" as const, label: "Fond" },
            ]).map(({ key, label }) => (
              <div key={key}>
                <Label className="text-xs text-text-secondary">{label}</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Input
                    type="color"
                    value={settings[key]}
                    onChange={(e) => updateSettings({ [key]: e.target.value })}
                    className="w-8 h-8 p-0.5 bg-background border-border-default cursor-pointer shrink-0"
                  />
                  <Input
                    value={settings[key]}
                    onChange={(e) => updateSettings({ [key]: e.target.value })}
                    className="flex-1 bg-background border-border-default text-text-primary text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Espacement & Logo */}
        <section className="rounded-card border border-border-default bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">Mise en page</h2>

          <div>
            <Label className="text-xs text-text-secondary">
              Espacement entre blocs ({settings.blockSpacing}px)
            </Label>
            <input
              type="range"
              min={8}
              max={64}
              step={4}
              value={settings.blockSpacing}
              onChange={(e) => updateSettings({ blockSpacing: Number(e.target.value) })}
              className="w-full mt-1 accent-accent-blue"
            />
          </div>

          <div>
            <Label className="text-xs text-text-secondary">Logo / Header</Label>
            {settings.logoUrl ? (
              <div className="mt-1 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="max-h-12 rounded"
                />
                <button
                  type="button"
                  onClick={() => updateSettings({ logoUrl: null })}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                disabled={uploadingLogo}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
                className="mt-1 text-xs text-text-secondary file:mr-2 file:px-3 file:py-1 file:rounded-badge file:border-0 file:bg-accent-blue file:text-background file:text-xs file:font-medium file:cursor-pointer"
              />
            )}
            {uploadingLogo && (
              <p className="text-xs text-accent-blue mt-1">Upload en cours...</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
