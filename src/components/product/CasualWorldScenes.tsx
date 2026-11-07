import { useId, type CSSProperties, type ReactNode } from "react";
import { Figure, particles, poses, ridge, seeded } from "./casualArt";

/*
 * More moods than night and quiet: a hill of kites with friends, a rooftop chase, a snowball war
 * between two teams, a funfair after dark, and a dive with something enormous passing overhead.
 * Rooftop Relay and Snowball Siege are playable in the reel: they take the story beat and the
 * choice and move their people accordingly. Colour lives here, in the worlds, not in the interface.
 */

export type SceneBeat = "arrive" | "signal" | "choose" | "outcome";
type Id = (name: string) => string;
const at = (x: number, y: number): CSSProperties => ({ transform: `translate(${x}px, ${y}px)` });

function Cloud({ x, y, s = 1, className = "wp-cloud", delay = 0 }: { x: number; y: number; s?: number; className?: string; delay?: number }) {
  return <g className={className} style={{ animationDelay: `${delay}s` }}>
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#ffffff">
      <circle cx="0" cy="0" r="34" /><circle cx="38" cy="-14" r="44" /><circle cx="84" cy="2" r="32" /><rect x="-20" y="0" width="122" height="30" rx="15" />
    </g>
  </g>;
}

/* ---------- Kite Hill: friends, wind, and five kites ---------- */
const kites = [
  { x: 430, y: 300, c: "#ff4d4d", hand: [500 + 24, 604 - 84], s: 1 },
  { x: 610, y: 225, c: "#ffd23f", hand: [668 - 24, 603 - 84], s: 1.1 },
  { x: 770, y: 330, c: "#8b5cf6", hand: [726 + 24, 606 - 84], s: .95 },
  { x: 540, y: 420, c: "#ff8a3d", hand: [500 + 24, 604 - 84], s: .7 },
];

export function KiteHill({ id }: { id: Id }) {
  const far = ridge(51, 700, 34, "soft", .8);
  return <>
    <defs>
      <linearGradient id={id("kite-sky")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b78f6" /><stop offset=".6" stopColor="#79c2ff" /><stop offset="1" stopColor="#c4e9ff" /></linearGradient>
    </defs>
    <rect width="1200" height="1000" fill={`url(#${id("kite-sky")})`} />
    <circle cx="390" cy="200" r="120" fill="#fff6c9" opacity=".25" />
    <circle cx="390" cy="200" r="62" fill="#fff8dc" />
    <Cloud x={560} y={160} s={.9} delay={-6} /><Cloud x={260} y={330} s={.7} delay={-14} /><Cloud x={780} y={420} s={.6} delay={-2} />
    <path d={far.d} fill="#63d07f" />
    <path d="M-20 1000V770C240 670 450 606 620 610C820 616 1000 690 1220 770V1000Z" fill="#34b35b" />
    <path d="M-20 1000V860C300 800 560 790 760 820S1080 880 1220 900V1000Z" fill="#2a9a4d" />
    <g stroke="#7fe39a" strokeWidth="4" strokeLinecap="round" opacity=".7"><path d="M380 700l8-16M396 702l4-18M720 690l6-16M736 694l2-17M560 900l6-18M574 902l2-18" /></g>
    {kites.map((k, i) => <g key={i}>
      <path d={`M${k.hand[0]} ${k.hand[1]}Q${(k.hand[0] + k.x) / 2 + 30} ${(k.hand[1] + k.y) / 2 + 40} ${k.x} ${k.y + 52 * k.s}`} fill="none" stroke="#0f2a3d" strokeWidth="1.6" opacity=".55" />
      <g className="wp-kite" style={{ transformOrigin: `${k.x}px ${k.y + 52 * k.s}px`, animationDelay: `${-i * 1.3}s` }}>
        <g transform={`translate(${k.x} ${k.y}) scale(${k.s})`}>
          <path d="M0-40L30 0L0 52L-30 0Z" fill={k.c} />
          <path d="M0-40L0 52M-30 0H30" stroke="#ffffff" strokeWidth="2.5" opacity=".7" />
          <path d="M0-40L30 0L0 6Z" fill="#ffffff" opacity=".22" />
          <path className="wp-tail" d="M0 52c-14 22 14 36 0 58s14 36 0 58" fill="none" stroke="#0f2a3d" strokeWidth="2" opacity=".6" />
          <g fill={k.c}><path d="M-10 78l10 6-10 6ZM10 78L0 84l10 6Z" /><path d="M-10 136l10 6-10 6ZM10 136L0 142l10 6Z" /></g>
        </g>
      </g>
    </g>)}
    <g>
      <Figure pose={poses.pull} x={500} y={604} color="#103a22" />
      <Figure pose={poses.cheer} x={584} y={598} color="#103a22" className="wp-hop" />
      <Figure pose={poses.pull} x={668} y={603} color="#103a22" flip />
      <Figure pose={poses.pull} x={726} y={606} s={.92} color="#103a22" />
    </g>
  </>;
}

/* ---------- Rooftop Relay: a chase across the roofs (playable) ---------- */
const skyline = (seed: number, base: number, min: number, max: number) => {
  const random = seeded(seed);
  let d = "";
  const windows: [number, number][] = [];
  for (let x = -20; x < 1220;) {
    const w = 40 + random() * 60;
    const h = min + random() * (max - min);
    d += `M${x.toFixed(0)} ${base}V${(base - h).toFixed(0)}h${w.toFixed(0)}V${base}Z`;
    for (let k = 0; k < 3; k += 1) if (random() > .55) windows.push([Math.round(x + 8 + random() * (w - 18)), Math.round(base - h + 14 + random() * (h - 40))]);
    x += w + 2;
  }
  return { d, windows };
};
const far = skyline(61, 650, 120, 290);
const mid = skyline(62, 700, 80, 210);

export function RooftopRelay({ id, beat = "arrive", choice = null }: { id: Id; beat?: SceneBeat; choice?: string | null }) {
  const outcome = beat === "outcome" ? choice : null;
  return <g className="rr-world" data-beat={beat} data-outcome={outcome ?? "none"}>
    <defs>
      <linearGradient id={id("rr-sky")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff5a3c" /><stop offset=".55" stopColor="#ff9e45" /><stop offset="1" stopColor="#ffd89c" /></linearGradient>
    </defs>
    <rect width="1200" height="1000" fill={`url(#${id("rr-sky")})`} />
    <g className="ps-camera">
      <circle cx="700" cy="440" r="150" fill="#fff0c4" opacity=".3" />
      <circle cx="700" cy="440" r="104" fill="#fff3cf" />
      <path d={far.d} fill="#f08559" />
      <path d={mid.d} fill="#c64d33" />
      <g fill="#ffd27f">{mid.windows.map(([x, y], i) => <rect key={i} x={x} y={y} width="7" height="10" />)}</g>
      {/* Pigeons */}
      <g className="rr-birds" fill="none" stroke="#5b1a22" strokeWidth="3" strokeLinecap="round"><path d="M430 300q8-8 16 0q8-8 16 0M470 270q6-6 12 0q6-6 12 0M520 320q7-7 14 0q7-7 14 0" /></g>
      {/* The two roofs and the gap between them */}
      <path d="M240 640H560V1000H240Z" fill="#2c1020" />
      <path d="M232 632H568V646H232Z" fill="#4a2034" />
      <path d="M650 600H960V1000H650Z" fill="#2c1020" />
      <path d="M642 592H968V606H642Z" fill="#4a2034" />
      <g fill="#3d1729"><rect x="268" y="680" width="22" height="30" /><rect x="310" y="680" width="22" height="30" /><rect x="268" y="740" width="22" height="30" /><rect x="700" y="640" width="22" height="30" /><rect x="742" y="640" width="22" height="30" /><rect x="784" y="700" width="22" height="30" /></g>
      {/* Stairwell hut with its door */}
      <path d="M320 632V566H408V632Z" fill="#3a1528" />
      <rect className="rr-door" x="352" y="588" width="28" height="44" fill="#ffcf7a" />
      {/* Water tank and antenna on the far roof */}
      <g fill="#3a1528"><path d="M846 592l6-48h4l6 48ZM896 592l-6-48h4l6 48Z" /><rect x="836" y="476" width="72" height="72" rx="8" /><path d="M836 482l36-22 36 22Z" /></g>
      <path d="M930 592V470M918 500h24M922 520h16" stroke="#3a1528" strokeWidth="4" />
      {/* Laundry line between the roofs */}
      <path d="M516 632V556M704 592V516" stroke="#3a1528" strokeWidth="5" />
      <path className="rr-line" d="M516 558Q610 580 704 518" fill="none" stroke="#2c1020" strokeWidth="2.4" />
      <g className="rr-laundry">
        <path d="M548 566l22 4-3 30-20-3Z" fill="#46c2ff" /><path d="M590 572h26l-4 24h-18Z" fill="#ffffff" /><path d="M636 566l22-6 6 24-22 6Z" fill="#ffd23f" /><path d="M674 548l16-8 8 22-16 8Z" fill="#7cf29a" />
      </g>
      {/* The drone and its searchlight */}
      <g className="rr-drone">
        <path className="rr-beam" d="M760 352L560 640H660Z" fill="#fff8d8" opacity=".18" />
        <path d="M734 336h52M740 330v-8M780 330v-8" stroke="#2c1020" strokeWidth="5" strokeLinecap="round" />
        <rect x="744" y="334" width="32" height="18" rx="6" fill="#2c1020" />
        <circle className="rr-drone-light" cx="760" cy="355" r="5" fill="#ff2d55" />
      </g>
      {/* The runner, carrying the package */}
      <g className="rr-runner">
        <Figure pose={outcome === "jump" ? poses.leap : outcome === "zip" ? poses.hang : outcome === "hide" ? poses.walk : beat === "choose" || beat === "signal" ? poses.ready : poses.stand} x={0} y={0} s={.82} color="#16060f" flip={outcome === "hide"}>
          <rect x="-24" y="-46" width="20" height="18" rx="3" fill="#ffd23f" />
        </Figure>
      </g>
      <g className="rr-speed" stroke="#fff4dc" strokeWidth="4" strokeLinecap="round" opacity="0"><path d="M480 520h-60M470 545h-90M486 495h-44" /></g>
    </g>
  </g>;
}

/* ---------- Snowball Siege: two teams, one field (playable) ---------- */
export function SnowballSiege({ id, beat = "arrive", choice = null }: { id: Id; beat?: SceneBeat; choice?: string | null }) {
  const outcome = beat === "outcome" ? choice : null;
  const hills = ridge(71, 640, 26, "soft", .7);
  const random = seeded(72);
  const pines = Array.from({ length: 22 }, (_, i) => { const x = -20 + i * 58 + random() * 24; return { x, y: hills.at(x) + 6, h: 40 + random() * 34 }; });
  const ink = "#24294a";
  return <g className="ss-world" data-beat={beat} data-outcome={outcome ?? "none"}>
    <defs>
      <linearGradient id={id("ss-sky")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f39cbf" /><stop offset=".55" stopColor="#ffcfae" /><stop offset="1" stopColor="#fff0de" /></linearGradient>
    </defs>
    <rect width="1200" height="1000" fill={`url(#${id("ss-sky")})`} />
    <g className="ps-camera">
      <circle cx="600" cy="430" r="74" fill="#fff7ef" />
      <path d={hills.d} fill="#dfe5fb" />
      <g fill="#8a98cc">{pines.map((p, i) => <path key={i} d={`M${p.x} ${p.y}l${p.h * .36} 0l-${p.h * .36} -${p.h}l-${p.h * .36} ${p.h}Z`} />)}</g>
      <path d="M-20 1000V668C300 650 900 650 1220 668V1000Z" fill="#f6f8ff" />
      <g fill="#dde4fa"><ellipse cx="420" cy="720" rx="150" ry="16" /><ellipse cx="800" cy="716" rx="150" ry="16" /><ellipse cx="600" cy="860" rx="260" ry="26" /></g>
      {/* Forts, with a second course that only goes up if the wall is built higher */}
      {[{ x: 330, flag: "#ff5a5f" }, { x: 740, flag: "#3d7bff" }].map((f, i) => <g key={i}>
        <path d={`M${f.x + (i ? 112 : 18)} 690V560`} stroke={ink} strokeWidth="4" />
        <path className={i ? "ss-flag-right" : "ss-flag-left"} d={`M${f.x + (i ? 112 : 18)} 562l${i ? -40 : 40} 12l${i ? 40 : -40} 12Z`} fill={f.flag} />
        <g fill="#ffffff" stroke="#c4cff0" strokeWidth="2">
          {[0, 1, 2, 3].map(k => <rect key={k} x={f.x + k * 32} y="664" width="32" height="26" rx="5" />)}
          {[0, 1, 2].map(k => <rect key={k} x={f.x + 16 + k * 32} y="640" width="32" height="26" rx="5" />)}
          {i === 0 && <g className="ss-extra">{[0, 1, 2].map(k => <rect key={k} x={f.x + k * 32 + 8} y="614" width="32" height="26" rx="5" />)}</g>}
        </g>
      </g>)}
      {/* Your team (left) and theirs (right) */}
      <g className="ss-team ss-left" style={outcome === "charge" ? at(150, 0) : outcome === "truce" ? at(110, 0) : at(0, 0)}>
        <Figure pose={outcome === "truce" ? poses.cheer : beat === "signal" ? poses.crouch : poses.throw} x={480} y={640} s={.8} color={ink} />
        <Figure pose={outcome === "truce" || outcome === "charge" ? poses.cheer : poses.crouch} x={420} y={648} s={.72} color={ink} />
      </g>
      <g className="ss-team ss-right" style={outcome === "truce" ? at(-110, 0) : at(0, 0)}>
        <Figure pose={outcome === "truce" ? poses.cheer : poses.throw} x={724} y={640} s={.8} color={ink} flip />
        <Figure pose={outcome === "truce" ? poses.cheer : poses.crouch} x={790} y={648} s={.72} color={ink} flip />
      </g>
      <g className="ss-snowman"><circle cx="600" cy="676" r="26" fill="#fff" stroke="#c4cff0" strokeWidth="2" /><circle cx="600" cy="634" r="18" fill="#fff" stroke="#c4cff0" strokeWidth="2" /><path d="M600 634l14 4-14 3Z" fill="#ff8a3d" /><circle cx="595" cy="629" r="2.2" fill={ink} /><circle cx="605" cy="629" r="2.2" fill={ink} /></g>
      {/* Snowballs in the air */}
      <g className="ss-volley" fill="#ffffff" stroke="#b9c6ee" strokeWidth="2">
        <circle className="ss-ball ss-ball-1" cx="0" cy="0" r="9" /><circle className="ss-ball ss-ball-2" cx="0" cy="0" r="8" /><circle className="ss-ball ss-ball-3" cx="0" cy="0" r="10" />
      </g>
    </g>
  </g>;
}

/* ---------- Midnight Funfair: spooky, and fun ---------- */
export function MidnightFunfair({ id }: { id: Id }) {
  const lights = Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return { x: 700 + Math.cos(a) * 190, y: 470 + Math.sin(a) * 190 }; });
  const ghosts = particles(81, 14, [340, 380, 880, 820]);
  return <>
    <defs>
      <linearGradient id={id("ff-sky")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#03161b" /><stop offset=".6" stopColor="#0b3a3d" /><stop offset="1" stopColor="#12564d" /></linearGradient>
      <linearGradient id={id("ff-fog")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9effd8" stopOpacity="0" /><stop offset=".5" stopColor="#9effd8" stopOpacity=".22" /><stop offset="1" stopColor="#9effd8" stopOpacity="0" /></linearGradient>
    </defs>
    <rect width="1200" height="1000" fill={`url(#${id("ff-sky")})`} />
    <circle cx="460" cy="270" r="130" fill="#d8ff9e" opacity=".1" />
    <circle cx="460" cy="270" r="78" fill="#e3ffb3" />
    <g className="wp-wheel" style={{ transformOrigin: "700px 470px" }}>
      <circle cx="700" cy="470" r="190" fill="none" stroke="#06191c" strokeWidth="8" />
      <circle cx="700" cy="470" r="150" fill="none" stroke="#06191c" strokeWidth="3" />
      <g stroke="#06191c" strokeWidth="3">{Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <path key={i} d={`M700 470L${(700 + Math.cos(a) * 190).toFixed(1)} ${(470 + Math.sin(a) * 190).toFixed(1)}`} />; })}</g>
      <g fill="#ffe7a1">{lights.map((l, i) => <circle key={i} className="wp-bulb" cx={l.x.toFixed(1)} cy={l.y.toFixed(1)} r="5" style={{ animationDelay: `${(i % 4) * .3}s` }} />)}</g>
    </g>
    <path d="M700 470L590 780M700 470L810 780M620 700h160" stroke="#06191c" strokeWidth="10" strokeLinecap="round" />
    <circle cx="700" cy="470" r="16" fill="#06191c" />
    {/* Carousel */}
    <g transform="translate(430 600)">
      <path d="M-110 40L0-90L110 40Z" fill="#ff5f5f" />
      <path d="M-70 40L0-90L-40 40ZM-10 40L0-90L20 40ZM50 40L0-90L80 40Z" fill="#fff1e2" />
      <rect x="-104" y="40" width="208" height="16" fill="#ffcf6b" />
      <path d="M-90 56v90M-30 56v90M30 56v90M90 56v90" stroke="#ffcf6b" strokeWidth="5" />
      <rect x="-112" y="146" width="224" height="22" fill="#06191c" />
      <path d="M0-90v-24" stroke="#06191c" strokeWidth="4" /><path d="M0-114l18 6-18 6Z" fill="#ff5f5f" />
    </g>
    <path d="M-20 1000V770H1220V1000Z" fill="#031012" />
    <g stroke="#031012" strokeWidth="4"><path d="M330 770v-30M360 770v-30M390 770v-30M810 770v-30M840 770v-30M870 770v-30M320 748h80M800 748h80" /></g>
    <rect className="wp-fog" x="-200" y="700" width="1600" height="160" fill={`url(#${id("ff-fog")})`} />
    <g>
      <Figure pose={poses.walk} x={540} y={720} s={.62} color="#020a0b" />
      <Figure pose={poses.walk} x={574} y={722} s={.58} color="#020a0b" />
    </g>
    <g className="wp-rise" fill="#b6ffd9">{ghosts.map((g, i) => <circle key={i} cx={g.x} cy={g.y} r={g.r * 1.6} opacity={g.o * .7} style={{ animationDelay: `${g.delay}ms`, animationDuration: `${g.dur}ms` }} />)}</g>
  </>;
}

/* ---------- The Deep: two divers and something enormous ---------- */
export function TheDeep({ id }: { id: Id }) {
  const floor = ridge(91, 890, 30, "soft", 1.2);
  const bubbles = particles(92, 22, [380, 420, 860, 900]);
  const diver = (x: number, y: number, s: number, flip = false): ReactNode => <g transform={`translate(${x} ${y})`}>
    <path d={flip ? "M58 -6L360 -90L360 90Z" : "M-58 -6L-360 -90L-360 90Z"} fill="#e9f4ff" opacity=".13" className="wp-beam" />
    <Figure pose={poses.swim} x={0} y={0} s={s} color="#020d2c" flip={flip}><path d="M48 -6l26-8v26ZM46 12l26 2-6 18Z" fill="#020d2c" /></Figure>
  </g>;
  return <>
    <defs>
      <linearGradient id={id("dp-water")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f86ff" /><stop offset=".45" stopColor="#0b45b0" /><stop offset="1" stopColor="#031447" /></linearGradient>
      <radialGradient id={id("dp-chest")}><stop offset="0" stopColor="#ffe08a" stopOpacity=".9" /><stop offset="1" stopColor="#ffe08a" stopOpacity="0" /></radialGradient>
    </defs>
    <rect width="1200" height="1000" fill={`url(#${id("dp-water")})`} />
    <g fill="#ffffff" className="wp-rays"><path d="M430 0h70L600 760H560Z" opacity=".07" /><path d="M560 0h90L720 820H660Z" opacity=".08" /><path d="M720 0h60L760 700H720Z" opacity=".06" /></g>
    <g className="wp-whale">
      <path d="M330 420C390 330 560 300 700 330C780 346 840 380 880 410C920 380 960 350 1010 340C990 380 990 420 1010 470C960 460 920 440 886 430C840 480 740 520 600 520C470 520 360 490 330 420Z" fill="#06276e" />
      <path d="M380 452C470 492 600 500 700 486" fill="none" stroke="#0b3a8f" strokeWidth="6" strokeLinecap="round" />
      <circle cx="420" cy="410" r="6" fill="#0b3a8f" />
      <path d="M560 500C580 540 620 556 660 552C640 536 626 520 620 504Z" fill="#06276e" />
    </g>
    <path d={floor.d} fill="#021034" />
    <g stroke="#0a3b6e" strokeWidth="7" strokeLinecap="round" fill="none" className="wp-weed"><path d="M380 900c-10-40 10-70-4-110M410 900c10-30-6-60 6-90M820 890c-12-40 8-70-6-120M846 892c8-30-8-50 4-80" /></g>
    <circle cx="640" cy="866" r="70" fill={`url(#${id("dp-chest")})`} />
    <g transform="translate(640 870)"><rect x="-26" y="-18" width="52" height="30" rx="4" fill="#5a3412" /><path d="M-26-18c0-14 52-14 52 0Z" fill="#7a4a1c" /><rect x="-4" y="-12" width="8" height="10" fill="#ffd36b" /></g>
    {diver(520, 660, .62)}
    {diver(730, 610, .56, true)}
    <g className="wp-rise" fill="none" stroke="#cfe6ff" strokeWidth="2">{bubbles.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={b.r * 2.2} opacity={b.o} style={{ animationDelay: `${b.delay}ms`, animationDuration: `${b.dur}ms` }} />)}</g>
  </>;
}

/** A playable world as a standalone picture for the reel. */
export function PlayableScene({ world, beat, choice, label }: { world: "rooftop" | "snowball"; beat: SceneBeat; choice: string | null; label: string }) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `ps-${uid}-${name}`;
  return <svg className="playable-scene" data-world={world} viewBox="0 0 1200 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
    {world === "rooftop" ? <RooftopRelay id={id} beat={beat} choice={choice} /> : <SnowballSiege id={id} beat={beat} choice={choice} />}
  </svg>;
}
