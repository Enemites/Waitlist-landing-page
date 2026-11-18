import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowDownRight, Play } from "lucide-react";
import CasualWorldPoster, { type WorldId } from "./CasualWorldPoster";
import TidalArchiveScene from "./TidalArchiveScene";
import { CasualSecret } from "./CasualGame";
import type { PlayId } from "./CasualReel";

/*
 * The way in. A hand of worlds in different moods floats like a feed and leans toward the pointer;
 * hovering one lifts it and quiets the rest. Each card leads with its situation, not its name, and a
 * playable world says how long it takes. Picking a playable world opens it in the reel; any other
 * world is dealt on the World Maker, so a card never promises more than it opens. Scrolling opens the middle
 * one, the Tidal Archive, from a reel into the whole screen. The open world is one full-bleed layer
 * whose clip and camera are driven by scroll, so nothing re-renders while scrolling.
 */

// The feed mixes moods: friends and kites, a chase, the quiet archive, a snowball war, a funfair after dark.
// Neighbours differ in what you do, not only in colour. A playable world's hook is its opening situation,
// short enough for a small card; a world that opens on the World Maker says so, since it opens no scripted scene.
const reels: { world: WorldId | "archive"; size: "s" | "m" | "l"; name: string; genre: string; hook: string; shift: number }[] = [
  { world: "kites", size: "s", name: "Kite Hill", genre: "With friends", hook: "Make a day on the hill.", shift: 52 },
  { world: "rooftop", size: "m", name: "Rooftop Relay", genre: "Action", hook: "A drone is on your tail.", shift: -34 },
  { world: "archive", size: "l", name: "The Tidal Archive", genre: "Mystery", hook: "The relay is blinking. Nobody's there.", shift: 0 },
  { world: "snowball", size: "m", name: "Snowball Siege", genre: "Team battle", hook: "Your wall is half down.", shift: 38 },
  { world: "funfair", size: "s", name: "Midnight Funfair", genre: "Spooky", hook: "Make a night at the fair.", shift: -46 },
];
const playable = (world: WorldId | "archive"): world is PlayId => world === "archive" || world === "rooftop" || world === "snowball";

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (t: number) => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

export default function CasualPortal({ onPick, onPlay }: { onPick?: (world: WorldId) => void; onPlay?: (world: PlayId) => void }) {
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
    if (playable(world)) onPlay?.(world);
    else onPick?.(world);
  };

  return <section ref={section} className="casual-portal" aria-labelledby="casual-portal-heading">
    <div ref={stage} className="casual-portal-stage" onPointerMove={onPointerMove}>
      <div className="casual-portal-feed">
        {reels.map((reel, index) => {
          const side = index < 2 ? -1 : index > 2 ? 1 : 0;
          return <div key={reel.world} className="casual-portal-reel" data-size={reel.size} data-world={reel.world} style={{ "--shift": `${reel.shift}px`, "--side": side, "--bob": `${index * -1.3}s`, "--depth": `${[.9, .6, 0, .6, .9][index]}` } as CSSProperties}>
            <div className="casual-portal-reel-float">
              <button type="button" className="casual-portal-reel-body" ref={reel.world === "archive" ? slot : undefined} onClick={() => choose(reel.world)} aria-label={playable(reel.world) ? `Play ${reel.name}, about 30 seconds: ${reel.hook}` : `Spin up a world in ${reel.name} on the World Maker`}>
                {reel.world === "archive" ? <span className="casual-portal-fallback"><TidalArchiveScene beat="arrive" /></span> : <CasualWorldPoster world={reel.world} />}
                <span className="casual-portal-reel-bars" style={{ "--fill": `${30 + index * 13}%` } as CSSProperties}><i /><i /><i /></span>
                <span className="casual-portal-reel-genre">{reel.genre}</span>
                <span className="casual-portal-reel-name" data-kind={playable(reel.world) ? "play" : "make"}><b>{reel.hook}</b><small>{reel.name} · {playable(reel.world) ? "30s" : "World Maker"}</small></span>
              </button>
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
        <p>A quiet mystery at sea. A chase across the rooftops. A snowball war with your friends. Tap in to change it, or just watch it play.</p>
        <div className="casual-portal-actions">
          <a className="casual-btn" href="#casual-signal">Play an opening <ArrowDownRight size={18} strokeWidth={2.4} aria-hidden="true" /></a>
          <a className="casual-btn casual-btn-ghost" href="#casual-maker">Make a world</a>
        </div>
      </div>

      <div className="casual-portal-arrival">
        <p className="casual-portal-arrival-kicker"><span>Level 01</span><em>Mystery</em></p>
        <p className="casual-portal-arrival-name">The Tidal Archive</p>
        <p className="casual-portal-arrival-line">A rising tide. One power reserve. Where would you go first?</p>
        <a className="casual-btn casual-portal-start" href="#casual-signal">Press start <Play size={16} fill="currentColor" aria-hidden="true" /></a>
      </div>
      <CasualSecret id="falling-star" className="casual-falling-star" label="A falling star over the archive"><i /></CasualSecret>
      <div className="casual-portal-progress" aria-hidden="true"><i /></div>
    </div>
  </section>;
}
