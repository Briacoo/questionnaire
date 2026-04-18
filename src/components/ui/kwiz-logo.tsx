"use client";

interface KwizLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 24, text: "text-lg" },
  md: { icon: 32, text: "text-xl" },
  lg: { icon: 48, text: "text-3xl" },
};

export function KwizLogo({ size = "md", showText = true, className = "" }: KwizLogoProps) {
  const s = sizes[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width={s.icon} height={s.icon} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Rounded square background */}
        <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#kwiz-gradient)" />
        {/* K letter stylized as a lightning bolt / quiz mark */}
        <path
          d="M18 12L18 24L28 14L22 22L30 36L22 26L18 36"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Question mark dot */}
        <circle cx="30" cy="12" r="2.5" fill="white" opacity="0.8" />
        <defs>
          <linearGradient id="kwiz-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60a5fa" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className={`font-bold tracking-tight ${s.text}`}>
          <span className="text-accent-blue">K</span>
          <span className="text-text-primary">wiz</span>
        </span>
      )}
    </span>
  );
}
