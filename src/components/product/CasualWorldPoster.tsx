import { useId, type ReactNode } from "react";

/*
 * World posters for the Casual path: flat, layered landscapes in the manner of a travel poster.
 * Every poster is drawn on a 1200 x 1000 canvas and shown with "slice", so the same drawing works
 * as a 9:16 reel (the middle 562 units) and as a wide card (the middle 675 rows). Keep the subject
 * inside x 330-870, y 170-830. Geometry is seeded, so the server render and hydration match.
 */

export type WorldId = "orchard" | "observatory" | "lift" | "delta";

export type World = { id: WorldId; name: string; short: string; genre: string; color: string };

export const worlds: World[] = [
  { id: "orchard", name: "The Glass Orchard", short: "Glass Orchard", genre: "Mystery", color: "#ff7a59" },
  { id: "observatory", name: "The Salt Observatory", short: "Salt Observatory", genre: "Chase", color: "#3ee6c8" },
  { id: "lift", name: "The Last Lift", short: "Last Lift", genre: "Rescue", color: "#7fb2ff" },
  { id: "delta", name: "The Lantern Delta", short: "Lantern Delta", genre: "Quest", color: "#ffb23f" },
];

export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ridge = { d: string; at: (x: number) => number };

/** A horizon line from layered sines. "peaks" folds them for sharp summits. */
export function ridge(seed: number, base: number, amp: number, kind: "soft" | "peaks" = "soft", wave = 1): Ridge {
  const random = seeded(seed);
  const parts = [0, 1, 2].map(i => ({ f: (0.004 + random() * 0.003) * (i + 1) * wave, p: random() * Math.PI * 2, w: [0.55, 0.3, 0.15][i] }));
  const at = (x: number) => {
    let v = 0;
    for (const part of parts) {
      const s = Math.sin(x * part.f + part.p);
      v += part.w * (kind === "peaks" ? 1 - Math.abs(s) * 2 : s);
    }
    return base - amp * v;
  };
  let d = "M-20 1000";
  for (let x = -20; x <= 1220; x += 12) d += `L${x} ${at(x).toFixed(1)}`;
  return { d: `${d}L1220 1000Z`, at };
}

function particles(seed: number, count: number, box: [number, number, number, number]) {
  const random = seeded(seed);
  return Array.from({ length: count }, () => ({
    x: Math.round(box[0] + random() * (box[2] - box[0])),
    y: Math.round(box[1] + random() * (box[3] - box[1])),
    r: +(0.8 + random() * 2.2).toFixed(2),
    o: +(0.35 + random() * 0.6).toFixed(2),
    delay: -Math.round(random() * 9000),
    dur: Math.round(7000 + random() * 8000),
  }));
}

function Orchard({ id }: { id: (name: string) => string }) {
  const far = ridge(11, 640, 40);
  const mid = ridge(12, 700, 46);
  const near = ridge(13, 812, 60);
  const trees = [
    { x: 420, s: 0.55, on: mid }, { x: 498, s: 0.72, on: mid }, { x: 778, s: 0.62, on: mid },
    { x: 600, s: 1.15, on: near }, { x: 846, s: 0.9, on: near }, { x: 370, s: 0.85, on: near },
  ];
  const motes = particles(14, 26, [320, 380, 880, 820]);
  return <>
    <rect width="1200" height="1000" fill={`url(#${id("sky")})`} />
    <circle cx="600" cy="610" r="190" fill="#ffe7c2" opacity=".14" />
    <circle cx="600" cy="610" r="140" fill="#fff0d6" />
    <g fill="#ffd8a8" opacity=".55">
      <rect x="380" y="560" width="440" height="6" rx="3" /><rect x="420" y="588" width="360" height="5" rx="2.5" /><rect x="460" y="614" width="280" height="4" rx="2" />
    </g>
    <path d={far.d} fill="#c95a6b" />
    <path d={mid.d} fill="#93345c" />
    {trees.slice(0, 3).map((t, i) => <GlassTree key={i} x={t.x} y={t.on.at(t.x)} s={t.s} />)}
    <path d={near.d} fill="#561b45" />
    {trees.slice(3).map((t, i) => <GlassTree key={i} x={t.x} y={t.on.at(t.x)} s={t.s} />)}
    <path d="M520 1000C560 900 600 870 640 812" fill="none" stroke="#ffcfa0" strokeWidth="3" strokeDasharray="2 14" strokeLinecap="round" opacity=".7" />
    <g className="wp-rise" fill="#fff3dd">
      {motes.map((m, i) => <circle key={i} cx={m.x} cy={m.y} r={m.r} opacity={m.o} style={{ animationDelay: `${m.delay}ms`, animationDuration: `${m.dur}ms` }} />)}
    </g>
  </>;
}

function GlassTree({ x, y, s }: { x: number; y: number; s: number }) {
  return <g transform={`translate(${x} ${y + 4}) scale(${s})`}>
    <path d="M0 0V-92M0-46l-22-24M0-62l18-20" stroke="#ffe2c4" strokeWidth="4" strokeLinecap="round" fill="none" />
    <g className="wp-chime" fill="#fff6ea" fillOpacity=".16" stroke="#fff1de" strokeWidth="2.4">
      <circle cx="-26" cy="-96" r="34" /><circle cx="22" cy="-112" r="40" /><circle cx="-4" cy="-150" r="36" />
    </g>
    <path d="M-38-112a22 22 0 0 1 14-14M8-140a26 26 0 0 1 16-12" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".75" />
  </g>;
}

function Observatory({ id }: { id: (name: string) => string }) {
  const far = ridge(21, 664, 22, "soft", 0.6);
  const mid = ridge(22, 720, 34, "soft", 0.8);
  const near = ridge(23, 836, 52, "soft", 0.7);
  const stars = particles(24, 60, [300, 120, 900, 600]);
  const domeX = 690;
  const domeY = mid.at(domeX);
  return <>
    <rect width="1200" height="1000" fill={`url(#${id("sky")})`} />
    <g className="wp-twinkle" fill="#e6fff8">
      {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.7} opacity={s.o} style={{ animationDelay: `${s.delay}ms` }} />)}
    </g>
    {/* Where the missing star used to be */}
    <circle cx="748" cy="262" r="16" fill="none" stroke="#8ff2da" strokeWidth="2" strokeDasharray="3 6" opacity=".9" />
    <g transform="translate(470 350) rotate(-18)">
      <circle r="150" fill="#9ff3dc" opacity=".08" />
      <path d="M-170 0a170 38 0 0 1 340 0" fill="none" stroke="#c7fff0" strokeWidth="5" opacity=".5" />
      <circle r="96" fill={`url(#${id("planet")})`} />
      <path d="M170 0a170 38 0 0 1-340 0" fill="none" stroke="#e8fff8" strokeWidth="6" />
    </g>
    <path d={far.d} fill="#2e6f78" />
    <path d={mid.d} fill="#8fc9c0" />
    <path d={`M${domeX - 300} ${domeY + 40}L${domeX - 80} ${domeY + 6}`} stroke="#d9fff4" strokeWidth="2" opacity=".5" />
    <g transform={`translate(${domeX} ${domeY + 4})`}>
      <path className="wp-beam" d="M-6-70L58-420L94-412L10-70Z" fill="#c2fff0" opacity=".16" />
      <rect x="-52" y="-34" width="104" height="38" fill="#1a3f48" />
      <path d="M-58-34a58 58 0 0 1 116 0Z" fill="#e8fff9" />
      <path d="M-6-90L10-90L14-34H-2Z" fill="#1a3f48" />
      <rect x="-12" y="-22" width="12" height="18" fill="#ffe9a6" />
    </g>
    <path d={near.d} fill="#d8f2ec" />
    <g fill="#a9d6cd" opacity=".9">
      <path d="M380 902l120-14M640 930l170-18M330 960l90-8" stroke="#a9d6cd" strokeWidth="3" strokeLinecap="round" />
    </g>
    <path className="wp-fall" d="M790 230l-80 64" stroke="#e9fff9" strokeWidth="3" strokeLinecap="round" />
  </>;
}

function Lift({ id }: { id: (name: string) => string }) {
  const far = ridge(31, 560, 120, "peaks", 0.9);
  const mid = ridge(32, 690, 110, "peaks", 1.1);
  const near = ridge(33, 860, 70, "soft", 1);
  const snow = particles(34, 44, [300, 140, 900, 940]);
  const a = { x: 330, y: 330 };
  const b = { x: 900, y: 270 };
  const cable = `M${a.x} ${a.y}Q615 ${(a.y + b.y) / 2 + 74} ${b.x} ${b.y}`;
  return <>
    <rect width="1200" height="1000" fill={`url(#${id("sky")})`} />
    <circle cx="740" cy="300" r="64" fill="#fff7ee" opacity=".9" />
    <path d={far.d} fill="#b4bfdc" />
    <rect className="wp-fog" x="-200" y="520" width="1600" height="150" fill={`url(#${id("fog")})`} opacity=".8" />
    <path d={mid.d} fill="#6e7fb3" />
    <rect className="wp-fog wp-fog-slow" x="-300" y="650" width="1700" height="190" fill={`url(#${id("fog")})`} opacity=".65" />
    <path d={near.d} fill="#2e3768" />
    <path d={`M${a.x} ${a.y}V1000M${b.x} ${b.y}V1000`} stroke="#1c2350" strokeWidth="10" />
    <path d={`M${a.x - 24} ${a.y}h48M${b.x - 24} ${b.y}h48`} stroke="#1c2350" strokeWidth="8" strokeLinecap="round" />
    <path d={cable} fill="none" stroke="#1c2350" strokeWidth="3" />
    <path d={cable} fill="none" stroke="#1c2350" strokeWidth="2" transform="translate(0 14)" />
    <g className="wp-sway" style={{ transformOrigin: "604px 337px" }}>
      <path d="M604 337V376" stroke="#1c2350" strokeWidth="4" />
      <rect x="566" y="376" width="78" height="66" rx="12" fill="#ff5a3d" />
      <rect x="576" y="390" width="58" height="22" rx="5" fill="#ffd9c9" />
      <path d="M605 390v22" stroke="#ff5a3d" strokeWidth="4" />
      <rect x="566" y="428" width="78" height="6" fill="#c63a26" />
    </g>
    <g className="wp-snow" fill="#ffffff">
      {snow.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} style={{ animationDelay: `${s.delay}ms`, animationDuration: `${s.dur}ms` }} />)}
    </g>
  </>;
}

function Delta({ id }: { id: (name: string) => string }) {
  const far = ridge(41, 600, 18, "soft", 0.7);
  const random = seeded(42);
  const lanterns = Array.from({ length: 16 }, () => {
    const depth = random();
    return { x: Math.round(340 + random() * 520), y: Math.round(250 + depth * 420), s: +(0.45 + depth * 0.75).toFixed(2), delay: -Math.round(random() * 12000), dur: Math.round(12000 + random() * 9000) };
  });
  const house = (x: number, w: number, h: number, flip = false) => <g transform={`translate(${x} 640)${flip ? " scale(-1 1)" : ""}`}>
    <path d={`M0 0V${-h}l${w / 2} ${-w * 0.42}l${w / 2} ${w * 0.42}V0Z`} fill="#160a26" />
    <path d={`M${w * 0.15} 0v70M${w * 0.85} 0v70M${w * 0.5} 0v70`} stroke="#160a26" strokeWidth="6" />
    <rect x={w * 0.36} y={-h * 0.7} width={w * 0.24} height={h * 0.3} fill="#ffb253" />
  </g>;
  return <>
    <rect width="1200" height="1000" fill={`url(#${id("sky")})`} />
    <circle cx="610" cy="420" r="210" fill="#ff9b5a" opacity=".07" />
    <path d={far.d} fill="#2a1240" />
    <rect x="0" y="640" width="1200" height="360" fill={`url(#${id("water")})`} />
    {house(330, 110, 90)}{house(430, 80, 60)}{house(870, 120, 100, true)}{house(760, 70, 54, true)}
    <g fill="#ffb253" opacity=".5">
      {lanterns.map((l, i) => <rect key={i} x={l.x - 2} y={660 + (l.y - 250) * 0.4} width={4 * l.s} height={40 * l.s} rx="2" />)}
    </g>
    <g className="wp-drift">
      {lanterns.map((l, i) => <g key={i} transform={`translate(${l.x} ${l.y}) scale(${l.s})`}>
        <g className="wp-lantern" style={{ animationDelay: `${l.delay}ms`, animationDuration: `${l.dur}ms` }}>
          <circle r="34" fill="#ff9b4a" opacity=".18" />
          <rect x="-13" y="-17" width="26" height="34" rx="9" fill="#ffc275" />
          <rect x="-8" y="-10" width="16" height="20" rx="6" fill="#fff0c9" />
        </g>
      </g>)}
    </g>
    <path d="M300 760h180M560 800h230M700 870h120M380 900h150" stroke="#ff9b5a" strokeWidth="3" strokeLinecap="round" opacity=".35" />
  </>;
}

const skies: Record<WorldId, { stops: [string, string][]; extra?: ReactNode }> = {
  orchard: { stops: [["0", "#2b1030"], [".45", "#a53a5c"], [".66", "#ff8a62"], ["1", "#ffc48c"]] },
  observatory: { stops: [["0", "#040b18"], [".55", "#0c3140"], [".72", "#1f6170"], ["1", "#2c7a80"]] },
  lift: { stops: [["0", "#9eb4e6"], [".5", "#dcdff2"], ["1", "#fbe9df"]] },
  delta: { stops: [["0", "#07041a"], [".5", "#26103f"], [".64", "#5a1d4f"], ["1", "#120624"]] },
};

const scenes: Record<WorldId, (props: { id: (name: string) => string }) => ReactNode> = { orchard: Orchard, observatory: Observatory, lift: Lift, delta: Delta };

export default function CasualWorldPoster({ world, label }: { world: WorldId; label?: string }) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `wp-${uid}-${name}`;
  const Scene = scenes[world];
  return <svg className="world-poster" data-world={world} viewBox="0 0 1200 1000" preserveAspectRatio="xMidYMid slice" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    <defs>
      <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
        {skies[world].stops.map(([offset, color]) => <stop key={offset} offset={offset} stopColor={color} />)}
      </linearGradient>
      <radialGradient id={id("planet")} cx=".35" cy=".3" r=".8">
        <stop offset="0" stopColor="#f2fffb" /><stop offset=".6" stopColor="#9fe6d3" /><stop offset="1" stopColor="#3d8f8a" />
      </radialGradient>
      <linearGradient id={id("fog")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f6f1f2" stopOpacity="0" /><stop offset=".5" stopColor="#f6f1f2" stopOpacity=".85" /><stop offset="1" stopColor="#f6f1f2" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={id("water")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3b1446" /><stop offset="1" stopColor="#0b0418" />
      </linearGradient>
    </defs>
    <Scene id={id} />
  </svg>;
}
