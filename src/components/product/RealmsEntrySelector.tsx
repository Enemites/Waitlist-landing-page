import { useRef, type KeyboardEvent } from "react";
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

// Solid, mature, professional dark-mode palettes (no AI neon glow)
const THEMES: Record<
  EntryId,
  {
    accent: string;
    textAccent: string;
    activeFill: string;
    inactiveFill: string;
    inactiveLine: string;
    activeLine: string;
    detail: string;
  }
> = {
  focused: {
    accent: "#a3e635",       // Solid lime (precise, executive)
    textAccent: "#cbfb60",
    activeFill: "#122018",   // Solid dark forest obsidian
    inactiveFill: "#0e1413", // Solid dark graphite
    inactiveLine: "#25332e", // Solid dark slate border
    activeLine: "#a3e635",   // Crisp solid 1.5px border
    detail: "#526e5e",
  },
  casual: {
    accent: "#a59df0",       // Solid refined periwinkle-violet
    textAccent: "#c7c1ff",
    activeFill: "#151627",   // Solid deep slate-indigo
    inactiveFill: "#0e1413",
    inactiveLine: "#25332e",
    activeLine: "#a59df0",
    detail: "#5d5c7c",
  },
  competitive: {
    accent: "#e5a74a",       // Solid warm bronze-gold
    textAccent: "#fcd38d",
    activeFill: "#1f1710",   // Solid deep bronze obsidian
    inactiveFill: "#0e1413",
    inactiveLine: "#25332e",
    activeLine: "#e5a74a",
    detail: "#735c40",
  },
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

type SlotType = "top" | "bottom-left" | "bottom-right";

type SlotDef = {
  path: string;
  centerX: number;
  centerY: number;
  iconOffsetY: number;
  iconScale: number;
  labelOffsetY: number;
  labelSize: number;
  labelWeight: number;
};

const SLOTS: Record<SlotType, SlotDef> = {
  top: {
    // Top apex: (210, 8), right base (324, 186), left base (96, 186)
    path: "M 210,8 L 210,8 L 324,186 L 96,186 Z",
    centerX: 210, // Exact dead-center matching apex at X=210
    centerY: 122,
    iconOffsetY: -34,
    iconScale: 0.27,
    labelOffsetY: 26,
    labelSize: 17,
    labelWeight: 600,
  },
  "bottom-left": {
    // Bottom-left wing: top (90, 194) to (205, 194), bottom (205, 320) to (8, 320)
    path: "M 90,194 L 205,194 L 205,320 L 8,320 Z",
    centerX: 148, // Nudged inward towards center (balanced margin from outer edge)
    centerY: 256,
    iconOffsetY: -20,
    iconScale: 0.23,
    labelOffsetY: 24,
    labelSize: 14.5,
    labelWeight: 500,
  },
  "bottom-right": {
    // Bottom-right wing: top (215, 194) to (330, 194), bottom (412, 320) to (215, 320)
    path: "M 215,194 L 330,194 L 412,320 L 215,320 Z",
    centerX: 272, // Nudged inward towards center (symmetrical with X=148 around X=210)
    centerY: 256,
    iconOffsetY: -20,
    iconScale: 0.23,
    labelOffsetY: 24,
    labelSize: 14.5,
    labelWeight: 500,
  },
};

export default function RealmsEntrySelector({ value, onChange }: EntrySelectorProps) {
  const reduce = useReducedMotion();
  const buttonRefs = useRef<Record<EntryId, SVGGElement | null>>({
    casual: null,
    focused: null,
    competitive: null,
  });

  const selectedEntry = entries.find((e) => e.id === value) || entries[0];
  const unselectedEntries = entries.filter((e) => e.id !== value);

  function handleKeyDown(event: KeyboardEvent<SVGGElement>, currentId: EntryId) {
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

  // Smooth, fluid motion transition
  const morphTransition = reduce
    ? { duration: 0 }
    : { duration: 0.44, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className="realms-selector-wrapper">
      <div className="realms-triangle-board-wrap">
        <svg
          className="realms-triangle-board"
          viewBox="0 0 420 330"
          role="tablist"
          aria-label="Find your way into Realms"
        >
          {entries.map((entry) => {
            const isSelected = value === entry.id;
            let slot: SlotType = "top";
            if (!isSelected) {
              slot = unselectedEntries[0].id === entry.id ? "bottom-left" : "bottom-right";
            }
            const slotDef = SLOTS[slot];
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
                } slot--${slot}`}
                onClick={() => onChange(entry.id, "pointer")}
                onKeyDown={(e) => handleKeyDown(e, entry.id)}
              >
                {/* Solid Sector Triangle Path with Smooth Morphing and Precise Border */}
                <motion.path
                  d={slotDef.path}
                  strokeLinejoin="round"
                  className="realms-tri-path-base"
                  animate={{
                    d: slotDef.path,
                    fill: isSelected ? theme.activeFill : theme.inactiveFill,
                    stroke: isSelected ? theme.activeLine : theme.inactiveLine,
                    strokeWidth: isSelected ? 1.8 : 1.2,
                  }}
                  transition={morphTransition}
                />

                {/* Sliding Icon & Label Content Group */}
                <motion.g
                  animate={{
                    x: slotDef.centerX,
                    y: slotDef.centerY,
                  }}
                  transition={morphTransition}
                  className="realms-tri-content"
                >
                  {/* Gateway Icon - Centered using optical focal coordinate */}
                  <motion.g
                    transform={`translate(0, ${slotDef.iconOffsetY}) scale(${slotDef.iconScale})`}
                    className="realms-tri-icon-group"
                    animate={{
                      color: isSelected ? theme.accent : "#82908a",
                      opacity: isSelected ? 1 : 0.75,
                    }}
                    transition={morphTransition}
                  >
                    <g transform={`translate(${focalCenter.x}, ${focalCenter.y})`}>
                      <GatewayPaths kind={entry.id} />
                    </g>
                  </motion.g>

                  {/* Mode Label */}
                  <motion.text
                    x="0"
                    y={slotDef.labelOffsetY}
                    textAnchor="middle"
                    className="realms-tri-label"
                    animate={{
                      fill: isSelected ? theme.textAccent : "#9ea8a4",
                      fontSize: slotDef.labelSize,
                      fontWeight: slotDef.labelWeight,
                    }}
                    transition={morphTransition}
                  >
                    {entry.label}
                  </motion.text>
                </motion.g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Solid Description Pill Below Triangle */}
      <div className="realms-triangle-desc-wrapper">
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
