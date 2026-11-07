import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowDownRight, Play } from "lucide-react";
import CasualWorldPoster, { type WorldId } from "./CasualWorldPoster";
import TidalArchiveScene from "./TidalArchiveScene";
import { CasualSecret } from "./CasualGame";

/*
 * The way in. A hand of worlds floats like a feed and leans toward the pointer; hovering one floods
 * the stage with its colour, and picking one sends it to the World Maker. Scrolling opens the middle
 * one, the Tidal Archive, from a reel into the whole screen. The open world is one full-bleed layer
 * whose clip and camera are driven by scroll, so nothing re-renders while scrolling.
 */

const reels: { world: WorldId | "archive"; size: "s" | "m" | "l"; name: string; genre: string; shift: number }[] = [
  { world: "orchard", size: "s", name: "The Glass Orchard", genre: "Mystery", shift: 52 },
  { world: "observatory", size: "m", name: "The Salt Observatory", genre: "Chase", shift: -34 },
  { world: "archive", size: "l", name: "The Tidal Archive", genre: "Survival", shift: 0 },
  { world: "lift", size: "m", name: "The Last Lift", genre: "Rescue", shift: 38 },
  { world: "delta", size: "s", name: "The Lantern Delta", genre: "Quest", shift: -46 },
];

/** Sparkles scattered behind the feed, in the path's party colours. */
const sparkles = [
  { x: 47, y: 22, s: 18, c: "#ffd23f", d: 0 }, { x: 58, y: 84, s: 12, c: "#3ee6c8", d: .8 }, { x: 92, y: 18, s: 14, c: "#ff6ad5", d: 1.6 },
  { x: 36, y: 78, s: 10, c: "#b9b3f5", d: 2.1 }, { x: 80, y: 88, s: 16, c: "#ff7a59", d: 1.1 }, { x: 70, y: 12, s: 10, c: "#3ee6c8", d: 2.6 },
];

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (t: number) => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

export default function CasualPortal({ onPick }: { onPick?: (world: WorldId) => void }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const camera = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let start = { top: 0, right: 0, bottom: 0, left: 0, cx: 0, cy: 0, scale: .7, fx: 0, fy: 0 };

    const measure = () => {
      if (!stage.current || !slot.current) return;
      const s = stage.current.getBoundingClientRect();
      const r = slot.current.getBoundingClientRect();
      const cover = Math.max(s.width / 1200, s.height / 1000);
      // The reel shows about 640 canvas rows at first, centred just under the moon.
      const scale = Math.min(1, Math.max(.4, r.height / 640 / cover));
      start = {
        top: r.top - s.top, right: s.right - r.right, bottom: s.bottom - r.bottom, left: r.left - s.left,
        cx: r.left - s.left + r.width / 2, cy: r.top - s.top + r.height / 2, scale,
        fx: s.width / 2 + (610 - 600) * cover, fy: s.height / 2 + (470 - 500) * cover,
      };
    };

    const render = () => {
      frame = 0;
      if (!section.current || !stage.current || !world.current || !camera.current) return;
      const rect = section.current.getBoundingClientRect();
      const range = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / range);
      const e = ease(clamp((progress - .05) / .62));
      const k = 1 - e;
      const radius = 22 * k;
      world.current.style.clipPath = `inset(${(start.top * k).toFixed(1)}px ${(start.right * k).toFixed(1)}px ${(start.bottom * k).toFixed(1)}px ${(start.left * k).toFixed(1)}px round ${radius.toFixed(1)}px)`;
      const scale = start.scale + (1 - start.scale) * e;
      const tx = (start.cx - start.scale * start.fx) * k;
      const ty = (start.cy - start.scale * start.fy) * k;
      camera.current.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
      stage.current.style.setProperty("--e", e.toFixed(3));
      stage.current.style.setProperty("--arrive", clamp((progress - .6) / .2).toFixed(3));
      stage.current.dataset.open = e > .5 ? "true" : "false";
      stage.current.dataset.arrived = progress > .62 ? "true" : "false";
    };

    const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
    const resize = () => { measure(); schedule(); };
    const setup = () => {
      if (!section.current) return;
      if (motion.matches) {
        section.current.dataset.ready = "false";
        window.removeEventListener("scroll", schedule);
        return;
      }
      section.current.dataset.ready = "true";
      measure();
      render();
      window.addEventListener("scroll", schedule, { passive: true });
    };

    setup();
    window.addEventListener("resize", resize);
    motion.addEventListener("change", setup);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", setup);
    };
  }, []);

  const lean = useRef(0);
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || lean.current) return;
    const { clientX, clientY } = event;
    lean.current = requestAnimationFrame(() => {
      lean.current = 0;
      const node = stage.current;
      if (!node) return;
      const r = node.getBoundingClientRect();
      node.style.setProperty("--mx", (((clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      node.style.setProperty("--my", (((clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    });
  };

  const choose = (world: WorldId | "archive") => {
    if (world === "archive") document.getElementById("casual-signal")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    else onPick?.(world);
  };

  return <section ref={section} className="casual-portal" aria-labelledby="casual-portal-heading">
    <div ref={stage} className="casual-portal-stage" onPointerMove={onPointerMove}>
      <div className="casual-portal-sparkles" aria-hidden="true">
        {sparkles.map((p, i) => <svg key={i} viewBox="0 0 20 20" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, color: p.c, animationDelay: `${p.d}s` }}><path d="M10 0c.8 5.6 3.4 8.2 10 10-6.6 1.8-9.2 4.4-10 10-.8-5.6-3.4-8.2-10-10C6.6 8.2 9.2 5.6 10 0Z" fill="currentColor" /></svg>)}
      </div>
      <div className="casual-portal-feed">
        <span className="casual-portal-doodle" aria-hidden="true">
          <span className="casual-sticker" data-tone="aqua">Pick one!</span>
          <svg viewBox="0 0 90 70"><path d="M8 8c30 2 52 16 60 46m-14-8 14 9 6-16" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        {reels.map((reel, index) => {
          const side = index < 2 ? -1 : index > 2 ? 1 : 0;
          return <div key={reel.world} className="casual-portal-reel" data-size={reel.size} data-world={reel.world} style={{ "--shift": `${reel.shift}px`, "--side": side, "--bob": `${index * -1.3}s`, "--depth": `${[.9, .6, 0, .6, .9][index]}` } as CSSProperties}>
            <div className="casual-portal-reel-float">
              <button type="button" className="casual-portal-reel-body" ref={reel.world === "archive" ? slot : undefined} onClick={() => choose(reel.world)} aria-label={reel.world === "archive" ? `Play ${reel.name}` : `Spin up a world in ${reel.name}`}>
                {reel.world === "archive" ? <span className="casual-portal-fallback"><TidalArchiveScene beat="arrive" /></span> : <CasualWorldPoster world={reel.world} />}
                <span className="casual-portal-reel-bars" style={{ "--fill": `${30 + index * 13}%` } as CSSProperties}><i /><i /><i /></span>
                <span className="casual-portal-reel-genre">{reel.genre}</span>
                <span className="casual-portal-reel-name">{reel.name}</span>
              </button>
              {reel.world === "archive" && <span className="casual-sticker casual-portal-playme" data-tone="yellow" aria-hidden="true"><Play size={12} fill="currentColor" />Play me</span>}
            </div>
          </div>;
        })}
      </div>

      <div ref={world} className="casual-portal-world">
        <div ref={camera} className="casual-portal-camera">
          <TidalArchiveScene beat="arrive" label="The Tidal Archive at night: an archive stands half in the sea against a low moon, a relay blinking on its roof, a thin crossing back to the shore." />
        </div>
      </div>

      <div className="casual-portal-copy">
        <p className="casual-eyebrow">Casual / Follow the unknown</p>
        <h2 id="casual-portal-heading">Pick a world. <span>Jump in.<svg viewBox="0 0 220 24" aria-hidden="true"><path d="M4 16c18-10 30-10 42 0s26 10 40 0 28-10 42 0 26 10 40 0 26-10 48-2" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /></svg></span></h2>
        <p>Wild places, strange situations, and a move only you can make. No tutorial. No wrong answer.</p>
        <div className="casual-portal-actions">
          <a className="casual-btn" href="#casual-signal">Play the opening <ArrowDownRight size={18} strokeWidth={2.4} aria-hidden="true" /></a>
          <span className="casual-sticker" data-tone="pink">3 endings · 3 secrets</span>
        </div>
      </div>

      <div className="casual-portal-arrival">
        <p className="casual-portal-arrival-kicker"><span>Level 01</span><em>Survival</em></p>
        <p className="casual-portal-arrival-name">The Tidal Archive</p>
        <p className="casual-portal-arrival-line">A rising tide. One power reserve. Where would you go first?</p>
        <a className="casual-btn casual-portal-start" href="#casual-signal">Press start <Play size={16} fill="currentColor" aria-hidden="true" /></a>
      </div>
      <CasualSecret id="falling-star" className="casual-falling-star" label="A falling star over the archive"><i /></CasualSecret>
      <div className="casual-portal-progress" aria-hidden="true"><i /></div>
    </div>
  </section>;
}
