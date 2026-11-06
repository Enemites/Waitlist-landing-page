import { useId } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import ProductReveal from "./ProductReveal";

const r1 = (value: number) => Math.round(value * 10) / 10;
const svgId = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, "");

/* ---------- Alexander: one rider ahead of a phalanx that moves as one ---------- */

const ranks = [
  { y: 316, s: .5, from: 34, to: 236, step: 20, lowered: false },
  { y: 331, s: .62, from: 22, to: 272, step: 24, lowered: false },
  { y: 350, s: .78, from: 12, to: 308, step: 28, lowered: true },
  { y: 374, s: .95, from: 2, to: 340, step: 34, lowered: true },
] as const;
const rankTones = [
  { body: "#38332c", shield: "#433c33", rim: "#5a5042", spear: "#4f483e" },
  { body: "#423c34", shield: "#4f473c", rim: "#6a5e4c", spear: "#5c5448" },
  { body: "#4f483e", shield: "#625849", rim: "#85765f", spear: "#6f6656" },
  { body: "#5c5448", shield: "#736754", rim: "#9a8a70", spear: "#867b68" },
];

function Soldier({ x, y, s, lowered, tone }: { x: number; y: number; s: number; lowered: boolean; tone: typeof rankTones[number] }) {
  const spear = lowered
    ? `M${r1(x - 14 * s)} ${r1(y - 25 * s)}L${r1(x + 66 * s)} ${r1(y - 36 * s)}`
    : `M${r1(x + 7 * s)} ${r1(y - 4 * s)}L${r1(x + 13 * s)} ${r1(y - 90 * s)}`;
  const spearPath = <path d={spear} stroke={tone.spear} strokeWidth={r1(1.5 * s + .5)} strokeLinecap="round" />;
  return <g>
    {!lowered && spearPath}
    <path d={`M${r1(x - 3 * s)} ${r1(y - 14 * s)}L${r1(x - 6 * s)} ${y}M${r1(x + 3 * s)} ${r1(y - 14 * s)}L${r1(x + 6 * s)} ${y}`} stroke={tone.body} strokeWidth={r1(3 * s)} strokeLinecap="round" />
    <rect x={r1(x - 5 * s)} y={r1(y - 31 * s)} width={r1(10 * s)} height={r1(18 * s)} rx={r1(3 * s)} fill={tone.body} />
    <circle cx={r1(x + s)} cy={r1(y - 36 * s)} r={r1(4.8 * s)} fill={tone.body} />
    <path d={`M${r1(x - 4 * s)} ${r1(y - 39 * s)}Q${x} ${r1(y - 47 * s)} ${r1(x + 6 * s)} ${r1(y - 40 * s)}`} stroke={tone.rim} strokeWidth={r1(2.2 * s)} fill="none" strokeLinecap="round" />
    <circle cx={r1(x + 5 * s)} cy={r1(y - 22 * s)} r={r1(9 * s)} fill={tone.shield} stroke={tone.rim} strokeWidth={r1(1.3 * s)} />
    {lowered && spearPath}
  </g>;
}

const sun = { x: 468, y: 200 };
const sunRays = Array.from({ length: 16 }, (_, index) => {
  const angle = (index * 22.5 - 90) * Math.PI / 180;
  const spread = 3.4 * Math.PI / 180;
  const inner = 74;
  const outer = index % 2 === 0 ? 150 : 116;
  const point = (radius: number, a: number) => `${r1(sun.x + Math.cos(a) * radius)} ${r1(sun.y + Math.sin(a) * radius)}`;
  return `M${point(inner, angle - spread)}L${point(outer, angle)}L${point(inner, angle + spread)}Z`;
});
const opposingLine = Array.from({ length: 14 }, (_, index) => 546 + index * 7).filter(x => x < 582 || x > 604);

function AlexanderArt({ animate }: { animate: boolean }) {
  const titleId = svgId(useId());
  return <svg className="legend-art legend-art-alexander" viewBox="0 0 640 420" role="img" aria-labelledby={titleId}>
    <title id={titleId}>Abstract illustration: Alexander the Great on horseback, spear raised, rides ahead of a Macedonian phalanx toward a gap in the opposing line, framed by a sunburst.</title>
    <rect width="640" height="420" fill="#13110e" />
    <g fill="#efbd70" opacity=".1">
      {sunRays.map(ray => <path key={ray} d={ray} />)}
      {animate && <animateTransform attributeName="transform" type="rotate" from={`0 ${sun.x} ${sun.y}`} to={`360 ${sun.x} ${sun.y}`} dur="220s" repeatCount="indefinite" />}
    </g>
    <circle cx={sun.x} cy={sun.y} r="66" fill="#261f16" stroke="#6b5130" strokeWidth="1.5" />
    <circle cx={sun.x} cy={sun.y} r="52" fill="none" stroke="#3a2e20" />

    <rect y="300" width="640" height="120" fill="#17140f" />
    <path d="M0 300H640" stroke="#3a3024" />
    {/* The opposing line on the horizon, with the opening the charge is aimed at. */}
    <g>
      {opposingLine.map(x => <g key={x}><path d={`M${x + 2} 290V274`} stroke="#3d362d" strokeWidth="1.2" /><rect x={x} y="289" width="4" height="11" rx="1" fill="#3a342c" /></g>)}
    </g>
    <path d="M556 384C592 370 600 338 593 307" fill="none" stroke="#efbd70" strokeWidth="1.6" strokeDasharray="4 6" strokeLinecap="round" opacity=".75">
      {animate && <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.6s" repeatCount="indefinite" />}
    </path>
    <path d="m593 294 5 5-5 5-5-5Z" fill="#efbd70" />

    <g stroke="#2e271d" strokeWidth="1.5" strokeLinecap="round">
      <path d="M38 398h46M120 408h30M232 402h52M378 410h28M520 404h40M600 412h24" />
      <path d="M70 388h22M300 392h18M590 394h22" opacity=".7" />
    </g>
    <ellipse cx="180" cy="356" rx="205" ry="32" fill="#0b0a08" opacity=".45" />
    {ranks.map((rank, index) => {
      const xs = Array.from({ length: Math.floor((rank.to - rank.from) / rank.step) + 1 }, (_, i) => rank.from + i * rank.step);
      return <g key={rank.y}>
        {xs.map(x => <Soldier key={x} x={x} y={rank.y} s={rank.s} lowered={rank.lowered} tone={rankTones[index]} />)}
        {animate && <animateTransform attributeName="transform" type="translate" values="0 0;0 -1.4;0 0" dur=".9s" begin={`${index * .22}s`} repeatCount="indefinite" />}
      </g>;
    })}

    <ellipse cx="462" cy="395" rx="84" ry="7" fill="#000" opacity=".35" />
    <g>
      {/* Far legs and tail */}
      <path d="M482 322 478 352 496 366M428 330 440 358 430 380" fill="none" stroke="#9e927d" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M404 302C380 300 364 314 350 338 372 324 386 320 404 316Z" fill="#a89b85" />
      {/* Cloak, behind the rider */}
      <path d="M456 254C432 258 410 254 384 244 396 264 412 282 440 298Z" fill="#b8793a" />
      <path d="M402 298C420 288 470 286 490 296L496 322C480 336 430 338 410 330Z" fill="#d9ccb4" />
      <path d="M476 300 502 248 520 256 500 322Z" fill="#d9ccb4" />
      <path d="M502 246 512 238 540 258 545 268 534 275 518 263Z" fill="#d9ccb4" />
      <path d="M508 243 507 232 515 241Z" fill="#c6b89f" />
      <path d="M410 330C430 338 480 336 496 322L494 312C470 324 430 326 410 322Z" fill="#bcae95" />
      <circle cx="520" cy="252" r="2.2" fill="#13110e" />
      <path d="M474 300 486 290 484 280 494 272 492 262 503 250" fill="none" stroke="#a89b85" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      {/* Near legs */}
      <path d="M490 318 516 338 540 336M418 326 402 358 384 390" fill="none" stroke="#e6dbc6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      {/* Rider */}
      <path d="M448 300 468 312 462 334" fill="none" stroke="#d9a65c" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M436 302H458L472 256 452 250Z" fill="#efbd70" />
      <path d="M430 296 570 174" stroke="#f2eee7" strokeWidth="3" strokeLinecap="round" />
      <path d="M566.7 170.2 586.6 159.5 573.3 177.8Z" fill="#efbd70" />
      <path d="M466 262 494 240" stroke="#efbd70" strokeWidth="7" strokeLinecap="round" />
      <circle cx="471" cy="239" r="11" fill="#e8c88f" />
      <path d="M459 238A12.5 12.5 0 0 1 484 236L482 243H461Z" fill="#f2eee7" />
      <path d="M481 233C480 216 466 208 452 210 442 212 436 220 434 230 442 224 450 224 458 230 464 226 474 228 481 233Z" fill="#efbd70" />
      {animate && <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur=".75s" repeatCount="indefinite" />}
    </g>
  </svg>;
}

/* ---------- Oppenheimer: many disciplines, one problem, one director ---------- */

const atom = { x: 430, y: 150, rx: 128, ry: 38 };
const orbitPath = `M${atom.x - atom.rx} ${atom.y}a${atom.rx} ${atom.ry} 0 1 0 ${atom.rx * 2} 0a${atom.rx} ${atom.ry} 0 1 0 ${-atom.rx * 2} 0`;
const orbits = [
  { angle: 0, dur: "7s", t: 2.4 },
  { angle: 60, dur: "9s", t: .6 },
  { angle: -60, dur: "11s", t: 4.1 },
];

const facets = (() => {
  const at = (radius: number, deg: number) => [atom.x + Math.cos(deg * Math.PI / 180) * radius, atom.y + Math.sin(deg * Math.PI / 180) * radius];
  const fmt = ([x, y]: number[]) => `${r1(x)} ${r1(y)}`;
  const pentagon = [0, 1, 2, 3, 4].map(k => at(10, -90 + k * 72));
  let lines = `M${pentagon.map(fmt).join("L")}Z`;
  for (let k = 0; k < 5; k += 1) {
    const deg = -90 + k * 72;
    const outer = at(20, deg);
    const mid = at(25, deg + 36);
    const nextOuter = at(20, deg + 72);
    lines += `M${fmt(pentagon[k])}L${fmt(outer)}L${fmt(mid)}L${fmt(nextOuter)}M${fmt(mid)}L${fmt(at(30, deg + 36))}M${fmt(outer)}L${fmt(at(30, deg - 8))}M${fmt(outer)}L${fmt(at(30, deg + 8))}`;
  }
  return { pentagon: `M${pentagon.map(fmt).join("L")}Z`, lines };
})();

const scientists = [
  { x: 228, y: 352, tone: "#8d8273" }, { x: 304, y: 350, tone: "#7a705f" }, { x: 322, y: 356, tone: "#8d8273" },
  { x: 402, y: 344, tone: "#7a705f" }, { x: 456, y: 342, tone: "#8d8273" }, { x: 474, y: 348, tone: "#7a705f" },
  { x: 536, y: 358, tone: "#8d8273" }, { x: 594, y: 354, tone: "#7a705f" }, { x: 612, y: 360, tone: "#8d8273" },
];

function Scientist({ x, y, tone }: { x: number; y: number; tone: string }) {
  return <g>
    <path d={`M${x - 6} ${y}L${x - 5} ${y - 19}Q${x} ${y - 24} ${x + 5} ${y - 19}L${x + 6} ${y}Z`} fill={tone} />
    <circle cx={x} cy={y - 27} r="5" fill="#a89a85" />
  </g>;
}

function OppenheimerArt({ animate }: { animate: boolean }) {
  const rawId = svgId(useId());
  const titleId = `${rawId}-title`;
  const glowId = `${rawId}-glow`;
  return <svg className="legend-art legend-art-oppenheimer" viewBox="0 0 640 420" role="img" aria-labelledby={titleId}>
    <title id={titleId}>Abstract illustration: J. Robert Oppenheimer, in a porkpie hat with a pipe, gestures toward an atom above the Los Alamos mesa while teams of physicists, chemists and engineers connect their work to it.</title>
    <defs>
      <radialGradient id={glowId}>
        <stop offset="0" stopColor="#efbd70" stopOpacity=".26" />
        <stop offset="1" stopColor="#efbd70" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="640" height="420" fill="#13110e" />
    <circle cx={atom.x} cy={atom.y} r="118" fill={`url(#${glowId})`} />

    {/* Distant flat-topped mesas */}
    <path d="M0 270V252l22-4 26-12h70l14 12 38 4 20 18ZM470 270l22-20 24-4 20-14h82l12 12 10 2v24ZM220 270l20-10h60l18 10Z" fill="#1d1a14" />
    <rect y="270" width="640" height="150" fill="#18150f" />
    <path d="M0 270H640" stroke="#3a3024" />

    {/* Laboratory buildings and a water tower */}
    <path d="m210 284 53-10 53 10Z" fill="#332c22" />
    <rect x="214" y="284" width="98" height="18" fill="#2a251e" />
    <path d="m466 286 48-9 48 9Z" fill="#332c22" />
    <rect x="470" y="286" width="88" height="16" fill="#2a251e" />
    <g fill="#efbd70" opacity=".55">
      {[222, 236, 250, 264, 278, 292].map(x => <rect key={x} x={x} y="290" width="6" height="4" />)}
      {[478, 492, 506, 520, 534].map(x => <rect key={x} x={x} y="291" width="6" height="4" />)}
    </g>
    <path d="M592 302 597 262M613 302 608 262M594 288H611" stroke="#3a3328" strokeWidth="2" />
    <rect x="588" y="244" width="29" height="19" rx="3" fill="#2a251e" />
    <path d="m588 244 14-8 15 8Z" fill="#332c22" />

    {/* Atom: three orbits around a faceted core */}
    {orbits.map(orbit => {
      const t = orbit.t;
      return <g key={orbit.angle} transform={orbit.angle ? `rotate(${orbit.angle} ${atom.x} ${atom.y})` : undefined}>
        <path d={orbitPath} fill="none" stroke="#5a4930" strokeWidth="1.2" />
        {animate
          ? <circle r="4" fill="#efbd70"><animateMotion dur={orbit.dur} repeatCount="indefinite" path={orbitPath} /></circle>
          : <circle cx={r1(atom.x + Math.cos(t) * atom.rx)} cy={r1(atom.y + Math.sin(t) * atom.ry)} r="4" fill="#efbd70" />}
      </g>;
    })}
    <circle cx={atom.x} cy={atom.y} r="30" fill="#efbd70" />
    <path d={facets.pentagon} fill="#f6d39f" />
    <path d={facets.lines} fill="none" stroke="#a37a42" strokeWidth="1.1" strokeLinejoin="round" />

    {/* Each discipline sends its work to the same problem */}
    <g fill="none" stroke="#c48f48" strokeWidth="1.4" strokeDasharray="3 7" strokeLinecap="round" opacity=".8">
      <path d="M266 300C290 230 360 190 404 166" />
      <path d="M430 304V182" />
      <path d="M570 306C560 240 500 190 456 168" />
      {animate && <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.6s" repeatCount="indefinite" />}
    </g>
    <path d="M208 262C260 220 330 180 400 160" fill="none" stroke="#efbd70" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />

    {/* Theory, chemistry, engineering */}
    <path d="M244 326V340M282 326V340" stroke="#4a443b" strokeWidth="2" />
    <rect x="238" y="302" width="50" height="25" rx="1.5" fill="#201d18" stroke="#6d6557" />
    <path d="M245 312q4-5 8 0t8 0M268 310h12M246 320h18m4 0 3-3 3 3 3-3" fill="none" stroke="#d8cdb9" strokeWidth="1.2" strokeLinecap="round" opacity=".6" />
    <path d="M424 306h12v8l10 17h-32l10-17Z" fill="none" stroke="#a89a85" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M419 324h22l5 7h-32Z" fill="#efbd70" opacity=".5" />
    <g transform="translate(568 324)" fill="#a89a85">
      {[0, 45, 90, 135].map(deg => <rect key={deg} x="-2.5" y="-13" width="5" height="26" rx="1" transform={`rotate(${deg})`} />)}
      <circle r="9.5" />
      <circle r="4" fill="#18150f" />
    </g>
    {scientists.map(person => <Scientist key={person.x} {...person} />)}

    {/* The director: tall, thin, porkpie hat, pipe */}
    <ellipse cx="152" cy="406" rx="36" ry="5" fill="#000" opacity=".35" />
    <path d="M138 318H151L146 402H136ZM152 318H165L171 400 160 402Z" fill="#c98a3e" />
    <ellipse cx="141" cy="404" rx="9" ry="3.5" fill="#8a6434" />
    <ellipse cx="168" cy="402" rx="9" ry="3.5" fill="#8a6434" />
    <path d="M134 262 132 304" stroke="#d9a65c" strokeWidth="8" strokeLinecap="round" />
    <path d="M128 257Q146 247 168 251L171 323 134 325Z" fill="#efbd70" />
    <path d="M144 251h12l-6 26Z" fill="#f2eee7" />
    <path d="M150 256v18" stroke="#8a6434" strokeWidth="2" />
    <path d="M165 257 182 283 204 264" fill="none" stroke="#efbd70" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="145" y="236" width="10" height="16" fill="#d9b679" />
    <ellipse cx="151" cy="229" rx="10" ry="13" fill="#e8c88f" />
    <path d="m160 224 6 7-6 3Z" fill="#e8c88f" />
    <path d="M159 237 171 240" stroke="#8a6434" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M170 233h7v8q0 2-2 2h-3q-2 0-2-2Z" fill="#8a6434" />
    <path d="M174 230C167 218 183 210 175 197 169 187 181 179 177 168" fill="none" stroke="#f2eee7" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="6 9" opacity=".5">
      {animate && <animate attributeName="stroke-dashoffset" from="0" to="-30" dur="2.4s" repeatCount="indefinite" />}
    </path>
    <path d="M131 218Q152 223 172 216L172 220Q152 227 131 222Z" fill="#f2eee7" />
    <path d="M140 219 141 202Q152 197 163 202L164 219Z" fill="#f2eee7" />
    <path d="M140.5 212H163.5V216H140.5Z" fill="#8a6434" />
  </svg>;
}

const legends = [
  {
    key: "alexander",
    label: "331 BC / Gaugamela",
    name: "Alexander the Great",
    copy: "Outnumbered, his army moved as one formation. Every rank held its place, and when a gap opened in the opposing line, he led the charge through it.",
    Art: AlexanderArt,
  },
  {
    key: "oppenheimer",
    label: "1943–1945 / Los Alamos",
    name: "J. Robert Oppenheimer",
    copy: "As director of the Manhattan Project’s Los Alamos laboratory, he brought physicists, chemists and engineers to one mesa to solve a problem no single field could. Its consequences are still weighed today.",
    Art: OppenheimerArt,
  },
] as const;

export default function CompetitiveLegends() {
  const reduce = useReducedMotion();
  return <section className="competitive-legends" aria-labelledby="competitive-legends-heading">
    <div className="product-container">
      <header className="competitive-legends-heading">
        <div>
          <p className="product-eyebrow">Teams that moved history</p>
          <h2 id="competitive-legends-heading">Every great plan<br /><span>needed a team.</span></h2>
        </div>
        <p>Long before Realms, the hardest challenges were met the same way: someone reads the situation, everyone takes a role, and the plan holds only if the team does.</p>
      </header>
      <div className="competitive-legend-grid">
        {legends.map(({ key, label, name, copy, Art }, index) => <ProductReveal key={key} className="competitive-legend-reveal" delay={index * .08}>
          <figure className="competitive-legend" data-legend={key}>
            <div className="competitive-legend-art"><Art animate={!reduce} /></div>
            <figcaption>
              <p className="competitive-legend-label">{label}</p>
              <h3>{name}</h3>
              <p>{copy}</p>
            </figcaption>
          </figure>
        </ProductReveal>)}
      </div>
    </div>
  </section>;
}
