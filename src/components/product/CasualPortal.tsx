import { useEffect, useRef, type CSSProperties } from "react";
import { ArrowDownRight } from "lucide-react";
import CasualWorldPoster, { type WorldId } from "./CasualWorldPoster";
import TidalArchiveScene from "./TidalArchiveScene";

/*
 * The way in. A row of worlds floats like a feed; as the visitor scrolls, the middle one opens
 * from a reel into the whole screen and they arrive in the Tidal Archive. The open world is one
 * full-bleed layer whose clip and camera are driven by scroll, so nothing re-renders while scrolling.
 */

const reels: { world: WorldId | "archive"; size: "s" | "m" | "l"; name: string; shift: number }[] = [
  { world: "orchard", size: "s", name: "The Glass Orchard", shift: 52 },
  { world: "observatory", size: "m", name: "The Salt Observatory", shift: -34 },
  { world: "archive", size: "l", name: "The Tidal Archive", shift: 0 },
  { world: "lift", size: "m", name: "The Last Lift", shift: 38 },
  { world: "delta", size: "s", name: "The Lantern Delta", shift: -46 },
];

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (t: number) => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

export default function CasualPortal() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const camera = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);

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

  return <section ref={section} className="casual-portal" aria-labelledby="casual-portal-heading">
    <div ref={stage} className="casual-portal-stage">
      <div className="casual-portal-feed" aria-hidden="true">
        {reels.map((reel, index) => {
          const side = index < 2 ? -1 : index > 2 ? 1 : 0;
          return <div key={reel.world} className="casual-portal-reel" data-size={reel.size} data-world={reel.world} style={{ "--shift": `${reel.shift}px`, "--side": side, "--bob": `${index * -1.3}s` } as CSSProperties}>
            <div className="casual-portal-reel-body" ref={reel.world === "archive" ? slot : undefined}>
              {reel.world === "archive" ? <div className="casual-portal-fallback"><TidalArchiveScene beat="arrive" /></div> : <CasualWorldPoster world={reel.world} />}
              <span className="casual-portal-reel-bars" style={{ "--fill": `${30 + index * 13}%` } as CSSProperties}><i /><i /><i /></span>
              <span className="casual-portal-reel-name">{reel.name}</span>
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
        <p className="casual-portal-eyebrow">Casual / Follow the unknown</p>
        <h2 id="casual-portal-heading">Leave this world <span>for a while.</span></h2>
        <p>Strange, beautiful places, each one waiting on your first move. Scroll to step into one.</p>
        <a className="casual-portal-cta" href="#casual-signal">Play the opening <ArrowDownRight size={18} strokeWidth={1.6} aria-hidden="true" /></a>
      </div>

      <div className="casual-portal-arrival" aria-hidden="true">
        <p className="casual-portal-arrival-kicker">Now entering</p>
        <p className="casual-portal-arrival-name">The Tidal Archive</p>
        <p className="casual-portal-arrival-line">A rising tide. One power reserve. Where would you go first?</p>
      </div>
      <div className="casual-portal-progress" aria-hidden="true"><i /></div>
    </div>
  </section>;
}
