import type { ButtonHTMLAttributes, ReactNode, SVGProps } from "react";
import { PRIORITIES, type IssuePriority, type StatusSlug } from "@/lib/issues";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Gabarits partagés entre la page réelle et son squelette de chargement. */
export const HEADER_CLASS =
  "sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-line bg-canvas/80 px-(--gutter) backdrop-blur-lg backdrop-saturate-150 max-sm:gap-2";
export const MAIN_CLASS = "mx-auto w-full max-w-330 px-(--gutter) pt-7 pb-20";

// ---------- Boutons ----------

const BUTTON_VARIANTS = {
  primary:
    "border-transparent bg-accent-solid text-white shadow-[0_4px_14px_rgb(109_91_240/0.35)] hover:bg-accent-solid-hover",
  ghost: "border-line text-fg hover:border-line-strong hover:bg-surface-2",
  danger: "border-transparent text-danger hover:bg-danger/10",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof BUTTON_VARIANTS;
}

export function Button({ variant = "ghost", className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex h-9.5 items-center justify-center gap-2 rounded-[11px] border px-3.5 font-semibold whitespace-nowrap transition duration-150 active:scale-[0.97] disabled:cursor-progress disabled:opacity-60",
        BUTTON_VARIANTS[variant],
        className,
      )}
    />
  );
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "grid size-9.5 shrink-0 place-items-center rounded-[11px] border border-line bg-surface text-muted transition duration-150 hover:border-line-strong hover:text-fg active:scale-95",
        className,
      )}
    />
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd className={cn("rounded-md px-1.5 py-px font-mono text-[11px]", className)}>{children}</kbd>
  );
}

// ---------- Statut et priorité ----------

const DOT_COLORS: Record<StatusSlug, string> = {
  open: "bg-open",
  progress: "bg-progress",
  closed: "bg-closed",
};

export function StatusDot({ slug }: { slug: StatusSlug }) {
  return <i className={cn("inline-block size-2 shrink-0 rounded-full", DOT_COLORS[slug])} />;
}

const PRIORITY_COLORS: Record<IssuePriority, string> = {
  high: "text-high",
  medium: "text-medium",
  low: "text-low",
};
const PRIORITY_BARS: Record<IssuePriority, number> = { low: 1, medium: 2, high: 3 };

/** Trois barres façon « signal » : le niveau se lit sans dépendre de la couleur. */
export function PriorityGlyph({ priority }: { priority: IssuePriority }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex h-2.75 items-end gap-0.5", PRIORITY_COLORS[priority])}
    >
      {[5, 8, 11].map((height, index) => (
        <i
          key={height}
          style={{ height }}
          className={cn(
            "w-0.75 rounded-[1px] bg-current",
            index >= PRIORITY_BARS[priority] && "opacity-25",
          )}
        />
      ))}
    </span>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: IssuePriority;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-surface-2 py-0.5 pr-2.5 pl-2 text-xs font-medium text-muted",
        className,
      )}
    >
      <PriorityGlyph priority={priority} />
      {PRIORITIES[priority].label}
    </span>
  );
}

// ---------- Marque ----------

export function Brand() {
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid size-7.5 place-items-center rounded-[9px] bg-linear-to-br from-[#8b7bff] to-[#5a46e0] text-white shadow-[0_4px_14px_rgb(109_91_240/0.45)]"
      >
        <CheckIcon strokeWidth={3} />
      </span>
      <span className="font-semibold tracking-tight max-md:hidden">Issue Tracker</span>
    </div>
  );
}

// ---------- Icônes ----------

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 16, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg strokeWidth={2.6} {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg strokeWidth={2.4} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function BoardIcon(props: IconProps) {
  return (
    <Svg strokeWidth={3.2} {...props}>
      <path d="M6 5.5v13M12 5.5v6.5M18 5.5v10" />
    </Svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 7h14M5 12h14M5 17h14" />
    </Svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </Svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 13l2.5-7.5h11L20 13v5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z" />
      <path d="M4 13h4.5l1 2.5h5l1-2.5H20" />
    </Svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4l9 15.5H3z" />
      <path d="M12 10v4.5M12 17.2v.3" />
    </Svg>
  );
}
