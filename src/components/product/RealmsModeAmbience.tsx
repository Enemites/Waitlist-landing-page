import type { CSSProperties } from "react";

import type { EntryId } from "./RealmsEntrySelector";

/**
 * Ambient life on the entry map, one character per mode. Everything here is decorative and lives
 * in the map's 960x460 viewBox. SMIL timings share the document clock with the route travelers,
 * so waypoints and the summit clash stay in step with them.
 */

// Deterministic scatter so server and client render the same particles.
const rand = (i: number, salt: number) => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const vars = (values: Record<string, string | number>) => values as CSSProperties;

function Casual() {
  const stars = Array.from({ length: 18 }, (_, i) => ({
    x: 440 + rand(i, 1) * 490,
    y: -60 + rand(i, 2) * 95,
    r: 0.8 + rand(i, 3) * 1.3,
    delay: rand(i, 4) * 5,
    duration: 2.6 + rand(i, 5) * 3.4,
  }));
  const flies = Array.from({ length: 13 }, (_, i) => ({
    x: 540 + rand(i, 6) * 360,
    y: 120 + rand(i, 7) * 270,
    dx: (rand(i, 8) - 0.5) * 70,
    dy: (rand(i, 9) - 0.5) * 50,
    drift: 6 + rand(i, 10) * 5,
    glow: 2.2 + rand(i, 11) * 2.4,
    delay: rand(i, 12) * -8,
  }));
  return (
    <g className="ambience ambience--casual">
      {stars.map((s, i) => (
        <circle key={`s${i}`} className="amb-star" cx={s.x} cy={s.y} r={s.r} style={vars({ animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s` })} />
      ))}
      <path className="amb-comet" d="M840 -40L600 30" pathLength={1} />
      {flies.map((f, i) => (
        <g key={`f${i}`} className="amb-firefly" style={vars({ "--dx": `${f.dx}px`, "--dy": `${f.dy}px`, animationDuration: `${f.drift}s`, animationDelay: `${f.delay}s` })}>
          <circle cx={f.x} cy={f.y} r="10" className="amb-firefly-halo" style={vars({ animationDuration: `${f.glow}s`, animationDelay: `${f.delay}s` })} />
          <circle cx={f.x} cy={f.y} r="2.6" className="amb-firefly-core" style={vars({ animationDuration: `${f.glow}s`, animationDelay: `${f.delay}s` })} />
        </g>
      ))}
    </g>
  );
}

// Points along the focused route; `at` is how far the traveler has climbed when it passes them.
const WAYPOINTS = [
  { x: 478, y: 400 }, { x: 479, y: 356 }, { x: 484, y: 318 }, { x: 472, y: 282 }, { x: 488, y: 240 }, { x: 482, y: 200 },
].map((p) => ({ ...p, at: (440 - p.y) / 262 }));

function Focused({ travel }: { travel: number }) {
  const motes = Array.from({ length: 16 }, (_, i) => ({
    x: 462 + rand(i, 13) * 36,
    rise: 140 + rand(i, 14) * 120,
    dx: (rand(i, 15) - 0.5) * 18,
    duration: 3.2 + rand(i, 16) * 3,
    delay: rand(i, 17) * -6,
    r: 1.3 + rand(i, 18) * 1.2,
  }));
  return (
    <g className="ambience ambience--focused">
      {[0, 1, 2].map((i) => (
        <circle key={`ring${i}`} className="amb-ring" cx="480" cy="165" r="26" style={vars({ animationDelay: `${i * 1.2}s` })} />
      ))}
      {motes.map((m, i) => (
        <circle key={`m${i}`} className="amb-mote" cx={m.x} cy="170" r={m.r} style={vars({ "--rise": `${-m.rise}px`, "--dx": `${m.dx}px`, animationDuration: `${m.duration}s`, animationDelay: `${m.delay}s` })} />
      ))}
      {WAYPOINTS.map((w, i) => (
        <g key={`w${i}`} className="amb-waypoint">
          <path d={`M${w.x - 9} ${w.y}h-7M${w.x + 9} ${w.y}h7`} opacity=".3">
            <animate attributeName="opacity" dur={`${travel}s`} repeatCount="indefinite" values=".3;.3;1;.45" keyTimes={`0;${w.at.toFixed(3)};${Math.min(w.at + 0.02, 0.99).toFixed(3)};1`} />
          </path>
        </g>
      ))}
    </g>
  );
}

function Competitive({ travel }: { travel: number }) {
  const embers = Array.from({ length: 26 }, (_, i) => ({
    x: 226 + rand(i, 19) * 44,
    y: 168 + rand(i, 20) * 16,
    rise: 70 + rand(i, 21) * 110,
    dx: (rand(i, 22) - 0.5) * 70,
    duration: 1.6 + rand(i, 23) * 1.8,
    delay: rand(i, 24) * -3,
    r: 1.6 + rand(i, 25) * 1.8,
    hot: rand(i, 26) > 0.55,
  }));
  return (
    <g className="ambience ambience--competitive">
      <path className="amb-march" d="M480 440C400 412 356 362 320 304C294 262 270 214 252 182" />
      <path className="amb-march" d="M12 92C58 90 108 102 156 124C190 140 218 158 240 174" />
      {embers.map((e, i) => (
        <circle key={`e${i}`} className={`amb-ember${e.hot ? " is-hot" : ""}`} cx={e.x} cy={e.y} r={e.r} style={vars({ "--rise": `${-e.rise}px`, "--dx": `${e.dx}px`, animationDuration: `${e.duration}s`, animationDelay: `${e.delay}s` })} />
      ))}
      {/* The clash: both travelers arrive at the end of every cycle. */}
      <circle className="amb-clash-flash" cx="248" cy="172" r="12" opacity="0">
        <animate attributeName="opacity" dur={`${travel}s`} repeatCount="indefinite" values=".85;0;0" keyTimes="0;.16;1" />
      </circle>
      {[0, 0.08].map((offset) => (
        <circle key={offset} className="amb-clash-ring" cx="248" cy="172" r="6" opacity="0">
          <animate attributeName="r" dur={`${travel}s`} repeatCount="indefinite" values={`6;6;${offset ? 34 : 52};${offset ? 34 : 52}`} keyTimes={`0;${offset};${offset + 0.38};1`} />
          <animate attributeName="opacity" dur={`${travel}s`} repeatCount="indefinite" values=".9;.9;0;0" keyTimes={`0;${offset};${offset + 0.38};1`} />
        </circle>
      ))}
    </g>
  );
}

export default function RealmsModeAmbience({ mode, travel }: { mode: EntryId; travel: number }) {
  if (mode === "casual") return <Casual />;
  if (mode === "focused") return <Focused travel={travel} />;
  return <Competitive travel={travel} />;
}
