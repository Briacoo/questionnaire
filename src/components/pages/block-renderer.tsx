"use client";

import type {
  Block,
  HeadingBlockProps,
  TextBlockProps,
  ImageBlockProps,
  ButtonBlockProps,
  PageSettings,
} from "@/lib/types/database";

interface BlockRendererProps {
  block: Block;
  settings: PageSettings;
}

function HeadingBlock({ props, settings }: { props: HeadingBlockProps; settings: PageSettings }) {
  const sizes: Record<1 | 2 | 3, number> = {
    1: settings.h1Size,
    2: settings.h2Size,
    3: settings.h3Size,
  };

  const Tag = `h${props.level}` as "h1" | "h2" | "h3";

  return (
    <Tag
      style={{
        fontSize: `${sizes[props.level]}px`,
        textAlign: props.align,
        color: props.color || "inherit",
        fontFamily: "inherit",
        lineHeight: 1.3,
        margin: 0,
      }}
    >
      {props.text}
    </Tag>
  );
}

function TextBlock({ props }: { props: TextBlockProps }) {
  return (
    <div
      className="prose prose-invert max-w-none text-inherit"
      style={{ fontFamily: "inherit" }}
      dangerouslySetInnerHTML={{ __html: props.html }}
    />
  );
}

function ImageBlock({ props }: { props: ImageBlockProps }) {
  if (!props.src) return null;

  return (
    <div className={props.fullWidth ? "w-full" : "max-w-lg mx-auto"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={props.src}
        alt={props.alt}
        className="w-full rounded-lg"
        loading="lazy"
      />
    </div>
  );
}

function ButtonBlock({
  props,
  settings,
}: {
  props: ButtonBlockProps;
  settings: PageSettings;
}) {
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
      <button
        onClick={handleClick}
        className="px-6 py-3 rounded-badge font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
        style={
          isPrimary
            ? { backgroundColor: color, color: "#0a0a0a" }
            : {
                backgroundColor: "transparent",
                border: `2px solid ${color}`,
                color,
              }
        }
      >
        {props.text}
      </button>
    </div>
  );
}

export function BlockRenderer({ block, settings }: BlockRendererProps) {
  return (
    <div id={`block-${block.id}`}>
      {block.type === "heading" && (
        <HeadingBlock props={block.props as HeadingBlockProps} settings={settings} />
      )}
      {block.type === "text" && <TextBlock props={block.props as TextBlockProps} />}
      {block.type === "image" && <ImageBlock props={block.props as ImageBlockProps} />}
      {block.type === "button" && (
        <ButtonBlock props={block.props as ButtonBlockProps} settings={settings} />
      )}
    </div>
  );
}
