import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MoonStar, Pause, Play, RadioTower, RotateCcw, Split, Waves } from "lucide-react";
import TidalArchiveScene, { ARCHIVE_POINTS, type ArchiveBeat, type ArchiveChoice } from "./TidalArchiveScene";

/*
 * The opening of the Tidal Archive as a reel the visitor plays. It runs like a story (segments,
 * tap left or right, pause), but the third beat waits: the move is made by tapping a light in the
 * world, and the last beat is what that move did. Beside it, the same four beats say how Realms plays.
 */

const beats: ArchiveBeat[] = ["arrive", "signal", "choose", "outcome"];
const BEAT_MS: Record<ArchiveBeat, number> = { arrive: 6500, signal: 6500, choose: 0, outcome: 0 };

const story: Record<Exclude<ArchiveBeat, "outcome">, { kicker: string; title: string; body: string }> = {
  arrive: { kicker: "Arrive", title: "You wash up at the archive.", body: "Night. A low moon. A building half in the sea, and something on its roof still blinking." },
  signal: { kicker: "Listen", title: "Something is still calling.", body: "The relay pulses once, then goes quiet. Inside, a radio is trying to reach the shore." },
  choose: { kicker: "Your move", title: "One reserve. Three ways in.", body: "Tap a light in the world. The reserve can power only one of them." },
};

const outcomes: Record<ArchiveChoice, { move: string; title: string; body: string }> = {
  relay: { move: "Wake the relay", title: "A voice answers.", body: "Someone on the far shore heard you. Behind you, the tide takes the crossing." },
  crossing: { move: "Raise the crossing", title: "The way back holds.", body: "The crossing rises clear of the water. Inside the archive, the signal goes dark." },
  channel: { move: "Follow the lower channel", title: "You keep the reserve.", body: "A line of stones leads to a service passage below the waterline. The tide keeps rising." },
};

const mechanics = [
  { beat: "arrive", icon: MoonStar, label: "Arrive", title: "Open on a scene, not a menu.", body: "Every world starts in the middle of something: a place, a moment, and very little explanation." },
  { beat: "signal", icon: RadioTower, label: "Listen", title: "Clues come from the world.", body: "No tutorial pop-ups. A light blinks, a radio hisses, the tide moves. Reading them is part of the play." },
  { beat: "choose", icon: Split, label: "Decide", title: "Make your move inside it.", body: "You don't pick from a form. You wake a relay, raise a crossing, or follow a trail." },
  { beat: "outcome", icon: Waves, label: "Live with it", title: "The world remembers.", body: "Every move costs something. The next scene starts from what you did, not from a reset." },
] as const;

/** Hotspot positions as percentages of the 9:16 reel, which shows canvas x 318.75-881.25. */
const hotspot = (choice: ArchiveChoice): CSSProperties => ({
  left: `${((ARCHIVE_POINTS[choice].x - 318.75) / 562.5) * 100}%`,
  top: `${(ARCHIVE_POINTS[choice].y / 1000) * 100}%`,
});

export default function CasualReel() {
  const [beat, setBeat] = useState<ArchiveBeat>("arrive");
  const [choice, setChoice] = useState<ArchiveChoice | null>(null);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [round, setRound] = useState(0);
  const player = useRef<HTMLDivElement>(null);
  const index = beats.indexOf(beat);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { setReduce(motion.matches); if (motion.matches) setPaused(true); };
    sync();
    motion.addEventListener("change", sync);
    const node = player.current;
    const observer = node ? new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .55 }) : null;
    if (node && observer) observer.observe(node);
    return () => { motion.removeEventListener("change", sync); observer?.disconnect(); };
  }, []);

  const playing = inView && !paused && BEAT_MS[beat] > 0;

  const go = (next: ArchiveBeat) => {
    if (next === "outcome" && !choice) next = "choose";
    if (next !== "outcome") setChoice(null);
    setBeat(next);
    setRound(r => r + 1);
  };
  const forward = () => { if (index < 2) go(beats[index + 1]); };
  const back = () => {
    if (beat === "outcome") { setChoice(null); setBeat("choose"); setRound(r => r + 1); return; }
    if (index > 0) go(beats[index - 1]); else setRound(r => r + 1);
  };
  const choose = (next: ArchiveChoice) => { setChoice(next); setBeat("outcome"); setRound(r => r + 1); };
  const restart = () => { setChoice(null); setBeat("arrive"); setRound(r => r + 1); setPaused(reduce); };

  const caption = beat === "outcome" && choice ? { kicker: outcomes[choice].move, title: outcomes[choice].title, body: outcomes[choice].body } : story[beat === "outcome" ? "choose" : beat];
  const active = mechanics[index];

  return <section id="casual-signal" className="casual-reel-section" aria-labelledby="casual-reel-heading">
    <div className="product-container casual-reel-layout">
      <div className="casual-reel-intro">
        <p className="casual-portal-eyebrow">The Tidal Archive / Opening</p>
        <h2 id="casual-reel-heading">Feels like a reel. <span>Plays like a world.</span></h2>
        <p>Tap through the opening. When it's your move, make it in the world itself.</p>
      </div>

      <div ref={player} className="casual-reel" data-beat={beat} data-choice={choice ?? "none"} data-playing={playing}>
        <div className="casual-reel-screen">
          <TidalArchiveScene beat={beat} choice={choice} label={`The Tidal Archive. ${caption.title} ${caption.body}`} />
          <div className="casual-reel-scrim" aria-hidden="true" />

          <div className="casual-reel-top">
            <div className="casual-reel-segments" aria-hidden="true">
              {beats.map((b, i) => <span key={b} data-state={i < index ? "done" : i === index ? "active" : "next"}>
                <i key={i === index ? round : undefined} style={i === index && BEAT_MS[b] ? { animationDuration: `${BEAT_MS[b]}ms`, animationPlayState: playing ? "running" : "paused" } : undefined} onAnimationEnd={i === index ? forward : undefined} />
              </span>)}
            </div>
            <div className="casual-reel-meta">
              <span className="casual-reel-avatar" aria-hidden="true" />
              <p><strong>The Tidal Archive</strong><span>Casual · Opening</span></p>
              {BEAT_MS[beat] > 0 && <button type="button" className="casual-reel-icon" onClick={() => setPaused(p => !p)} aria-label={paused ? "Play the opening" : "Pause the opening"}>{paused ? <Play size={16} fill="currentColor" aria-hidden="true" /> : <Pause size={16} fill="currentColor" aria-hidden="true" />}</button>}
            </div>
          </div>

          {index < 2 && <>
            <button type="button" className="casual-reel-tap casual-reel-tap-back" onClick={back} aria-label="Previous scene" />
            <button type="button" className="casual-reel-tap casual-reel-tap-next" onClick={forward} aria-label="Next scene" />
          </>}

          {beat === "choose" && <div className="casual-reel-choices" role="group" aria-label="Choose your first move">
            {(Object.keys(outcomes) as ArchiveChoice[]).map(key => <button key={key} type="button" className="casual-reel-hotspot" data-choice={key} style={hotspot(key)} onClick={() => choose(key)}>
              <i aria-hidden="true" /><span>{outcomes[key].move}</span>
            </button>)}
          </div>}

          <div className="casual-reel-caption" aria-live="polite">
            <div key={`${beat}-${choice ?? "none"}`}>
            <p className="casual-reel-kicker">{caption.kicker}</p>
            <p className="casual-reel-title">{caption.title}</p>
            <p className="casual-reel-body">{caption.body}</p>
            {beat === "outcome" && <div className="casual-reel-after">
              <button type="button" onClick={back}><Split size={15} aria-hidden="true" />Try another way</button>
              <button type="button" onClick={restart}><RotateCcw size={15} aria-hidden="true" />Start over</button>
            </div>}
            {reduce && index < 2 && <button type="button" className="casual-reel-continue" onClick={forward}>Continue</button>}
            </div>
          </div>
        </div>
      </div>

      <ol className="casual-reel-rail" aria-label="How a Realms world plays">
        {mechanics.map((m, i) => {
          const Icon = m.icon;
          return <li key={m.beat} data-active={i === index}>
            <button type="button" onClick={() => go(m.beat)} aria-current={i === index ? "step" : undefined}>
              <span className="casual-reel-rail-icon"><Icon size={18} strokeWidth={1.6} aria-hidden="true" /></span>
              <span className="casual-reel-rail-label">{m.label}</span>
            </button>
          </li>;
        })}
      </ol>
      <div className="casual-reel-explain" key={active.beat}>
        <h3>{active.title}</h3>
        <p>{active.body}</p>
      </div>
    </div>
  </section>;
}
