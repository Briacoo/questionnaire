"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  Block,
  HeadingBlockProps,
  TextBlockProps,
  ImageBlockProps,
  ButtonBlockProps,
  VideoBlockProps,
  PdfBlockProps,
  CarouselBlockProps,
  BannerBlockProps,
  QuizBlockProps,
  SectionBlockProps,
  PageSettings,
} from "@/lib/types/database";

interface BlockRendererProps {
  block: Block;
  settings: PageSettings;
}

/* ─── Heading ─── */
function HeadingBlock({ props, settings }: { props: HeadingBlockProps; settings: PageSettings }) {
  const sizes: Record<1 | 2 | 3, number> = { 1: settings.h1Size, 2: settings.h2Size, 3: settings.h3Size };
  const Tag = `h${props.level}` as "h1" | "h2" | "h3";
  return (
    <Tag style={{ fontSize: `${sizes[props.level]}px`, textAlign: props.align, color: props.color || "inherit", fontFamily: "inherit", lineHeight: 1.3, margin: 0 }}>
      {props.text}
    </Tag>
  );
}

/* ─── Text ─── */
function TextBlock({ props }: { props: TextBlockProps }) {
  return (
    <div className="prose prose-invert max-w-none text-inherit" style={{ fontFamily: "inherit" }} dangerouslySetInnerHTML={{ __html: props.html }} />
  );
}

/* ─── Image ─── */
function ImageBlock({ props }: { props: ImageBlockProps }) {
  if (!props.src) return null;
  return (
    <div className={props.fullWidth ? "w-full" : "max-w-lg mx-auto"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={props.src} alt={props.alt} className="w-full rounded-lg" loading="lazy" />
    </div>
  );
}

/* ─── Button ─── */
function ButtonBlock({ props, settings }: { props: ButtonBlockProps; settings: PageSettings }) {
  const color = props.color || settings.primaryColor;
  const isPrimary = props.style === "primary";

  function handleClick() {
    if (props.action === "url" && props.url) {
      window.open(props.url, "_blank", "noopener");
    } else if (props.action === "quiz" && props.quizId) {
      window.location.href = `/q/${props.quizId}`;
    } else if (props.action === "anchor" && props.anchorBlockId) {
      const el = document.getElementById(`block-${props.anchorBlockId}`);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="flex justify-center">
      <button onClick={handleClick}
        className="px-6 py-3 rounded-badge font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
        style={isPrimary ? { backgroundColor: color, color: "#0a0a0a" } : { backgroundColor: "transparent", border: `2px solid ${color}`, color }}>
        {props.text}
      </button>
    </div>
  );
}

/* ─── Video ─── */
function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

function VideoBlock({ props }: { props: VideoBlockProps }) {
  if (!props.url) return null;

  if (props.provider === "youtube") {
    const videoId = getYouTubeId(props.url);
    if (!videoId) return <p className="text-text-secondary text-sm">URL YouTube invalide</p>;
    return (
      <div className="space-y-2">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe src={`https://www.youtube.com/embed/${videoId}`} className="absolute inset-0 w-full h-full rounded-lg" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
        </div>
        {props.caption && <p className="text-xs text-text-secondary text-center">{props.caption}</p>}
      </div>
    );
  }

  if (props.provider === "vimeo") {
    const videoId = getVimeoId(props.url);
    if (!videoId) return <p className="text-text-secondary text-sm">URL Vimeo invalide</p>;
    return (
      <div className="space-y-2">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe src={`https://player.vimeo.com/video/${videoId}`} className="absolute inset-0 w-full h-full rounded-lg" allowFullScreen allow="autoplay; fullscreen; picture-in-picture" />
        </div>
        {props.caption && <p className="text-xs text-text-secondary text-center">{props.caption}</p>}
      </div>
    );
  }

  // Upload
  return (
    <div className="space-y-2">
      <video src={props.url} controls className="w-full rounded-lg" />
      {props.caption && <p className="text-xs text-text-secondary text-center">{props.caption}</p>}
    </div>
  );
}

/* ─── PDF ─── */
function PdfBlock({ props }: { props: PdfBlockProps }) {
  if (!props.url) return null;

  if (props.displayMode === "embed") {
    return (
      <div className="space-y-2">
        <iframe src={props.url} className="w-full rounded-lg border border-border-default" style={{ height: 500 }} />
        {props.fileName && (
          <div className="flex justify-center">
            <a href={props.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-blue hover:underline">
              Telecharger {props.fileName}
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <a href={props.url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 px-5 py-3 rounded-card border border-border-default bg-surface hover:bg-white/5 transition-colors">
        <span className="text-2xl">📄</span>
        <div>
          <p className="text-sm font-medium text-text-primary">{props.fileName || "Document PDF"}</p>
          <p className="text-xs text-accent-blue">Cliquez pour telecharger</p>
        </div>
      </a>
    </div>
  );
}

/* ─── Carousel ─── */
function CarouselBlock({ props }: { props: CarouselBlockProps }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % props.images.length);
  }, [props.images.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + props.images.length) % props.images.length);
  }, [props.images.length]);

  useEffect(() => {
    if (!props.autoPlay || props.images.length <= 1) return;
    const timer = setInterval(next, props.interval * 1000);
    return () => clearInterval(timer);
  }, [props.autoPlay, props.interval, props.images.length, next]);

  if (props.images.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-lg">
      <div className="relative" style={{ paddingBottom: "56.25%" }}>
        {props.images.map((img, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-500 ${i === current ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {props.images.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
            ‹
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {props.images.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Banner ─── */
function BannerBlock({ props }: { props: BannerBlockProps }) {
  if (!props.imageUrl) return null;

  const alignClass = props.align === "left" ? "items-start text-left" : props.align === "right" ? "items-end text-right" : "items-center text-center";

  return (
    <div className="relative w-full rounded-lg overflow-hidden" style={{ height: props.height }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={props.imageUrl} alt="" className="w-full h-full object-cover" />
      {props.overlay && (
        <div className="absolute inset-0" style={{ backgroundColor: props.overlayColor, opacity: props.overlayOpacity / 100 }} />
      )}
      <div className={`absolute inset-0 flex flex-col justify-center px-8 ${alignClass}`}>
        {props.title && <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">{props.title}</h2>}
        {props.subtitle && <p className="text-sm md:text-lg text-white/80">{props.subtitle}</p>}
      </div>
    </div>
  );
}

/* ─── Quiz ─── */
function QuizBlock({ props, settings }: { props: QuizBlockProps; settings: PageSettings }) {
  if (!props.quizId) return null;

  if (props.style === "embedded") {
    return (
      <div className="rounded-lg border border-border-default overflow-hidden" style={{ height: 600 }}>
        <iframe src={`/q/${props.quizId}`} className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <a href={`/q/${props.quizId}`}
        className="flex flex-col items-center gap-3 px-8 py-6 rounded-card border border-border-default bg-surface hover:bg-white/5 transition-colors max-w-md w-full text-center">
        <span className="text-3xl">❓</span>
        <div>
          <p className="text-lg font-semibold text-text-primary">{props.title || "Quiz"}</p>
          {props.description && <p className="text-sm text-text-secondary mt-1">{props.description}</p>}
        </div>
        <span className="px-4 py-2 rounded-badge font-semibold text-sm" style={{ backgroundColor: settings.primaryColor, color: "#0a0a0a" }}>
          Commencer le quiz
        </span>
      </a>
    </div>
  );
}

/* ─── Section (colonnes) ─── */
function SectionBlock({ props, settings }: { props: SectionBlockProps; settings: PageSettings }) {
  return (
    <div
      className="rounded-lg"
      style={{
        backgroundColor: props.backgroundColor || "transparent",
        padding: props.padding,
      }}
    >
      <div className="grid" style={{ gridTemplateColumns: `repeat(${props.columns}, 1fr)`, gap: props.gap }}>
        {props.children.map((column, colIdx) => (
          <div key={colIdx} className="space-y-4">
            {column.map((block) => (
              <BlockRenderer key={block.id} block={block} settings={settings} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Renderer ─── */
export function BlockRenderer({ block, settings }: BlockRendererProps) {
  return (
    <div id={`block-${block.id}`}>
      {block.type === "heading" && <HeadingBlock props={block.props as HeadingBlockProps} settings={settings} />}
      {block.type === "text" && <TextBlock props={block.props as TextBlockProps} />}
      {block.type === "image" && <ImageBlock props={block.props as ImageBlockProps} />}
      {block.type === "button" && <ButtonBlock props={block.props as ButtonBlockProps} settings={settings} />}
      {block.type === "video" && <VideoBlock props={block.props as VideoBlockProps} />}
      {block.type === "pdf" && <PdfBlock props={block.props as PdfBlockProps} />}
      {block.type === "carousel" && <CarouselBlock props={block.props as CarouselBlockProps} />}
      {block.type === "banner" && <BannerBlock props={block.props as BannerBlockProps} />}
      {block.type === "quiz" && <QuizBlock props={block.props as QuizBlockProps} settings={settings} />}
      {block.type === "section" && <SectionBlock props={block.props as SectionBlockProps} settings={settings} />}
    </div>
  );
}
