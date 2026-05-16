"use client";

/**
 * Custom-drawn icon set, weighted to read like printed marks.
 * Key actions (mic, camera, send) are filled. Secondary controls
 * use a 1.6 stroke (heavier than the lucide default) so they sit
 * with the serif type without disappearing.
 */

type P = { className?: string; size?: number; title?: string };

const base = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

const wrap = (p: P) => ({
  ...base,
  style: { width: p.size || "1em", height: p.size || "1em" },
  className: p.className,
  role: p.title ? "img" : undefined,
  "aria-label": p.title,
  "aria-hidden": p.title ? undefined : true,
});

/* ── Mic — solid body, classic studio mic silhouette ── */
export function IconMic(p: P) {
  return (
    <svg {...wrap(p)}>
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" stroke="none" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="8.5" y1="21" x2="15.5" y2="21" />
    </svg>
  );
}

/* ── Camera — solid body, recessed lens ── */
export function IconCamera(p: P) {
  return (
    <svg {...wrap(p)}>
      <path
        d="M9.2 4.5h5.6l1.4 2.2H20a1.5 1.5 0 0 1 1.5 1.5v9.3A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5V8.2A1.5 1.5 0 0 1 4 6.7h3.8Z"
        fill="currentColor"
        stroke="none"
      />
      <circle cx="12" cy="13" r="3.4" fill="var(--surface)" stroke="none" />
      <circle cx="12" cy="13" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── Send — paper plane, solid ── */
export function IconSend(p: P) {
  return (
    <svg {...wrap(p)}>
      <path
        d="M3 11.2 20.5 4 14.6 20.5 11.4 13.5 4.5 11.8Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

/* ── Stop — solid square ── */
export function IconStop(p: P) {
  return (
    <svg {...wrap(p)}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── History clock ── */
export function IconHistory(p: P) {
  return (
    <svg {...wrap(p)}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  );
}

/* ── Volume / listen ── */
export function IconVolume(p: P) {
  return (
    <svg {...wrap(p)}>
      <path d="M4 9.5h3.2L12 5v14l-4.8-4.5H4Z" fill="currentColor" stroke="none" />
      <path d="M16 9a5 5 0 0 1 0 6" />
      <path d="M19 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

export function IconVolumeOff(p: P) {
  return (
    <svg {...wrap(p)}>
      <path d="M4 9.5h3.2L12 5v14l-4.8-4.5H4Z" fill="currentColor" stroke="none" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}

/* ── Arrow left ── */
export function IconArrowLeft(p: P) {
  return (
    <svg {...wrap(p)}>
      <line x1="20" y1="12" x2="5" y2="12" />
      <polyline points="11 18 5 12 11 6" />
    </svg>
  );
}

/* ── Chevron right ── */
export function IconChevronRight(p: P) {
  return (
    <svg {...wrap(p)}>
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

/* ── Trash ── */
export function IconTrash(p: P) {
  return (
    <svg {...wrap(p)}>
      <polyline points="4 7 20 7" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.4h7a1.5 1.5 0 0 0 1.5-1.4L18 7" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

/* ── Warning — solid pennant ── */
export function IconWarning(p: P) {
  return (
    <svg {...wrap(p)}>
      <path d="M12 3 22 20H2Z" fill="currentColor" stroke="none" />
      <line x1="12" y1="10" x2="12" y2="14.5" stroke="var(--paper)" strokeWidth="2" />
      <circle cx="12" cy="17" r="0.9" fill="var(--paper)" stroke="none" />
    </svg>
  );
}

/* ── Check ── */
export function IconCheck(p: P) {
  return (
    <svg {...wrap(p)} strokeWidth={2}>
      <polyline points="4 12.5 10 18 20 6" />
    </svg>
  );
}

/* ── Plus ── */
export function IconPlus(p: P) {
  return (
    <svg {...wrap(p)} strokeWidth={1.8}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/* ── Close (×) ── */
export function IconClose(p: P) {
  return (
    <svg {...wrap(p)} strokeWidth={1.8}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

/* ── Book / page ── */
export function IconBook(p: P) {
  return (
    <svg {...wrap(p)}>
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3Z" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="14" y2="12" />
    </svg>
  );
}

/* ── Image / picture frame ── */
export function IconImage(p: P) {
  return (
    <svg {...wrap(p)}>
      <rect x="3" y="4.5" width="18" height="15" rx="1.5" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <path d="M21 16.5 16 11.5l-9 8" />
    </svg>
  );
}

/* ── User / person ── */
export function IconUser(p: P) {
  return (
    <svg {...wrap(p)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

/* ── Quiz / question card ── */
export function IconQuiz(p: P) {
  return (
    <svg {...wrap(p)}>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M9.5 10.5a2.5 2.5 0 1 1 3.7 2.2c-.6.3-1.2.7-1.2 1.3v.5" />
      <circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── Refresh / circular arrow ── */
export function IconRefresh(p: P) {
  return (
    <svg {...wrap(p)}>
      <path d="M21 12a9 9 0 1 1-3.2-6.9" />
      <polyline points="21 4 21 9 16 9" />
    </svg>
  );
}

/* ── Lightbulb / hint ── */
export function IconLightbulb(p: P) {
  return (
    <svg {...wrap(p)}>
      <path d="M9 17h6" />
      <path d="M10 20h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.8V15h7v-1.2A6 6 0 0 0 12 3Z" />
    </svg>
  );
}

/* ── Copy ── */
export function IconCopy(p: P) {
  return (
    <svg {...wrap(p)}>
      <rect x="8" y="8" width="13" height="13" rx="1.5" />
      <path d="M5 16h-.5A1.5 1.5 0 0 1 3 14.5v-11A1.5 1.5 0 0 1 4.5 2h11A1.5 1.5 0 0 1 17 3.5V4" />
    </svg>
  );
}

/* ── Info ── */
export function IconInfo(p: P) {
  return (
    <svg {...wrap(p)}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16.5" />
      <circle cx="12" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
