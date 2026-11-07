import { useId } from "react";

/*
 * A nocturne: a coastal archive stands against a low moon, its relay sending
 * a signal out over a rising tide. Geometry is deterministic so the server
 * render and hydration match.
 */

const HORIZON = 288;
const MOON = { x: 430, y: 150, r: 104 };
const MAST_TIP = { x: 431, y: 98 };

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Row = { y: number; open: string; glint: string; delay: number };

/** Rows of water: denser near the horizon, with a broken moon path under the moon. */
const seaRows: Row[] = (() => {
  const random = seeded(7);
  const rows: Row[] = [];
  for (let k = 0; k < 17; k += 1) {
    const y = HORIZON + 7 + k * 5.2 + k * k * 0.38;
    if (y > 432) break;
    const spread = 34 + k * 7;
    let open = "";
    let glint = "";
    let x = 20 + random() * 30;
    while (x < 620) {
      const length = 6 + random() * (14 + k * 2.2);
      const inPath = Math.abs(x + length / 2 - MOON.x) < spread * (0.55 + random() * 0.6);
      const segment = `M${x.toFixed(1)} ${y.toFixed(1)}h${length.toFixed(1)}`;
      if (inPath) glint += segment; else open += segment;
      x += length + (inPath ? 3 + random() * 7 : 10 + random() * (26 + k * 3));
    }
    rows.push({ y, open, glint, delay: Math.round(random() * 4000) });
  }
  return rows;
})();

const stars = (() => {
  const random = seeded(31);
  return Array.from({ length: 26 }, () => {
    const x = 30 + random() * 580;
    const y = 18 + random() * 230;
    const nearMoon = Math.hypot(x - MOON.x, y - MOON.y) < MOON.r + 26;
    return { x: Math.round(x), y: Math.round(y), r: (0.6 + random() * 0.9).toFixed(2), o: (0.35 + random() * 0.55).toFixed(2), twinkle: random() > 0.62, delay: Math.round(random() * 5000), nearMoon };
  }).filter(star => !star.nearMoon);
})();

export default function CasualSignalScene() {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `css-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  return <svg className="casual-signal-scene" viewBox="0 0 640 440" role="img" aria-labelledby={id("title")}>
    <title id={id("title")}>A coastal archive at night stands against a low moon. A relay on its roof sends a signal over the water, a thin crossing links it to the shore, and the tide is rising.</title>
    <defs>
      <radialGradient id={id("moon")} cx=".38" cy=".34" r=".75">
        <stop offset="0" stopColor="#f6f4ff" />
        <stop offset=".5" stopColor="#d5d0ff" />
        <stop offset="1" stopColor="#9d96e4" />
      </radialGradient>
      <radialGradient id={id("halo")}>
        <stop offset=".6" stopColor="#b9b3f5" stopOpacity=".3" />
        <stop offset=".78" stopColor="#8d87cf" stopOpacity=".09" />
        <stop offset="1" stopColor="#8d87cf" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={id("horizon")} x1="0" x2="1">
        <stop offset="0" stopColor="#b9b3f5" stopOpacity="0" />
        <stop offset=".67" stopColor="#d5d0ff" stopOpacity=".8" />
        <stop offset="1" stopColor="#b9b3f5" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={id("reflection")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#07080d" stopOpacity=".95" />
        <stop offset="1" stopColor="#07080d" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={id("tide")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#151627" stopOpacity=".92" />
        <stop offset="1" stopColor="#0e0f18" stopOpacity=".98" />
      </linearGradient>
      <radialGradient id={id("fade")} cx=".55" cy=".46" r=".62">
        <stop offset=".62" stopColor="#fff" />
        <stop offset="1" stopColor="#000" />
      </radialGradient>
      <mask id={id("edges")} maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="440">
        <rect width="640" height="440" fill={url("fade")} />
      </mask>
    </defs>

    <g mask={url("edges")}>
      {/* Sky */}
      <g>
        {stars.map((s, i) => <circle key={i} className={s.twinkle ? "css-star css-twinkle" : "css-star"} cx={s.x} cy={s.y} r={s.r} fill="#dedbff" opacity={s.o} style={s.twinkle ? { animationDelay: `${s.delay}ms` } : undefined} />)}
      </g>
      <circle cx={MOON.x} cy={MOON.y} r={MOON.r * 1.42} fill={url("halo")} />
      <circle cx={MOON.x} cy={MOON.y} r={MOON.r} fill={url("moon")} />
      <g fill="#a49de9" opacity=".32">
        <circle cx="392" cy="122" r="15" /><circle cx="470" cy="104" r="8" /><circle cx="486" cy="176" r="19" /><circle cx="404" cy="190" r="7" /><circle cx="448" cy="226" r="10" />
      </g>

      {/* Sea */}
      <path d={`M24 ${HORIZON}H616`} stroke={url("horizon")} strokeWidth="1" />
      <g fill="none" strokeLinecap="round">
        {seaRows.map((row, i) => <g key={i}>
          <path d={row.open} stroke="#5d5a86" strokeWidth={0.8 + i * 0.05} opacity={0.75 - i * 0.025} />
          <path className="css-glint" d={row.glint} stroke="#d5d0ff" strokeWidth={0.9 + i * 0.07} style={{ animationDelay: `${row.delay}ms` }} />
        </g>)}
      </g>

      {/* The archive's reflection softens the moon path beneath it */}
      <path d={`M352 ${HORIZON + 2}h172l-10 78H362Z`} fill={url("reflection")} />

      {/* The shore and the crossing */}
      <path d={`M24 ${HORIZON + 1}C70 ${HORIZON - 9} 140 ${HORIZON - 11} 196 ${HORIZON - 4}L204 ${HORIZON + 2}H24Z`} fill="#090a10" />
      <path d={`M60 ${HORIZON - 5}C110 ${HORIZON - 12} 160 ${HORIZON - 11} 196 ${HORIZON - 4}`} fill="none" stroke="#5d5a86" strokeWidth=".8" />
      <g stroke="#0a0b11" strokeWidth="2.4">
        <path d={`M214 ${HORIZON - 4}v14M246 ${HORIZON - 5}v15M278 ${HORIZON - 6}v16M310 ${HORIZON - 7}v17`} />
      </g>
      <path d={`M196 ${HORIZON - 6}L340 ${HORIZON - 9}v4L196 ${HORIZON - 2}Z`} fill="#0a0b11" />
      <path d={`M196 ${HORIZON - 6}L340 ${HORIZON - 9}`} stroke="#7e78bf" strokeWidth=".9" />

      {/* The archive: one silhouette, rim-lit by the moon */}
      <g>
        <path d={`M322 ${HORIZON + 2}l14-14h200l18 14Z`} fill="#090a10" />
        <path d={`M356 ${HORIZON - 12}V206h112v${HORIZON - 12 - 206}Z`} fill="#0a0b12" />
        <path d="M374 206v-18h76v18Z" fill="#0a0b12" />
        <path d={`M468 ${HORIZON - 12}V232h34v${HORIZON - 12 - 232}Z`} fill="#0c0d15" />
        <path d={`M356 ${HORIZON - 12}V206h18v-18h76v18h18v26h34v${HORIZON - 12 - 232}`} fill="none" stroke="#c9c4fb" strokeWidth="1.1" opacity=".75" />
        <g fill="#20223a">
          <rect x="370" y="220" width="5" height="22" /><rect x="382" y="220" width="5" height="22" /><rect x="436" y="220" width="5" height="22" /><rect x="448" y="220" width="5" height="22" />
          <rect x="478" y="244" width="4" height="16" /><rect x="488" y="244" width="4" height="16" />
        </g>
        <circle className="css-reserve" cx="412" cy="257" r="14" fill="#b9b3f5" opacity=".22" />
        <rect x="406" y="250" width="12" height="14" rx="1" fill="#e6e3ff" />
        <path d={`M${MAST_TIP.x} 188V${MAST_TIP.y}M${MAST_TIP.x - 9} 130h18M${MAST_TIP.x - 6} 114h12`} stroke="#0a0b12" strokeWidth="3" />
        <path d={`M${MAST_TIP.x + 1.5} 188V${MAST_TIP.y}`} stroke="#c9c4fb" strokeWidth=".8" opacity=".7" />
      </g>

      {/* The rising tide, lapping at the archive's base */}
      <g className="css-tide">
        <rect x="190" y={HORIZON - 3} width="360" height="20" fill={url("tide")} />
        <path d={`M190 ${HORIZON - 3}h360`} stroke="#8d87cf" strokeWidth=".9" strokeDasharray="14 6 3 6" opacity=".8" />
      </g>
    </g>

    {/* The signal */}
    <g className="css-signal" fill="none" stroke="#e6e3ff" strokeWidth="1.2">
      <circle cx={MAST_TIP.x} cy={MAST_TIP.y} r="9" vectorEffect="non-scaling-stroke" />
      <circle cx={MAST_TIP.x} cy={MAST_TIP.y} r="9" vectorEffect="non-scaling-stroke" />
      <circle cx={MAST_TIP.x} cy={MAST_TIP.y} r="9" vectorEffect="non-scaling-stroke" />
    </g>
    <circle cx={MAST_TIP.x} cy={MAST_TIP.y} r="3.4" fill="#ffffff" />
    <circle className="css-beacon" cx={MAST_TIP.x} cy={MAST_TIP.y} r="7" fill="#d5d0ff" opacity=".35" />
  </svg>;
}
