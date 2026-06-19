import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A "closed portal" papercut scene used for not-found / pending / expired
 * recipient states. A pair of cut-paper doors framed by a tan arch.
 */
export function ClosedPortal({
  tone = "vermillion",
}: {
  tone?: "vermillion" | "teal" | "tan";
}) {
  const fill =
    tone === "teal"
      ? "var(--paper-teal)"
      : tone === "tan"
        ? "var(--paper-tan)"
        : "var(--paper-vermillion)";
  return (
    <svg
      viewBox="0 0 200 220"
      className="h-40 w-40"
      role="img"
      aria-label="A closed paper portal"
    >
      {/* outer arch */}
      <g style={{ filter: "drop-shadow(0 6px 6px rgba(60,40,20,0.25))" }}>
        <path
          d="M20 200 L20 90 Q20 20 100 20 Q180 20 180 90 L180 200 Z"
          fill="var(--paper-tan)"
        />
      </g>
      {/* inner recess */}
      <path
        d="M40 200 L40 95 Q40 40 100 40 Q160 40 160 95 L160 200 Z"
        fill="var(--paper-ink)"
        opacity="0.85"
      />
      {/* two closed doors */}
      <g style={{ filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.35))" }}>
        <path d="M48 200 L48 98 Q48 50 100 50 L100 200 Z" fill={fill} />
        <path
          d="M152 200 L152 98 Q152 50 100 50 L100 200 Z"
          fill={fill}
          opacity="0.85"
        />
      </g>
      {/* door seam + rings */}
      <line x1="100" y1="52" x2="100" y2="200" stroke="var(--paper-ink)" strokeOpacity="0.3" strokeWidth="2" />
      <circle cx="88" cy="130" r="5" fill="var(--paper-moon)" opacity="0.85" />
      <circle cx="112" cy="130" r="5" fill="var(--paper-moon)" opacity="0.85" />
    </svg>
  );
}

export function StateMessage({
  art,
  title,
  body,
  action,
}: {
  art: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="paper-card paper-grain mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
      <div className="paper-element">{art}</div>
      <h1 className="font-serif text-2xl font-semibold text-[var(--paper-ink)] text-balance">
        {title}
      </h1>
      <p className="leading-relaxed text-[var(--paper-ink)]/70 text-pretty">
        {body}
      </p>
      {action ?? (
        <Link
          href="/"
          className="paper-element-sm mt-2 inline-flex items-center rounded-lg bg-[var(--paper-vermillion)] px-5 py-2.5 font-medium text-[var(--paper-moon)] transition-transform hover:-translate-y-0.5"
        >
          Open a new portal
        </Link>
      )}
    </div>
  );
}
