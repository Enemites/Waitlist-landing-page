import type { CSSProperties } from "react";

/**
 * Scenery around the entry map: each mode gets its own surroundings, not just a recolored map.
 * Casual is a moonlit night over distant ridges, Focused is a lens drawn tight on one summit,
 * Competitive is an arena with banners and crossing floodlights. All decorative.
 */

// Deterministic ridgeline so the prerendered page and the client agree.
function ridge(seed: number, base: number, amp: number, width = 1440, height = 240) {
  const points: string[] = [];
  for (let x = -60; x <= width + 60; x += 24) {
    const t = x / width;
    const y =
      base -
      amp *
        (0.6 * Math.pow(Math.abs(Math.sin(t * 4.3 + seed)), 1.6) +
          0.3 * Math.pow(Math.abs(Math.sin(t * 11.1 + seed * 2.3)), 1.3) +
          0.12 * Math.sin(t * 31.3 + seed * 4.1));
    points.push(`${x} ${y.toFixed(1)}`);
  }
  return `M-60 ${height}L${points.join("L")}L${width + 60} ${height}Z`;
}

function CasualScenery() {
  return (
    <>
      <span className="scn-moon" />
      <span className="scn-cloud scn-cloud--a" />
      <span className="scn-cloud scn-cloud--b" />
      <svg className="scn-ridges" viewBox="0 0 1440 240" preserveAspectRatio="none">
        <defs>
          <linearGradient id="scn-ridge-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a0e20" />
            <stop offset="1" stopColor="#0c1123" />
          </linearGradient>
        </defs>
        <g className="scn-ridge scn-ridge--far">
          <path d={ridge(1.2, 150, 120)} fill="#131a37" />
          <path d={ridge(1.2, 150, 120).replace(/Z$/, "")} className="scn-ridge-rim" />
        </g>
        <g className="scn-ridge scn-ridge--mid">
          <path d={ridge(3.4, 190, 90)} fill="#0e142b" />
        </g>
        <path d={ridge(5.9, 226, 48)} fill="url(#scn-ridge-front)" />
      </svg>
    </>
  );
}

function FocusedScenery({ travel }: { travel: number }) {
  const ticks = Array.from({ length: 41 }, (_, i) => i);
  return (
    <>
      <svg className="scn-lens" viewBox="-400 -400 800 800">
        <circle r="120" className="scn-lens-ring" />
        <circle r="210" className="scn-lens-ring scn-lens-ring--faint" />
        <g className="scn-lens-dial">
          <circle r="300" className="scn-lens-ring scn-lens-ring--dash" />
        </g>
        <g className="scn-lens-dial scn-lens-dial--reverse">
          {Array.from({ length: 72 }, (_, i) => (
            <line key={i} x1="0" y1={i % 6 === 0 ? -372 : -380} x2="0" y2="-388" transform={`rotate(${i * 5})`} className="scn-lens-tick" />
          ))}
        </g>
        <path d="M-396 0h60M336 0h60M0 -396v60M0 336v60" className="scn-lens-cross" />
      </svg>
      <svg className="scn-altimeter" viewBox="0 0 48 400" preserveAspectRatio="xMidYMid meet">
        {ticks.map((i) => (
          <line key={i} x1={i % 5 === 0 ? 14 : 22} x2="32" y1={i * 10} y2={i * 10} className={i % 5 === 0 ? "scn-alt-major" : "scn-alt-minor"} />
        ))}
        <line x1="32" x2="32" y1="0" y2="400" className="scn-alt-rail" />
        {/* Climbs in step with the route traveler (same duration, same document clock). */}
        <g className="scn-alt-marker">
          <path d="M36 0l10 -6v12Z" />
          <line x1="8" x2="32" y1="0" y2="0" />
          <animateTransform attributeName="transform" type="translate" dur={`${travel}s`} repeatCount="indefinite" values="0 400;0 0" />
        </g>
      </svg>
    </>
  );
}

const banner = (style: CSSProperties) => style;

function CompetitiveScenery() {
  return (
    <>
      <span className="scn-flood scn-flood--left" />
      <span className="scn-flood scn-flood--right" />
      <svg className="scn-arena" viewBox="0 0 1440 260" preserveAspectRatio="none">
        {[0, 1, 2, 3].map((i) => (
          <ellipse key={i} cx="790" cy={300} rx={720 - i * 130} ry={190 - i * 34} className={`scn-tier scn-tier--${i}`} />
        ))}
      </svg>
      <div className="scn-banners">
        <svg className="scn-banner scn-banner--you" viewBox="0 0 60 150" style={banner({ animationDelay: "-.4s" })}>
          <path d="M0 0h60v150l-30-22-30 22Z" />
          <path d="M30 52l12 12-12 12-12-12Z" className="scn-banner-mark" />
        </svg>
        <svg className="scn-banner scn-banner--rival" viewBox="0 0 60 150" style={banner({ animationDelay: "-1.3s" })}>
          <path d="M0 0h60v150l-30-22-30 22Z" />
          <circle cx="30" cy="64" r="10" className="scn-banner-mark scn-banner-mark--ring" />
        </svg>
      </div>
      <span className="scn-haze" />
    </>
  );
}

export default function RealmsEntryScenery({ travel }: { travel: { focused: number } }) {
  return (
    <div className="realms-atmos" aria-hidden="true">
      <div className="realms-atmos-layer realms-atmos-layer--casual"><CasualScenery /></div>
      <div className="realms-atmos-layer realms-atmos-layer--focused"><FocusedScenery travel={travel.focused} /></div>
      <div className="realms-atmos-layer realms-atmos-layer--competitive"><CompetitiveScenery /></div>
    </div>
  );
}
