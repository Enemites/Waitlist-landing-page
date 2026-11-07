import type { CSSProperties } from "react";

/**
 * The Casual mode's sky above the entry map: a few stars and the odd shooting star.
 * Decorative, drawn in the map's 960x460 viewBox.
 */

// Deterministic scatter so server and client render the same stars.
const rand = (i: number, salt: number) => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

const stars = Array.from({ length: 18 }, (_, i) => ({
  x: 440 + rand(i, 1) * 490,
  y: -60 + rand(i, 2) * 95,
  r: 0.8 + rand(i, 3) * 1.3,
  delay: rand(i, 4) * 5,
  duration: 2.6 + rand(i, 5) * 3.4,
}));

export default function RealmsNightSky() {
  return (
    <g className="ambience ambience--casual">
      {stars.map((s, i) => (
        <circle key={i} className="amb-star" cx={s.x} cy={s.y} r={s.r} style={{ animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s` } as CSSProperties} />
      ))}
      <path className="amb-comet" d="M840 -40L600 30" pathLength={1} />
    </g>
  );
}
