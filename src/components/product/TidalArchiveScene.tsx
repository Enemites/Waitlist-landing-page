import { useId } from "react";
import { seeded } from "./casualArt";

/*
 * The Tidal Archive, drawn once on a 1200 x 1000 canvas and shown with "slice", so it fills a wide
 * portal and a 9:16 reel alike. The camera moves with the story beat and the world answers the choice:
 * a voice answers from the far shore, the crossing rises, or stepping stones light the way below.
 */

export type ArchiveBeat = "arrive" | "signal" | "choose" | "outcome";
export type ArchiveChoice = "relay" | "crossing" | "channel";

const HORIZON = 560;
const MOON = { x: 640, y: 330, r: 118 };
export const ARCHIVE_POINTS: Record<ArchiveChoice, { x: number; y: number }> = {
  relay: { x: 660, y: 284 },
  crossing: { x: 532, y: 546 },
  channel: { x: 800, y: 616 },
};

type Row = { open: string; glint: string; delay: number };
const seaRows: Row[] = (() => {
  const random = seeded(7);
  const rows: Row[] = [];
  for (let k = 0; k < 26; k += 1) {
    const y = HORIZON + 8 + k * 7 + k * k * 0.52;
    if (y > 1000) break;
    const spread = 40 + k * 11;
    let open = "";
    let glint = "";
    let x = random() * 40;
    while (x < 1200) {
      const length = 8 + random() * (18 + k * 3.4);
      const inPath = Math.abs(x + length / 2 - MOON.x) < spread * (0.55 + random() * 0.6);
      const segment = `M${x.toFixed(1)} ${y.toFixed(1)}h${length.toFixed(1)}`;
      if (inPath) glint += segment; else open += segment;
      x += length + (inPath ? 4 + random() * 9 : 14 + random() * (34 + k * 4));
    }
    rows.push({ open, glint, delay: Math.round(random() * 4000) });
  }
  return rows;
})();

const stars = (() => {
  const random = seeded(31);
  return Array.from({ length: 70 }, () => {
    const x = random() * 1200;
    const y = 30 + random() * 500;
    return { x: Math.round(x), y: Math.round(y), r: +(0.8 + random() * 1.3).toFixed(2), o: +(0.3 + random() * 0.6).toFixed(2), twinkle: random() > 0.6, delay: Math.round(random() * 5000), near: Math.hypot(x - MOON.x, y - MOON.y) < MOON.r + 30 };
  }).filter(star => !star.near);
})();

/** Stepping stones from the foreground to the opening under the east wing, larger as they come closer. */
const stones = [
  { x: 520, y: 900, w: 30 }, { x: 568, y: 852, w: 27 }, { x: 612, y: 808, w: 24 }, { x: 652, y: 768, w: 21 },
  { x: 688, y: 732, w: 18 }, { x: 720, y: 700, w: 16 }, { x: 748, y: 672, w: 14 }, { x: 772, y: 650, w: 12 },
];

export default function TidalArchiveScene({ beat = "arrive", choice = null, label }: { beat?: ArchiveBeat; choice?: ArchiveChoice | null; label?: string }) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `tas-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const outcome = beat === "outcome" ? choice : null;

  return <svg className="tidal-archive" data-beat={beat} data-outcome={outcome ?? "none"} viewBox="0 0 1200 1000" preserveAspectRatio="xMidYMid slice" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    <defs>
      <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#07081a" /><stop offset=".42" stopColor="#141533" /><stop offset=".56" stopColor="#2a2858" /><stop offset=".6" stopColor="#0f1020" /><stop offset="1" stopColor="#07080f" />
      </linearGradient>
      <radialGradient id={id("moon")} cx=".38" cy=".34" r=".75">
        <stop offset="0" stopColor="#f6f4ff" /><stop offset=".5" stopColor="#d5d0ff" /><stop offset="1" stopColor="#9d96e4" />
      </radialGradient>
      <radialGradient id={id("halo")}>
        <stop offset=".55" stopColor="#b9b3f5" stopOpacity=".32" /><stop offset=".78" stopColor="#8d87cf" stopOpacity=".08" /><stop offset="1" stopColor="#8d87cf" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id("glow")}>
        <stop offset="0" stopColor="#e6e3ff" stopOpacity=".9" /><stop offset="1" stopColor="#b9b3f5" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={id("tide-ends")} x1="0" x2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".12" stopColor="#fff" /><stop offset=".88" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <mask id={id("tide-mask")} maskUnits="userSpaceOnUse" x="400" y="500" width="400" height="120"><rect x="410" y="500" width="370" height="120" fill={url("tide-ends")} /></mask>
      <linearGradient id={id("tide")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1a1b33" stopOpacity=".96" /><stop offset=".3" stopColor="#0e0f1c" stopOpacity=".98" /><stop offset="1" stopColor="#0b0b14" />
      </linearGradient>
    </defs>
    <rect width="1200" height="1000" fill={url("sky")} />
    <g className="tas-camera">
      <g className="tas-drift">
        <g>{stars.map((s, i) => <circle key={i} className={s.twinkle ? "tas-twinkle" : undefined} cx={s.x} cy={s.y} r={s.r} fill="#dedbff" opacity={s.o} style={s.twinkle ? { animationDelay: `${s.delay}ms` } : undefined} />)}</g>
        <circle cx={MOON.x} cy={MOON.y} r={MOON.r * 1.5} fill={url("halo")} />
        <circle cx={MOON.x} cy={MOON.y} r={MOON.r} fill={url("moon")} />
        <g fill="#a49de9" opacity=".3"><circle cx="598" cy="296" r="17" /><circle cx="684" cy="276" r="9" /><circle cx="700" cy="362" r="22" /><circle cx="612" cy="380" r="8" /><circle cx="652" cy="414" r="11" /></g>

        {/* Sea */}
        <path d={`M0 ${HORIZON}H1200`} stroke="#8d87cf" strokeOpacity=".5" />
        <g fill="none" strokeLinecap="round">
          {seaRows.map((row, i) => <g key={i}>
            <path d={row.open} stroke="#5d5a86" strokeWidth={1 + i * 0.09} opacity={0.75 - i * 0.018} />
            <path className="tas-glint" d={row.glint} stroke="#d5d0ff" strokeWidth={1.1 + i * 0.12} style={{ animationDelay: `${row.delay}ms` }} />
          </g>)}
        </g>
        <path d={`M590 ${HORIZON + 4}h200l-14 120H604Z`} fill="#07080e" opacity=".85" />

        {/* The far shore, which can answer */}
        <path d={`M0 ${HORIZON + 2}C110 ${HORIZON - 12} 300 ${HORIZON - 16} 470 ${HORIZON - 4}L478 ${HORIZON + 4}H0Z`} fill="#090a12" />
        <path d={`M60 ${HORIZON - 9}C200 ${HORIZON - 18} 360 ${HORIZON - 15} 470 ${HORIZON - 4}`} fill="none" stroke="#6b67a0" strokeWidth="1.2" />
        <g transform={`translate(392 ${HORIZON - 16})`}>
          <path d="M-12 4V-22h24V4Z" fill="#0b0c15" />
          <path d="M0-22v-16" stroke="#0b0c15" strokeWidth="3" />
          <circle className="tas-answer" cx="0" cy="-40" r="4" fill="#ffffff" />
        </g>
        <g className="tas-answer-rings" fill="none" stroke="#e6e3ff" strokeWidth="1.4">
          <circle cx="392" cy={HORIZON - 56} r="8" /><circle cx="392" cy={HORIZON - 56} r="8" />
        </g>

        {/* The crossing */}
        <g className="tas-crossing">
          <g stroke="#0a0b12" strokeWidth="4"><path d={`M490 ${HORIZON - 4}v26M520 ${HORIZON - 5}v27M550 ${HORIZON - 6}v28M580 ${HORIZON - 7}v29`} /></g>
          <path d={`M470 ${HORIZON - 7}L604 ${HORIZON - 11}v6L470 ${HORIZON - 1}Z`} fill="#0a0b12" />
          <path d={`M470 ${HORIZON - 7}L604 ${HORIZON - 11}`} stroke="#8a84c8" strokeWidth="1.4" />
          <g className="tas-crossing-lights" fill="#e6e3ff"><circle cx="496" cy={HORIZON - 12} r="3" /><circle cx="532" cy={HORIZON - 13} r="3" /><circle cx="568" cy={HORIZON - 14} r="3" /></g>
        </g>

        {/* The lower channel: a rock under the archive's east wing, a sandbar, an opening at the waterline */}
        <path d={`M736 ${HORIZON + 6}C770 ${HORIZON + 20} 820 ${HORIZON + 34} 862 ${HORIZON + 86}L872 ${HORIZON + 104}H724Z`} fill="#0b0c14" />
        <path d="M772 640v-20a28 28 0 0 1 56 0v20Z" className="tas-arch" fill="#1b1c33" />
        <g className="tas-stones">
          {stones.map((stone, i) => <g key={i}>
            <ellipse cx={stone.x} cy={stone.y + stone.w * .18} rx={stone.w} ry={stone.w * .3} fill="#090a12" />
            <ellipse className="tas-stone-top" cx={stone.x} cy={stone.y} rx={stone.w * .92} ry={stone.w * .24} fill="#26253f" style={{ animationDelay: `${i * 160}ms` }} />
          </g>)}
        </g>

        {/* The archive */}
        <g>
          <path d={`M574 ${HORIZON + 4}l16-16h196l20 16Z`} fill="#090a10" />
          <path d={`M600 ${HORIZON - 12}V430h120v${HORIZON - 12 - 430}Z`} fill="#0a0b12" />
          <path d="M620 430v-20h80v20Z" fill="#0a0b12" />
          <path d={`M720 ${HORIZON - 12}V468h52v${HORIZON - 12 - 468}Z`} fill="#0c0d15" />
          <path d={`M600 ${HORIZON - 12}V430h20v-20h80v20h20v38h52v${HORIZON - 12 - 468}`} fill="none" stroke="#c9c4fb" strokeWidth="1.6" opacity=".75" />
          <g fill="#20223a"><rect x="614" y="446" width="7" height="30" /><rect x="630" y="446" width="7" height="30" /><rect x="684" y="446" width="7" height="30" /><rect x="700" y="446" width="7" height="30" /><rect x="734" y="482" width="6" height="22" /><rect x="750" y="482" width="6" height="22" /></g>
          <circle className="tas-reserve-glow" cx="660" cy="522" r="26" fill={url("glow")} />
          <rect className="tas-reserve" x="651" y="512" width="18" height="22" rx="2" fill="#e6e3ff" />
          <path d="M660 410V290M647 336h26M651 312h18" stroke="#0a0b12" strokeWidth="4.5" />
          <path d="M662 410V290" stroke="#c9c4fb" strokeWidth="1.2" opacity=".7" />
        </g>

        {/* The relay */}
        <g className="tas-signal" fill="none" stroke="#e6e3ff" strokeWidth="1.6">
          <circle cx="660" cy="284" r="10" /><circle cx="660" cy="284" r="10" /><circle cx="660" cy="284" r="10" />
        </g>
        <circle className="tas-beacon-halo" cx="660" cy="284" r="12" fill="#d5d0ff" opacity=".35" />
        <circle className="tas-beacon" cx="660" cy="284" r="5" fill="#ffffff" />

        {/* The tide, which rises with some choices */}
        <g mask={url("tide-mask")}>
          <g className="tas-tide">
            <rect x="410" y={HORIZON - 3} width="370" height="30" fill={url("tide")} />
            <path d={`M410 ${HORIZON - 3}H780`} stroke="#8d87cf" strokeWidth="1.4" strokeDasharray="18 8 4 8" opacity=".85" />
          </g>
        </g>
      </g>
    </g>
  </svg>;
}
