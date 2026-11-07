import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Lock, MoonStar, Pause, Play, RadioTower, RotateCcw, Split, Trophy, Waves, Zap } from "lucide-react";
import TidalArchiveScene, { ARCHIVE_POINTS, type ArchiveBeat, type ArchiveChoice } from "./TidalArchiveScene";
import { CasualBurst, CasualSecret, endingNames, useCasualGame } from "./CasualGame";

/*
 * The opening of the Tidal Archive as a reel the visitor plays. It runs like a story (segments,
 * tap left or right, pause), with a game HUD: the power reserve and the tide. The third beat waits
 * for a move made by tapping a light in the world; the move lands with a burst, the stats it cost,
 * and an ending to collect. Beside it, the four beats say how Realms plays.
 */

const beats: ArchiveBeat[] = ["arrive", "signal", "choose", "outcome"];
const BEAT_MS: Record<ArchiveBeat, number> = { arrive: 6500, signal: 6500, choose: 0, outcome: 0 };

const story: Record<Exclude<ArchiveBeat, "outcome">, { kicker: string; title: string; body: string }> = {
  arrive: { kicker: "Arrive", title: "You wash up at the archive.", body: "Night. A low moon. A building half in the sea, and something on its roof still blinking." },
  signal: { kicker: "Listen", title: "Something is still calling.", body: "The relay pulses once, then goes quiet. Inside, a radio is trying to reach the shore." },
  choose: { kicker: "Your move", title: "One reserve. Three ways in.", body: "Tap a light in the world. The reserve can power only one of them." },
};

type Stat = { label: string; good: boolean };
const outcomes: Record<ArchiveChoice, { move: string; title: string; body: string; reserve: number; tide: number; stats: Stat[] }> = {
  relay: { move: "Wake the relay", title: "A voice answers.", body: "Someone on the far shore heard you. Behind you, the tide takes the crossing.", reserve: 0, tide: 88, stats: [{ label: "Ally found", good: true }, { label: "Reserve −3", good: false }, { label: "Crossing lost", good: false }] },
  crossing: { move: "Raise the crossing", title: "The way back holds.", body: "The crossing rises clear of the water. Inside the archive, the signal goes dark.", reserve: 1, tide: 58, stats: [{ label: "Way home", good: true }, { label: "Reserve −2", good: false }, { label: "Signal lost", good: false }] },
  channel: { move: "Follow the lower channel", title: "You keep the reserve.", body: "A line of stones leads to a service passage below the waterline. The tide keeps rising.", reserve: 3, tide: 74, stats: [{ label: "Secret passage", good: true }, { label: "Reserve kept", good: true }, { label: "Tide rising", good: false }] },
};
const TIDE: Record<Exclude<ArchiveBeat, "outcome">, number> = { arrive: 28, signal: 34, choose: 42 };

const mechanics = [
  { beat: "arrive", icon: MoonStar, label: "Arrive", title: "Open on a scene, not a menu.", body: "Every world drops you in the middle of something: a place, a moment, and very little explanation." },
  { beat: "signal", icon: RadioTower, label: "Listen", title: "Clues come from the world.", body: "No tutorial pop-ups. A light blinks, a radio hisses, the tide moves. Reading them is part of the play." },
  { beat: "choose", icon: Split, label: "Decide", title: "Make your move inside it.", body: "You don't pick from a form. You wake a relay, raise a crossing, or take the long way round." },
  { beat: "outcome", icon: Waves, label: "Live with it", title: "The world remembers.", body: "Every move costs something. The next scene starts from what you did, not from a reset." },
] as const;

/** Hotspot positions as percentages of the 9:16 reel, which shows canvas x 318.75-881.25. */
const spot = (choice: ArchiveChoice) => ({
  x: `${((ARCHIVE_POINTS[choice].x - 318.75) / 562.5) * 100}%`,
  y: `${(ARCHIVE_POINTS[choice].y / 1000) * 100}%`,
});

export default function CasualReel() {
  const { endings, findEnding } = useCasualGame();
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

  useEffect(() => {
    if (beat !== "outcome" || !choice) return;
    const timer = window.setTimeout(() => findEnding(choice), 1400);
    return () => window.clearTimeout(timer);
  }, [beat, choice, findEnding]);

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

  const result = beat === "outcome" && choice ? outcomes[choice] : null;
  const caption = result ? { kicker: result.move, title: result.title, body: result.body } : story[beat === "outcome" ? "choose" : beat];
  const reserve = result ? result.reserve : 3;
  const tide = result ? result.tide : TIDE[beat === "outcome" ? "choose" : beat];
  const active = mechanics[index];

  return <section id="casual-signal" className="casual-reel-section" aria-labelledby="casual-reel-heading">
    <div className="product-container casual-reel-layout">
      <div className="casual-reel-intro">
        <p className="casual-eyebrow">Level 01 / The Tidal Archive</p>
        <h2 id="casual-reel-heading">Feels like a reel. <span>Plays like a game.</span></h2>
        <p>Tap through the opening. When it's your move, make it in the world itself. Three endings. Can you find them all?</p>
      </div>

      <div ref={player} className="casual-reel" data-beat={beat} data-choice={choice ?? "none"} data-playing={playing}>
        <span className="casual-sticker casual-reel-sticker" data-tone="yellow" aria-hidden="true">Tap to play</span>
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
              <p><strong>The Tidal Archive</strong><span>Level 01 · Survival</span></p>
              {BEAT_MS[beat] > 0 && <button type="button" className="casual-reel-icon" onClick={() => setPaused(p => !p)} aria-label={paused ? "Play the opening" : "Pause the opening"}>{paused ? <Play size={16} fill="currentColor" aria-hidden="true" /> : <Pause size={16} fill="currentColor" aria-hidden="true" />}</button>}
            </div>
            <div className="casual-reel-hud" role="group" aria-label={`Reserve ${reserve} of 3, tide ${tide} percent`}>
              <span className="casual-reel-hud-reserve" aria-hidden="true"><Zap size={13} fill="currentColor" />{[0, 1, 2].map(i => <i key={i} data-on={i < reserve} style={{ transitionDelay: `${900 + (2 - i) * 180}ms` }} />)}</span>
              <span className="casual-reel-hud-tide" aria-hidden="true"><Waves size={13} /><b><i style={{ width: `${tide}%` }} /></b></span>
            </div>
          </div>

          {index < 2 && <>
            <button type="button" className="casual-reel-tap casual-reel-tap-back" onClick={back} aria-label="Previous scene" />
            <button type="button" className="casual-reel-tap casual-reel-tap-next" onClick={forward} aria-label="Next scene" />
            <CasualSecret id="bottle" className="casual-bottle" label="A bottle floating in the sea">
              <svg viewBox="0 0 40 40" aria-hidden="true"><g transform="rotate(-28 20 20)"><rect x="13" y="12" width="14" height="22" rx="6" fill="#3ee6c8" opacity=".85" /><rect x="17" y="5" width="6" height="9" rx="2" fill="#3ee6c8" /><rect x="16.5" y="3" width="7" height="4" rx="1.5" fill="#c79a4a" /><rect x="16" y="17" width="8" height="11" rx="1.5" fill="#fff6dc" /><path d="M16 15v14" stroke="#ffffff" strokeWidth="1.6" opacity=".7" /></g></svg>
            </CasualSecret>
          </>}

          {beat === "choose" && <div className="casual-reel-choices" role="group" aria-label="Choose your first move">
            {(Object.keys(outcomes) as ArchiveChoice[]).map(key => <button key={key} type="button" className="casual-reel-hotspot" data-choice={key} style={{ left: spot(key).x, top: spot(key).y }} onClick={() => choose(key)}>
              <i aria-hidden="true" /><span>{outcomes[key].move}</span>
            </button>)}
          </div>}

          {result && choice && <>
            <span className="casual-reel-flash" aria-hidden="true" />
            <CasualBurst x={spot(choice).x} y={spot(choice).y} />
            <ul className="casual-reel-stats" aria-label="What it cost">
              {result.stats.map((stat, i) => <li key={stat.label} data-good={stat.good} style={{ animationDelay: `${700 + i * 220}ms` } as CSSProperties}>{stat.label}</li>)}
            </ul>
          </>}

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
          return <li key={m.beat} data-active={i === index} data-step={i}>
            <button type="button" onClick={() => go(m.beat)} aria-current={i === index ? "step" : undefined}>
              <span className="casual-reel-rail-icon"><Icon size={18} strokeWidth={2} aria-hidden="true" /></span>
              <span className="casual-reel-rail-label">{m.label}</span>
            </button>
          </li>;
        })}
      </ol>
      <div className="casual-reel-side">
        <div className="casual-reel-explain" key={active.beat}>
          <h3>{active.title}</h3>
          <p>{active.body}</p>
        </div>
        <div className="casual-endings" data-complete={endings.length === 3}>
          <p className="casual-endings-title"><Trophy size={16} aria-hidden="true" />Endings <b>{endings.length}/3</b></p>
          <ul>
            {(Object.keys(endingNames) as ArchiveChoice[]).map(id => {
              const found = endings.includes(id);
              return <li key={id} data-found={found} data-ending={id}>
                <span className="casual-endings-badge" aria-hidden="true">{found ? id === "relay" ? <RadioTower size={18} /> : id === "crossing" ? <Split size={18} /> : <Waves size={18} /> : <Lock size={16} />}</span>
                <span>{found ? endingNames[id] : "Not found yet"}</span>
              </li>;
            })}
          </ul>
        </div>
      </div>
    </div>
  </section>;
}
