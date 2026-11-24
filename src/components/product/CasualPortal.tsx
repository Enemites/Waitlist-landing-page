import { useEffect, useRef, type CSSProperties } from "react";
import { ArrowDownRight, Play } from "lucide-react";
import { CasualSecret } from "./CasualGame";
import { type PlayId } from "./CasualReel";
import CasualPortalArt from "./CasualPortalScenes";

/*
 * The way in. Three high-craft procedural Canvas 2D worlds float like a live mobile feed;
 * hovering one lifts it smoothly via GPU-only transforms. Clicking any card opens that world
 * in the playable reel below. Scrolling smoothly expands the centre world (Signal Zero) from
 * its phone frame into the full viewport using a single cached GPU canvas texture at 60fps.
 */

type PortalReel = {
  world: PlayId;
  size: "m" | "l";
  name: string;
  genre: string;
  hook: string;
  shift: number;
};

const reels: PortalReel[] = [
  {
    world: "rooftop",
    size: "m",
    name: "Midnight Vault",
    genre: "Heist · 90s",
    hook: "The laser grid resets in 12 seconds. Your crew just locked you inside.",
    shift: -28,
  },
  {
    world: "archive",
    size: "l",
    name: "Signal Zero",
    genre: "Sci-Fi · Ep. 01",
    hook: "The space station went dark. One airlock is opening from the outside.",
    shift: 0,
  },
  {
    world: "snowball",
    size: "m",
    name: "Crownfall",
    genre: "Arena · 4 Players",
    hook: "The bridge collapses behind you. Only one seat left on the drop-ship.",
    shift: 32,
  },
];

const CENTRE = 1;
const FEATURED_REEL = reels[CENTRE];

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (t: number) => t * t * (3 - 2 * t);

export default function CasualPortal({ onPlay }: { onPlay?: (world: PlayId) => void }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const camera = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastProgress = -1;
    let lastOpen: boolean | null = null;
    let lastArrived: boolean | null = null;
    let start = { top: 0, right: 0, bottom: 0, left: 0 };

    const measure = () => {
      if (!stage.current || !slot.current) return;
      const s = stage.current.getBoundingClientRect();
      const r = slot.current.getBoundingClientRect();
      start = {
        top: Math.max(0, r.top - s.top),
        right: Math.max(0, s.right - r.right),
        bottom: Math.max(0, s.bottom - r.bottom),
        left: Math.max(0, r.left - s.left),
      };
      lastProgress = -1;
    };

    const render = () => {
      frame = 0;
      if (!section.current || !stage.current || !world.current || !camera.current) return;
      const rect = section.current.getBoundingClientRect();
      const range = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / range);
      if (Math.abs(progress - lastProgress) < 0.0005) return;
      lastProgress = progress;

      const e = smoothstep(clamp((progress - 0.04) / 0.64));
      const k = 1 - e;
      const radius = 22 * k;

      world.current.style.clipPath = `inset(${(start.top * k).toFixed(1)}px ${(start.right * k).toFixed(1)}px ${(start.bottom * k).toFixed(1)}px ${(start.left * k).toFixed(1)}px round ${radius.toFixed(1)}px)`;
      const scale = 1.05 - 0.05 * e;
      camera.current.style.transform = `translate3d(0, 0, 0) scale(${scale.toFixed(4)})`;

      stage.current.style.setProperty("--e", e.toFixed(3));
      stage.current.style.setProperty("--arrive", smoothstep(clamp((progress - 0.56) / 0.24)).toFixed(3));

      const isOpen = e > 0.5;
      if (isOpen !== lastOpen) {
        lastOpen = isOpen;
        stage.current.dataset.open = isOpen ? "true" : "false";
      }
      const isArrived = progress > 0.58;
      if (isArrived !== lastArrived) {
        lastArrived = isArrived;
        stage.current.dataset.arrived = isArrived ? "true" : "false";
      }
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
      <div className="casual-portal-feed">
        {reels.map((reel, index) => {
          const side = Math.sign(index - CENTRE);
          return <div key={reel.world} className="casual-portal-reel" data-size={reel.size} data-world={reel.world} style={{ "--shift": `${reel.shift}px`, "--side": side, "--bob": `${index * -1.4}s` } as CSSProperties}>
            <div className="casual-portal-reel-float">
              <button type="button" className="casual-portal-reel-body" ref={reel.world === "archive" ? slot : undefined} onClick={() => onPlay?.(reel.world)} aria-label={`Play ${reel.name}: ${reel.hook}`}>
                {reel.world === "archive"
                  ? <span className="casual-portal-fallback"><CasualPortalArt world="archive" /></span>
                  : <CasualPortalArt world={reel.world} />}
                <span className="casual-portal-reel-bars" style={{ "--fill": `${32 + index * 14}%` } as CSSProperties}><i /><i /><i /></span>
                <span className="casual-portal-reel-genre">{reel.genre}</span>
                <span className="casual-portal-reel-name"><b>{reel.hook}</b><small>{reel.name}</small></span>
              </button>
            </div>
          </div>;
        })}
      </div>

      <div ref={world} className="casual-portal-world">
        <div ref={camera} className="casual-portal-camera">
          <CasualPortalArt world="archive" wide />
        </div>
      </div>

      <div className="casual-portal-copy">
        <p className="casual-eyebrow">Casual / Instant Play</p>
        <h2 id="casual-portal-heading">Pick a world. <span>Jump in.<svg viewBox="0 0 220 24" aria-hidden="true"><path d="M4 16c18-10 30-10 42 0s26 10 40 0 28-10 42 0 26 10 40 0 26-10 48-2" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /></svg></span></h2>
        <p>Swipe into a living world in seconds. One choice, instant consequences, zero tutorial walls.</p>
        <div className="casual-portal-actions">
          <a className="casual-btn" href="#casual-signal">Play an opening <ArrowDownRight size={18} strokeWidth={2.4} aria-hidden="true" /></a>
          <a className="casual-btn casual-btn-ghost" href="#casual-maker">Make a world</a>
        </div>
      </div>

      <div className="casual-portal-arrival">
        <p className="casual-portal-arrival-kicker"><span>Episode 01</span><em>Sci-Fi</em></p>
        <p className="casual-portal-arrival-name">{FEATURED_REEL.name}</p>
        <p className="casual-portal-arrival-line">{FEATURED_REEL.hook}</p>
        <a className="casual-btn casual-portal-start" href="#casual-signal">Press start <Play size={16} fill="currentColor" aria-hidden="true" /></a>
      </div>
      <CasualSecret id="falling-star" className="casual-falling-star" label="A falling star over Signal Zero"><i /></CasualSecret>
      <div className="casual-portal-progress" aria-hidden="true"><i /></div>
    </div>
  </section>;
}
