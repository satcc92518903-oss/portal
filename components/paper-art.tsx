/**
 * Shared papercut SVG art. Every shape is a solid fill with a layered
 * drop-shadow so it reads as a sheet of cut paper lifted off the one behind it.
 */

/** Full-bleed layered night-sky scene used as the hero/page backdrop. */
export function SkyScene({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      {/* sky bands */}
      <rect x="0" y="0" width="1440" height="900" fill="var(--paper-night)" />
      <rect x="0" y="360" width="1440" height="540" fill="var(--paper-dusk)" />

      {/* stars */}
      <g fill="var(--paper-moon)" opacity="0.85">
        {STАRS.map((s, i) => (
          <circle key={i} cx={s[0]} cy={s[1]} r={s[2]} />
        ))}
      </g>

      {/* moon (cut disc with engraved rings) */}
      <g style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.35))" }}>
        <circle cx="1150" cy="200" r="92" fill="var(--paper-moon)" />
        <circle cx="1150" cy="200" r="92" fill="none" stroke="var(--paper-tan)" strokeOpacity="0.35" strokeWidth="3" />
        <circle cx="1120" cy="180" r="16" fill="var(--paper-tan)" opacity="0.25" />
        <circle cx="1178" cy="225" r="11" fill="var(--paper-tan)" opacity="0.2" />
        <circle cx="1135" cy="235" r="8" fill="var(--paper-tan)" opacity="0.2" />
      </g>

      {/* birds */}
      <g stroke="var(--paper-moon)" strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round">
        <path d="M250 150 q14 -12 28 0 q14 -12 28 0" />
        <path d="M330 190 q10 -9 20 0 q10 -9 20 0" />
        <path d="M180 210 q12 -10 24 0 q12 -10 24 0" />
      </g>

      {/* layered cut-paper mountains, far -> near */}
      <g style={{ filter: "drop-shadow(0 -7px 7px rgba(0,0,0,0.28))" }}>
        <path d="M0 560 L240 430 L470 560 L720 410 L980 560 L1230 450 L1440 560 L1440 900 L0 900 Z" fill="var(--paper-twilight)" />
      </g>
      <g style={{ filter: "drop-shadow(0 -7px 7px rgba(0,0,0,0.3))" }}>
        <path d="M0 660 L300 540 L560 660 L860 520 L1140 660 L1440 560 L1440 900 L0 900 Z" fill="var(--paper-teal-deep)" />
        {/* pagoda silhouette on a ridge */}
        <g transform="translate(840 470)" fill="var(--paper-teal-deep)">
          <rect x="-4" y="0" width="8" height="52" />
          <path d="M-28 6 L28 6 L18 -8 L-18 -8 Z" />
          <path d="M-22 -8 L22 -8 L14 -22 L-14 -22 Z" />
          <path d="M-15 -22 L15 -22 L8 -36 L-8 -36 Z" />
          <rect x="-2" y="-44" width="4" height="10" />
        </g>
      </g>
      <g style={{ filter: "drop-shadow(0 -8px 8px rgba(0,0,0,0.32))" }}>
        <path d="M0 760 L260 660 L520 770 L820 640 L1120 770 L1440 670 L1440 900 L0 900 Z" fill="var(--paper-teal)" />
      </g>

      {/* near hill with blossom tree */}
      <g style={{ filter: "drop-shadow(0 -9px 9px rgba(0,0,0,0.35))" }}>
        <path d="M0 840 L360 770 L760 850 L1120 780 L1440 850 L1440 900 L0 900 Z" fill="var(--paper-sage)" />
        <g transform="translate(220 690)">
          <path d="M0 130 C-6 90 -6 70 -2 40 L2 40 C6 70 6 90 0 130 Z" fill="var(--paper-ink)" opacity="0.85" />
          <path d="M0 60 L-34 30 M0 70 L30 36 M-2 48 L-20 18 M2 52 L26 60" stroke="var(--paper-ink)" strokeWidth="4" opacity="0.8" strokeLinecap="round" />
          <g fill="var(--paper-vermillion)" opacity="0.92">
            <circle cx="-34" cy="28" r="11" />
            <circle cx="30" cy="34" r="12" />
            <circle cx="-20" cy="16" r="9" />
            <circle cx="26" cy="60" r="9" />
            <circle cx="-4" cy="6" r="13" />
            <circle cx="8" cy="22" r="8" />
          </g>
        </g>
      </g>
    </svg>
  );
}

/** A horizontal stack of cut clouds, used to divide sections. */
export function CloudDivider({
  className = "",
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ transform: flip ? "scaleY(-1)" : undefined }}
    >
      <g style={{ filter: "drop-shadow(0 -4px 4px rgba(60,40,20,0.12))" }}>
        <path
          d="M0 120 L0 70 Q60 40 130 60 Q180 20 260 50 Q330 25 400 55 Q480 30 560 58 Q640 30 720 56 Q800 28 880 56 Q960 30 1040 55 Q1120 26 1200 54 Q1280 28 1360 56 Q1410 44 1440 64 L1440 120 Z"
          fill="var(--paper-ivory)"
        />
      </g>
    </svg>
  );
}

/**
 * A cut-paper moon that fills with light as progress increases (0..100).
 * Used as the upload progress indicator.
 */
export function PaperMoon({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(100, progress));
  const fillY = 100 - clamped; // fill rises from the bottom
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32" role="img" aria-label={`Upload ${Math.round(clamped)} percent`}>
      <defs>
        <clipPath id="moonClip">
          <circle cx="60" cy="60" r="52" />
        </clipPath>
      </defs>
      {/* dark crater base */}
      <circle cx="60" cy="60" r="52" fill="var(--paper-dusk)" />
      {/* rising light */}
      <g clipPath="url(#moonClip)">
        <rect x="0" y={fillY} width="120" height="120" fill="var(--paper-tan)" />
        <rect x="0" y={fillY} width="120" height="6" fill="var(--paper-moon)" opacity="0.7" />
      </g>
      {/* cut ring */}
      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--paper-ivory)" strokeWidth="5" />
      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--paper-tan-deep)" strokeWidth="2" opacity="0.4" />
      {/* engraved craters */}
      <g fill="var(--paper-ink)" opacity="0.12">
        <circle cx="44" cy="46" r="7" />
        <circle cx="78" cy="64" r="5" />
        <circle cx="54" cy="78" r="4" />
      </g>
    </svg>
  );
}

const STАRS: [number, number, number][] = [
  [120, 80, 2], [210, 60, 1.5], [320, 110, 2], [430, 70, 1.5], [520, 120, 2],
  [610, 60, 1.5], [700, 100, 2], [60, 140, 1.5], [380, 40, 1.5], [880, 80, 2],
  [960, 130, 1.5], [1040, 70, 2], [1280, 110, 1.5], [1350, 60, 2], [1180, 90, 1.5],
  [260, 180, 1.5], [700, 200, 1.5], [500, 220, 1.5], [1080, 180, 1.5], [150, 250, 1.5],
];
