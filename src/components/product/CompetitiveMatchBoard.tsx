import { useId } from "react";

/*
 * A match briefing drawn like a coach's playbook on a topographic map.
 * One world (shared terrain, one contested crossing), two opposing plans:
 * your team in amber circles, the opposition in bone-grey crosses.
 * Everything is deterministic so the server render and hydration match.
 */

type Point = [number, number];

const r1 = (value: number) => Math.round(value * 10) / 10;

/** A smooth, slightly irregular closed contour around a summit. */
function contour(cx: number, cy: number, radius: number, seed: number, stretch: Point = [1.3, 0.82]) {
  const count = 60;
  const points: Point[] = [];
  for (let i = 0; i < count; i += 1) {
    const t = (i / count) * Math.PI * 2;
    const wobble = 1 + 0.12 * Math.sin(3 * t + seed) + 0.07 * Math.sin(5 * t + seed * 1.7) + 0.035 * Math.sin(8 * t + seed * 0.6);
    const rr = radius * wobble;
    points.push([cx + rr * Math.cos(t) * stretch[0], cy + rr * Math.sin(t) * stretch[1]]);
  }
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(points[count - 1], points[0]);
  let d = `M${r1(start[0])} ${r1(start[1])}`;
  for (let i = 0; i < count; i += 1) {
    const p = points[i];
    const m = mid(p, points[(i + 1) % count]);
    d += `Q${r1(p[0])} ${r1(p[1])} ${r1(m[0])} ${r1(m[1])}`;
  }
  return `${d}Z`;
}

const hills = [
  { cx: 132, cy: 318, seed: 0.8, rings: [18, 38, 58, 80, 104, 130, 158] },
  { cx: 512, cy: 118, seed: 2.6, rings: [16, 34, 54, 76, 100, 126, 154] },
  { cx: 470, cy: 372, seed: 4.1, rings: [14, 30, 48] },
  { cx: 168, cy: 82, seed: 5.3, rings: [12, 26, 42] },
].map(hill => ({ ...hill, paths: hill.rings.map((radius, index) => contour(hill.cx, hill.cy, radius, hill.seed + index * 0.33)) }));

const columns = "ABCDEFGHIJKL".split("");
const RIVER = "M262 20C292 84 238 150 318 214S372 330 404 420";

function TeamMark({ x, y, n }: { x: number; y: number; n: number }) {
  return <g className="cmb-team" transform={`translate(${x} ${y})`}>
    <circle r="11" className="cmb-team-halo" />
    <circle r="8" fill="#efbd70" />
    <text y="3" textAnchor="middle">{n}</text>
  </g>;
}

function OppositionMark({ x, y }: { x: number; y: number }) {
  return <g className="cmb-opposition" transform={`translate(${x} ${y})`}>
    <circle r="10" fill="#0d0d0e" stroke="#4a443b" strokeWidth="1" />
    <path d="m-5-5 10 10m0-10-10 10" stroke="#c9c0b2" strokeWidth="2.2" strokeLinecap="round" />
  </g>;
}

export default function CompetitiveMatchBoard() {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `cmb-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  return <svg className="competitive-match-board" viewBox="0 0 640 440" role="img" aria-label="Concept illustration: a match briefing drawn on one shared map. A river runs through the terrain with a single contested crossing at its center. Your team of three, in amber, plans one route to the crossing and another to the gate’s pump station; the opposition of three, marked with crosses, approaches the same crossing from the far bank and sends a flank downstream.">
    <defs>
      <clipPath id={id("board")}><rect x="20" y="20" width="600" height="400" /></clipPath>
      <radialGradient id={id("ours")} cx="0.2" cy="0.75" r="0.6">
        <stop offset="0" stopColor="#efbd70" stopOpacity=".13" />
        <stop offset="1" stopColor="#efbd70" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id("theirs")} cx="0.82" cy="0.25" r="0.55">
        <stop offset="0" stopColor="#c9c0b2" stopOpacity=".08" />
        <stop offset="1" stopColor="#c9c0b2" stopOpacity="0" />
      </radialGradient>
      <marker id={id("arrow-ours")} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 9 5 1 9" fill="none" stroke="#efbd70" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></marker>
      <marker id={id("arrow-theirs")} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 9 5 1 9" fill="none" stroke="#a79e90" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></marker>
    </defs>

    {/* The board */}
    <rect x="20" y="20" width="600" height="400" fill="#121110" />
    <g clipPath={url("board")}>
      <rect x="20" y="20" width="600" height="400" fill={url("ours")} />
      <rect x="20" y="20" width="600" height="400" fill={url("theirs")} />
      <g stroke="#1e1c18" strokeWidth="1">
        {Array.from({ length: 11 }, (_, i) => <path key={`v${i}`} d={`M${70 + i * 50} 20V420`} />)}
        {Array.from({ length: 7 }, (_, i) => <path key={`h${i}`} d={`M20 ${70 + i * 50}H620`} />)}
      </g>
      {hills.map((hill, h) => <g key={h} fill="none">
        {hill.paths.map((d, i) => <path key={i} d={d} stroke={i === 0 ? "#4a3f2f" : "#2c2720"} strokeWidth={i % 3 === 0 ? 1.3 : 0.9} />)}
      </g>)}

      {/* The river and its single crossing */}
      <path d={RIVER} fill="none" stroke="#2b2f31" strokeWidth="40" strokeLinecap="round" />
      <path d={RIVER} fill="none" stroke="#15191b" strokeWidth="37" strokeLinecap="round" />
      <path className="cmb-flow" d={RIVER} fill="none" stroke="#3a4144" strokeWidth="1.2" strokeDasharray="3 12" />
      <path className="cmb-flow cmb-flow-slow" d={RIVER} fill="none" stroke="#2c3235" strokeWidth="1" strokeDasharray="1 9" transform="translate(9 -4)" />
    </g>
    <rect x="20.5" y="20.5" width="599" height="399" fill="none" stroke="#3a3024" />

    {/* Coordinates and register marks */}
    <g className="cmb-coords" aria-hidden="true">
      {columns.map((c, i) => <text key={c} x={45 + i * 50} y="13" textAnchor="middle">{c}</text>)}
      {Array.from({ length: 8 }, (_, i) => <text key={i} x="10" y={49 + i * 50} textAnchor="middle">{String(i + 1).padStart(2, "0")}</text>)}
    </g>
    <g fill="none" stroke="#efbd70" strokeWidth="1.5">
      <path d="M20 36V20h16M604 20h16v16M620 404v16h-16M36 420H20v-16" />
    </g>

    {/* Landmarks */}
    <g transform="translate(184 172)">
      <rect x="-11" y="-11" width="22" height="22" fill="#121110" stroke="#efbd70" strokeWidth="1.3" />
      <path d="m1-7-5 8h5l-2 6 6-9H0l1-5Z" fill="#efbd70" />
    </g>
    <text className="cmb-tag" x="166" y="155" textAnchor="middle">PUMP · GATE</text>
    <g transform="translate(424 334)">
      <path d="M-10 0h20M-7-5h14M-7 5h14" stroke="#7d7466" strokeWidth="1.4" strokeLinecap="round" />
    </g>
    <text className="cmb-tag cmb-tag-muted" x="424" y="356" textAnchor="middle">FORD</text>

    {/* The contested crossing */}
    <g transform="translate(318 214)">
      <circle className="cmb-pulse" r="30" fill="none" stroke="#efbd70" strokeWidth="1" />
      <circle className="cmb-pulse cmb-pulse-late" r="30" fill="none" stroke="#efbd70" strokeWidth="1" />
      <circle r="46" fill="none" stroke="#3d3427" strokeDasharray="2 5" />
      <path d="M0-30A30 30 0 0 0 0 30" fill="none" stroke="#efbd70" strokeWidth="2" />
      <path d="M0 30A30 30 0 0 0 0-30" fill="none" stroke="#a79e90" strokeWidth="2" strokeDasharray="5 4" />
      <g transform="rotate(-52)">
        <rect x="-26" y="-7" width="52" height="14" fill="#1b1a17" stroke="#d9cdb8" strokeWidth="1.2" />
        <path d="M-17-7V7M-6-7V7M6-7V7M17-7V7" stroke="#4f483d" />
      </g>
      <path d="M-4 0h8M0-4v8" stroke="#f2eee7" strokeWidth="1.4" />
    </g>
    <g className="cmb-objective-label">
      <path d="M318 160v-12" stroke="#efbd70" strokeWidth="1" />
      <text className="cmb-tag" x="318" y="141" textAnchor="middle">OBJ · THE CROSSING</text>
    </g>

    {/* Opposing plans */}
    <g className="cmb-plan cmb-plan-theirs" fill="none" strokeLinecap="round">
      <path d="M492 150C452 176 404 186 356 204" stroke="#a79e90" strokeWidth="2" strokeDasharray="6 6" markerEnd={url("arrow-theirs")} />
      <path d="M546 156C566 230 528 300 444 328" stroke="#a79e90" strokeWidth="1.6" strokeDasharray="2 6" markerEnd={url("arrow-theirs")} />
      <path className="cmb-runner" pathLength="100" d="M492 150C452 176 404 186 356 204" stroke="#f2eee7" strokeWidth="2.4" />
    </g>
    <g className="cmb-plan cmb-plan-ours" fill="none" strokeLinecap="round">
      <path className="cmb-draw" pathLength="100" d="M156 330C206 300 236 270 284 236" stroke="#efbd70" strokeWidth="2.6" markerEnd={url("arrow-ours")} />
      <path className="cmb-draw cmb-draw-late" pathLength="100" d="M110 300C100 250 132 206 168 184" stroke="#efbd70" strokeWidth="1.8" markerEnd={url("arrow-ours")} />
      <path className="cmb-runner" pathLength="100" d="M156 330C206 300 236 270 284 236" stroke="#fff3dc" strokeWidth="3" />
      <path className="cmb-runner cmb-runner-late" pathLength="100" d="M110 300C100 250 132 206 168 184" stroke="#fff3dc" strokeWidth="2.4" />
    </g>

    <TeamMark x={124} y={312} n={1} />
    <TeamMark x={152} y={344} n={2} />
    <TeamMark x={106} y={350} n={3} />
    <OppositionMark x={506} y={136} />
    <OppositionMark x={538} y={146} />
    <OppositionMark x={520} y={108} />

    <text className="cmb-tag" x="34" y="406">TEAM A · YOUR PLAN</text>
    <text className="cmb-tag cmb-tag-muted" x="606" y="40" textAnchor="end">TEAM B · THEIR PLAN</text>
  </svg>;
}
