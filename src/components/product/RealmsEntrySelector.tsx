import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUpRight } from "lucide-react";

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

/** Bespoke thresholds: an arch, an aligned passage, and two opposing approaches. */
function GatewayArt({ kind }: { kind: EntryId }) {
  return <svg className="realms-gate-art" viewBox="0 0 160 144" fill="none" aria-hidden="true" focusable="false">
    {kind === "casual" ? <>
      <path className="gate-art-far" d="M29 121V65a49 49 0 0 1 98 0v56M38 121V66a40 40 0 0 1 80 0v55" />
      <path className="gate-art-door" d="M48 121V67a30 30 0 0 1 60 0v54Z" />
      <path className="gate-art-detail" d="M29 121h98m-49-17-48 29m48-29 49 29" />
      <path className="gate-art-path" d="M78 121c-14-18 14-27 0-45" />
      <path className="gate-art-moon" d="M93 50a10 10 0 1 0 5 18 11 11 0 0 1-5-18Z" />
      <circle className="gate-art-point" cx="61" cy="64" r="1.5" />
    </> : kind === "focused" ? <>
      <path className="gate-art-far" d="M24 121V34h94v87M24 34l22-15h94v88l-22 14m0-87 22-15" />
      <path className="gate-art-door" d="M42 121V49h58v72Z" />
      <path className="gate-art-detail" d="M54 121V61h34v60M24 121h94M11 68h14m86 0h16M71 8v15" />
      <path className="gate-art-path" d="M71 136V95m-5 6 5-6 5 6" />
      <path className="gate-art-point" d="M68 72h6v6h-6Z" />
    </> : <>
      <path className="gate-art-far" d="m17 121 27-96h25M143 121l-27-96H91" />
      <path className="gate-art-door" d="m27 121 23-81h18l-9 21H51l-16 60ZM133 121l-23-81H92l9 21h8l16 60Z" />
      <path className="gate-art-detail" d="M17 121h126M80 26v17m0 76v17M36 80h15m58 0h15" />
      <path className="gate-art-path" d="m62 81 18-24 18 24-18 24Z" />
      <path className="gate-art-point" d="m74 81 6-8 6 8-6 8Z" />
    </>}
  </svg>;
}

export default function RealmsEntrySelector({ value, onChange }: EntrySelectorProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [vertical, setVertical] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setVertical(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown": next = (index + 1) % entries.length; break;
      case "ArrowLeft":
      case "ArrowUp": next = (index + entries.length - 1) % entries.length; break;
      case "Home": next = 0; break;
      case "End": next = entries.length - 1; break;
      default: return;
    }
    event.preventDefault();
    onChange(entries[next].id, "keyboard");
    buttons.current[next]?.focus();
  }

  return <div className="realms-gateway-selector" role="tablist" aria-label="Find your way into Realms" aria-orientation={vertical ? "vertical" : "horizontal"}>
    {entries.map((entry, index) => <button
      key={entry.id}
      ref={(node) => { buttons.current[index] = node; }}
      type="button"
      role="tab"
      id={`entry-${entry.id}`}
      className={`realms-gateway realms-gateway--${entry.id}`}
      aria-selected={value === entry.id}
      aria-controls={`path-${entry.id}`}
      tabIndex={value === entry.id ? 0 : -1}
      onClick={() => onChange(entry.id, "pointer")}
      onKeyDown={(event) => handleKeyDown(event, index)}
    >
      <span className="realms-gate-copy"><span className="realms-gate-label">{entry.label}</span><span className="realms-gate-reason">{entry.reason}</span></span>
      <GatewayArt kind={entry.id} />
      <span className="realms-gate-current" aria-hidden="true"><i />Selected</span>
      <ArrowUpRight className="realms-gate-arrow" size={17} strokeWidth={1.5} aria-hidden="true" />
    </button>)}
  </div>;
}
