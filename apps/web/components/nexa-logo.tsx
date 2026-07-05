import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ICON = { src: "/favicon-32.png", width: 32, height: 32 } as const;

type LogoVariant = "full" | "compact" | "nav" | "icon";

interface NexaLogoProps {
  variant?: LogoVariant;
  href?: string | null;
  height?: number;
  className?: string;
  priority?: boolean;
}

function LogoIcon({
  size,
  priority,
  className,
}: {
  size: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={ICON.src}
      alt=""
      width={ICON.width}
      height={ICON.height}
      priority={priority}
      aria-hidden
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

function LogoWordmark({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn("font-serif font-semibold leading-none text-foreground", className)}
      style={style}
    >
      Nexa
    </span>
  );
}

function LogoMark({
  variant,
  height,
  priority,
  className,
}: {
  variant: LogoVariant;
  height: number;
  priority?: boolean;
  className?: string;
}) {
  if (variant === "icon") {
    return (
      <LogoIcon size={height} priority={priority} className={className} />
    );
  }

  if (variant === "nav") {
    const iconSize = Math.round(height * 0.78);
    const fontSize = Math.round(height * 0.42);
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <LogoIcon size={iconSize} priority={priority} />
        <LogoWordmark style={{ fontSize }} />
      </div>
    );
  }

  if (variant === "compact") {
    const iconSize = Math.round(height * 0.62);
    const fontSize = Math.round(height * 0.28);
    return (
      <div className={cn("flex flex-col items-center gap-1.5", className)}>
        <LogoIcon size={iconSize} priority={priority} />
        <LogoWordmark style={{ fontSize }} />
      </div>
    );
  }

  // full — icon, wordmark, tagline (theme-aware text)
  const iconSize = Math.round(height * 0.55);
  const fontSize = Math.round(height * 0.22);
  const taglineSize = Math.round(height * 0.1);
  return (
    <div className={cn("flex flex-col items-center gap-2 text-center", className)}>
      <LogoIcon size={iconSize} priority={priority} />
      <LogoWordmark className="font-bold tracking-tight" style={{ fontSize }} />
      <span
        className="font-sans font-medium text-muted-foreground"
        style={{ fontSize: Math.max(taglineSize, 12) }}
      >
        Spend with confidence.
      </span>
    </div>
  );
}

export function NexaLogo({
  variant = "nav",
  href = "/",
  height = 40,
  className,
  priority = false,
}: NexaLogoProps) {
  const mark = (
    <LogoMark
      variant={variant}
      height={height}
      priority={priority}
      className={className}
    />
  );

  if (href === null) {
    return mark;
  }

  return (
    <Link
      href={href}
      aria-label="Nexa — Spend with confidence."
      className="inline-flex shrink-0 items-center overflow-visible bg-transparent py-0.5"
    >
      {mark}
    </Link>
  );
}
