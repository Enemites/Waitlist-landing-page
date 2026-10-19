import { useId, useRef, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type EntryId = "casual" | "focused" | "competitive";

type EntrySelectorProps = {
  value: EntryId;
  onChange: (next: EntryId, source?: "pointer" | "keyboard") => void;
};

const entries = [
  { id: "casual", label: "Casual", reason: "Follow the unknown" },
  { id: "focused", label: "Focused", reason: "Pursue a field" },
  { id: "competitive", label: "Competitive", reason: "Face another team" },
] as const;

// Accents mirror each path while the shared surface stays in the product palette.
const THEMES: Record<EntryId, { accent: string; surface: string; line: string }> = {
  focused: { accent: "#c4ed6c", surface: "#1e2b22", line: "#718753" },
  casual: { accent: "#b9b3f5", surface: "#232439", line: "#767294" },
  competitive: { accent: "#efbd70", surface: "#30291e", line: "#8a7351" },
};

// Exact optical visual centers of the artwork paths
const ICON_FOCAL_CENTERS: Record<EntryId, { x: number; y: number }> = {
  competitive: { x: -80, y: -73 },
  focused: { x: -71, y: -72 }, // Focal arrow & square is at X=71
  casual: { x: -78, y: -85 },  // Arch & winding path center is at X=78
};

/** Bespoke thresholds: an arch, an aligned passage, and two opposing approaches. */
function GatewayPaths({ kind }: { kind: EntryId }) {
  if (kind === "casual") {
    return (
      <>
        <path className="gate-art-far" d="M29 121V65a49 49 0 0 1 98 0v56M38 121V66a40 40 0 0 1 80 0v55" />
        <path className="gate-art-door" d="M48 121V67a30 30 0 0 1 60 0v54Z" />
        <path className="gate-art-detail" d="M29 121h98m-49-17-48 29m48-29 49 29" />
        <path className="gate-art-path" d="M78 121c-14-18 14-27 0-45" />
        <path className="gate-art-moon" d="M93 50a10 10 0 1 0 5 18 11 11 0 0 1-5-18Z" />
        <circle className="gate-art-point" cx="61" cy="64" r="2.5" />
      </>
    );
  }
  if (kind === "focused") {
    return (
      <>
        <path className="gate-art-far" d="M24 121V34h94v87M24 34l22-15h94v88l-22 14m0-87 22-15" />
        <path className="gate-art-door" d="M42 121V49h58v72Z" />
        <path className="gate-art-detail" d="M54 121V61h34v60M24 121h94M11 68h14m86 0h16M71 8v15" />
        <path className="gate-art-path" d="M71 136V95m-5 6 5-6 5 6" />
        <path className="gate-art-point" d="M68 72h6v6h-6Z" />
      </>
    );
  }
  return (
    <>
      <path className="gate-art-far" d="m17 121 27-96h25M143 121l-27-96H91" />
      <path className="gate-art-door" d="m27 121 23-81h18l-9 21H51l-16 60ZM133 121l-23-81H92l9 21h8l16 60Z" />
      <path className="gate-art-detail" d="M17 121h126M80 26v17m0 76v17M36 80h15m58 0h15" />
      <path className="gate-art-path" d="m62 81 18-24 18 24-18 24Z" />
      <path className="gate-art-point" d="m74 81 6-8 6 8-6 8Z" />
    </>
  );
}

type Facet = {
  path: string;
  innerEdge: string;
  centerX: number;
  centerY: number;
};

// Each side is a separate surface; their inner edges reveal a triangular void.
// Fixed positions give the three entry paths equal standing when selected.
const FACETS: Record<EntryId, Facet> = {
  casual: {
    path: "M234 24 8 388 197 272 234 208Z",
    innerEdge: "M234 208 197 272",
    centerX: 164,
    centerY: 207,
  },
  focused: {
    path: "M20 400 460 400 276 284 204 284Z",
    innerEdge: "M204 284H276",
    centerX: 240,
    centerY: 337,
  },
  competitive: {
    path: "M246 24 472 388 283 272 246 208Z",
    innerEdge: "M246 208 283 272",
    centerX: 316,
    centerY: 207,
  },
};

export default function RealmsEntrySelector({ value, onChange }: EntrySelectorProps) {
  const reduce = useReducedMotion();
  const surfaceId = useId().replace(/:/g, "");
  const buttonRefs = useRef<Record<EntryId, SVGGElement | null>>({
    casual: null,
    focused: null,
    competitive: null,
  });

  const selectedEntry = entries.find((e) => e.id === value) || entries[0];

  function handleKeyDown(event: KeyboardEvent<SVGGElement>, currentId: EntryId) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onChange(currentId, "keyboard");
      return;
    }
    const currentIndex = entries.findIndex((e) => e.id === currentId);
    let nextIndex: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (currentIndex + 1) % entries.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (currentIndex + entries.length - 1) % entries.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = entries.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const nextEntry = entries[nextIndex];
    onChange(nextEntry.id, "keyboard");
    buttonRefs.current[nextEntry.id]?.focus();
  }

  // Only light and surface emphasis change; the facets stay in place.
  const surfaceTransition = reduce
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className="realms-selector-wrapper">
      <div className="realms-triangle-board-wrap">
        <svg
          className="realms-triangle-board"
          viewBox="0 0 480 430"
          role="tablist"
          aria-label="Find your way into Realms"
        >
          <defs>
            {entries.map((entry) => (
              <linearGradient key={entry.id} id={`${surfaceId}-${entry.id}`} x1="0" y1="0" x2=".8" y2="1">
                <stop offset="0%" stopColor={THEMES[entry.id].surface} />
                <stop offset="100%" stopColor="#10191b" />
              </linearGradient>
            ))}
          </defs>
          {entries.map((entry) => {
            const isSelected = value === entry.id;
            const facet = FACETS[entry.id];
            const theme = THEMES[entry.id];
            const focalCenter = ICON_FOCAL_CENTERS[entry.id];

            return (
              <g
                key={entry.id}
                ref={(node) => {
                  buttonRefs.current[entry.id] = node;
                }}
                role="tab"
                id={`entry-${entry.id}`}
                aria-selected={isSelected}
                aria-controls={`path-${entry.id}`}
                aria-label={entry.label}
                tabIndex={isSelected ? 0 : -1}
                className={`realms-tri-sector realms-tri-sector--${entry.id} ${
                  isSelected ? "is-selected" : "is-unselected"
                }`}
                onClick={() => onChange(entry.id, "pointer")}
                onKeyDown={(e) => handleKeyDown(e, entry.id)}
              >
                <motion.path
                  initial={false}
                  d={facet.path}
                  fill="#101819"
                  strokeLinejoin="round"
                  className="realms-tri-path-base"
                  animate={{ stroke: isSelected ? theme.line : "#34413d" }}
                  transition={surfaceTransition}
                />
                <motion.path
                  initial={false}
                  d={facet.path}
                  fill={`url(#${surfaceId}-${entry.id})`}
                  className="realms-tri-surface"
                  animate={{ opacity: isSelected ? 1 : 0.25 }}
                  transition={surfaceTransition}
                  aria-hidden="true"
                />
                <motion.path
                  initial={false}
                  d={facet.innerEdge}
                  className="realms-tri-inner-edge"
                  stroke={theme.accent}
                  animate={{ opacity: isSelected ? 1 : 0.12 }}
                  transition={surfaceTransition}
                  aria-hidden="true"
                />
                <g transform={`translate(${facet.centerX}, ${facet.centerY})`} className="realms-tri-content">
                  {/* Optical centers keep the bespoke gateways aligned. */}
                  <motion.g
                    transform="translate(0, -13) scale(.36)"
                    className="realms-tri-icon-group"
                    initial={false}
                    animate={{
                      color: theme.accent,
                      opacity: isSelected ? 1 : 0.7,
                    }}
                    transition={surfaceTransition}
                  >
                    <g transform={`translate(${focalCenter.x}, ${focalCenter.y})`}>
                      <GatewayPaths kind={entry.id} />
                    </g>
                  </motion.g>

                  {/* Mode Label */}
                  <motion.text
                    initial={false}
                    x={entry.id === "competitive" ? 8 : 0}
                    y="49"
                    textAnchor="middle"
                    className="realms-tri-label"
                    animate={{
                      fill: isSelected ? "#edf1ef" : "#b2bdb7",
                      fontSize: 17,
                      fontWeight: 500,
                    }}
                    transition={surfaceTransition}
                  >
                    {entry.label}
                  </motion.text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* A quiet caption connects the selection to its purpose. */}
      <div className="realms-triangle-desc-wrapper" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedEntry.id}
            initial={reduce ? false : { opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`realms-triangle-desc realms-triangle-desc--${selectedEntry.id}`}
          >
            <span
              className="realms-desc-dot"
              style={{ backgroundColor: THEMES[selectedEntry.id].accent }}
              aria-hidden="true"
            />
            <span className="realms-desc-text">{selectedEntry.reason}</span>
            <svg className="realms-desc-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
