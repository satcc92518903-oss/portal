"use client";

import { useEffect, useState } from "react";

function format(ms: number): { d: number; h: number; m: number; s: number } {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

/**
 * Live countdown to a portal's expiry. Renders the time as small cut-paper
 * tiles. Calls onExpire once when it reaches zero.
 */
export function Countdown({
  expiresAt,
  onExpire,
  compact = false,
}: {
  expiresAt: number;
  onExpire?: () => void;
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = expiresAt - now;
  const expired = remaining <= 0;

  useEffect(() => {
    if (expired) onExpire?.();
  }, [expired, onExpire]);

  const { d, h, m, s } = format(remaining);
  const pad = (n: number) => String(n).padStart(2, "0");

  if (expired) {
    return (
      <p className="text-sm font-medium text-[var(--paper-vermillion-deep)]">
        This portal has closed.
      </p>
    );
  }

  const tiles: { label: string; value: string }[] = [
    ...(d > 0 ? [{ label: "days", value: pad(d) }] : []),
    { label: "hrs", value: pad(h) },
    { label: "min", value: pad(m) },
    { label: "sec", value: pad(s) },
  ];

  return (
    <div
      className={`flex items-end gap-2 ${compact ? "text-xs" : "text-sm"}`}
      aria-label={`Closes in ${d} days ${h} hours ${m} minutes ${s} seconds`}
    >
      {tiles.map((t) => (
        <div key={t.label} className="flex flex-col items-center">
          <span
            className={`paper-element-sm rounded-md bg-[var(--paper-ink)] font-mono tabular-nums text-[var(--paper-moon)] ${
              compact ? "px-1.5 py-0.5 text-sm" : "px-2.5 py-1.5 text-lg"
            }`}
          >
            {t.value}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-wide text-[var(--paper-ink)]/60">
            {t.label}
          </span>
        </div>
      ))}
    </div>
  );
}
