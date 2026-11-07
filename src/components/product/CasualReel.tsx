import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Check, Clock3, Lock, MoonStar, Pause, Play, RadioTower, RotateCcw, Send, Smile, Split, Trophy, Users, Waves, Zap, type LucideIcon } from "lucide-react";
import TidalArchiveScene, { type ArchiveBeat, type ArchiveChoice } from "./TidalArchiveScene";
import { PlayableScene } from "./CasualWorldScenes";
import { CasualBurst, CasualSecret, useCasualGame } from "./CasualGame";

/*
 * A feed of playable openings, each in a different mood: a quiet mystery at sea, a rooftop chase,
 * and a snowball war you play with a team. Every opening runs like a story (segments, tap left or
 * right, pause) with a small HUD. The third beat waits for a move made by tapping a spot in the
 * world; the move lands with a flash, the stats it cost, and an ending to collect, then can be sent
 * to a friend as a challenge. Interface stays white on dark; colour belongs to the worlds.
 */

type Beat = ArchiveBeat;
type PlayId = "archive" | "rooftop" | "snowball";
type Caption = { kicker: string; title: string; body: string };
type Stat = { label: string; good: boolean };
type Choice = { key: string; move: string; title: string; body: string; stats: Stat[]; x: number; y: number; side: "right" | "left"; cells: number; meter: number };
type Playable = {
  id: PlayId;
  name: string;
  genre: string;
  story: Record<"arrive" | "signal" | "choose", Caption>;
  cells: { label: string; icon: LucideIcon };
  meter: { label: string; icon: LucideIcon; arrive: number; signal: number; choose: number };
  choices: Choice[];
};

const playables: Playable[] = [
  {
    id: "archive", name: "The Tidal Archive", genre: "Mystery",
    story: {
      arrive: { kicker: "Arrive", title: "You wash up at the archive.", body: "Night. A low moon. A building half in the sea, and something on its roof still blinking." },
      signal: { kicker: "Listen", title: "Something is still calling.", body: "The relay pulses once, then goes quiet. Inside, a radio is trying to reach the shore." },
      choose: { kicker: "Your move", title: "One reserve. Three ways in.", body: "Tap a light in the world. The reserve can power only one of them." },
    },
    cells: { label: "Reserve", icon: Zap },
    meter: { label: "Tide", icon: Waves, arrive: 28, signal: 34, choose: 42 },
    choices: [
      { key: "relay", move: "Wake the relay", title: "A voice answers.", body: "Someone on the far shore heard you. Behind you, the tide takes the crossing.", stats: [{ label: "Ally found", good: true }, { label: "Reserve −3", good: false }, { label: "Crossing lost", good: false }], x: 660, y: 284, side: "right", cells: 0, meter: 88 },
      { key: "crossing", move: "Raise the crossing", title: "The way back holds.", body: "The crossing rises clear of the water. Inside the archive, the signal goes dark.", stats: [{ label: "Way home", good: true }, { label: "Reserve −2", good: false }, { label: "Signal lost", good: false }], x: 532, y: 546, side: "right", cells: 1, meter: 58 },
      { key: "channel", move: "Follow the lower channel", title: "You keep the reserve.", body: "A line of stones leads to a service passage below the waterline. The tide keeps rising.", stats: [{ label: "Secret passage", good: true }, { label: "Reserve kept", good: true }, { label: "Tide rising", good: false }], x: 800, y: 616, side: "left", cells: 3, meter: 74 },
    ],
  },
  {
    id: "rooftop", name: "Rooftop Relay", genre: "Action",
    story: {
      arrive: { kicker: "Arrive", title: "You're on the roof with the package.", body: "Late afternoon. Three blocks to the drop, and the clock is already running." },
      signal: { kicker: "Look up", title: "Someone's tracking you.", body: "A drone rises over the water tanks. Its light sweeps the roof, looking for you." },
      choose: { kicker: "Your move", title: "One roof. Three ways off.", body: "Tap a way out. Quick." },
    },
    cells: { label: "Stamina", icon: Zap },
    meter: { label: "Clock", icon: Clock3, arrive: 20, signal: 34, choose: 46 },
    choices: [
      { key: "jump", move: "Jump the gap", title: "You fly.", body: "You clear the gap with a foot to spare. The drone loses you in the sun.", stats: [{ label: "Lost the drone", good: true }, { label: "Fastest route", good: true }, { label: "Stamina −2", good: false }], x: 605, y: 700, side: "right", cells: 1, meter: 56 },
      { key: "zip", move: "Ride the line", title: "Clean getaway. Literally.", body: "You hook the line and slide across in a storm of shirts. The drone follows the socks.", stats: [{ label: "Decoy", good: true }, { label: "Style", good: true }, { label: "Someone's laundry", good: false }], x: 601, y: 561, side: "right", cells: 2, meter: 62 },
      { key: "hide", move: "Duck inside", title: "Gone.", body: "The door clicks shut. The drone circles twice, then gives up. You're going to be late.", stats: [{ label: "Unseen", good: true }, { label: "Stamina kept", good: true }, { label: "Late for the drop", good: false }], x: 366, y: 572, side: "right", cells: 3, meter: 92 },
    ],
  },
  {
    id: "snowball", name: "Snowball Siege", genre: "Team battle",
    story: {
      arrive: { kicker: "Arrive", title: "Snow day. You're team red.", body: "Your team holds the left fort. The other side has more snowballs, and better aim." },
      signal: { kicker: "Heads up", title: "Incoming!", body: "A volley arcs over the field. Your teammate looks at you: what's the plan?" },
      choose: { kicker: "Your call", title: "Your team waits on you.", body: "Tap a plan. Everyone goes with it." },
    },
    cells: { label: "Team", icon: Users },
    meter: { label: "Fun", icon: Smile, arrive: 40, signal: 55, choose: 60 },
    choices: [
      { key: "charge", move: "Charge together", title: "Full send.", body: "The whole team runs out yelling. Half of you get hit. The blue flag is yours.", stats: [{ label: "Flag captured", good: true }, { label: "Team spirit", good: true }, { label: "Soaked", good: false }], x: 600, y: 712, side: "right", cells: 2, meter: 90 },
      { key: "build", move: "Build the wall higher", title: "Fortress mode.", body: "You stack blocks while your teammate throws cover. Nothing gets through. Nobody gets anywhere, either.", stats: [{ label: "Wall ×2", good: true }, { label: "Everyone safe", good: true }, { label: "Stalemate", good: false }], x: 396, y: 628, side: "right", cells: 3, meter: 52 },
      { key: "truce", move: "Call a truce", title: "Everybody wins.", body: "Both teams meet in the middle and build the biggest snowman this hill has ever seen.", stats: [{ label: "New friends", good: true }, { label: "Snowman", good: true }, { label: "No winner", good: false }], x: 822, y: 574, side: "left", cells: 3, meter: 100 },
    ],
  },
];

const beats: Beat[] = ["arrive", "signal", "choose", "outcome"];
const BEAT_MS: Record<Beat, number> = { arrive: 6500, signal: 6500, choose: 0, outcome: 0 };

const mechanics = [
  { beat: "arrive", icon: MoonStar, label: "Arrive", title: "Open on a scene, not a menu.", body: "Every world drops you in the middle of something: a place, a moment, and very little explanation." },
  { beat: "signal", icon: RadioTower, label: "Notice", title: "Clues come from the world.", body: "No tutorial pop-ups. A light blinks, a drone rises, a snowball flies. Reading them is part of the play." },
  { beat: "choose", icon: Split, label: "Decide", title: "Make your move inside it.", body: "You don't pick from a form. You tap the place in the world where you want to act." },
  { beat: "outcome", icon: Waves, label: "Live with it", title: "The world remembers.", body: "Every move costs something. The next scene starts from what you did. Then see what your friends would do." },
] as const;

/** Positions as percentages of the 9:16 reel, which shows canvas x 318.75-881.25. */
const spot = (c: Choice) => ({ x: `${((c.x - 318.75) / 562.5) * 100}%`, y: `${(c.y / 1000) * 100}%` });

function Scene({ world, beat, choice, label }: { world: PlayId; beat: Beat; choice: string | null; label: string }): ReactNode {
  if (world === "archive") return <TidalArchiveScene beat={beat} choice={choice as ArchiveChoice | null} label={label} />;
  return <PlayableScene world={world} beat={beat} choice={choice} label={label} />;
}

export default function CasualReel() {
  const { endings, findEnding } = useCasualGame();
  const [worldIndex, setWorldIndex] = useState(0);
  const [beat, setBeat] = useState<Beat>("arrive");
  const [choiceKey, setChoiceKey] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [round, setRound] = useState(0);
  const [sent, setSent] = useState<"idle" | "copied" | "failed">("idle");
  const player = useRef<HTMLDivElement>(null);
  const world = playables[worldIndex];
  const index = beats.indexOf(beat);
  const choice = world.choices.find(c => c.key === choiceKey) ?? null;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { setReduce(motion.matches); if (motion.matches) setPaused(true); };
    sync();
    motion.addEventListener("change", sync);
    // A challenge link opens the world it was sent from.
    const requested = playables.findIndex(p => p.id === new URLSearchParams(window.location.search).get("play"));
    if (requested > 0) setWorldIndex(requested);
    const node = player.current;
    const observer = node ? new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .55 }) : null;
    if (node && observer) observer.observe(node);
    return () => { motion.removeEventListener("change", sync); observer?.disconnect(); };
  }, []);

  useEffect(() => {
    if (beat !== "outcome" || !choice) return;
    const timer = window.setTimeout(() => findEnding(`${world.id}:${choice.key}`, choice.title), 1400);
    return () => window.clearTimeout(timer);
  }, [beat, choice, world.id, findEnding]);

  const playing = inView && !paused && BEAT_MS[beat] > 0;

  const go = (next: Beat) => {
    if (next === "outcome" && !choiceKey) next = "choose";
    if (next !== "outcome") setChoiceKey(null);
    setBeat(next);
    setRound(r => r + 1);
    setSent("idle");
  };
  const forward = () => { if (index < 2) go(beats[index + 1]); };
  const back = () => {
    if (beat === "outcome") { go("choose"); return; }
    if (index > 0) go(beats[index - 1]); else setRound(r => r + 1);
  };
  const choose = (key: string) => { setChoiceKey(key); setBeat("outcome"); setRound(r => r + 1); };
  const restart = () => { go("arrive"); setPaused(reduce); };
  const switchWorld = (next: number) => {
    setWorldIndex((next + playables.length) % playables.length);
    setChoiceKey(null);
    setBeat("arrive");
    setRound(r => r + 1);
    setSent("idle");
  };

  async function challenge() {
    const url = new URL("/realms", window.location.origin);
    url.searchParams.set("entry", "casual");
    url.searchParams.set("play", world.id);
    url.hash = "casual-signal";
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url.toString());
      setSent("copied");
    } catch {
      setSent("failed");
    }
  }

  const caption = choice && beat === "outcome" ? { kicker: choice.move, title: choice.title, body: choice.body } : world.story[beat === "outcome" ? "choose" : beat];
  const cells = choice && beat === "outcome" ? choice.cells : 3;
  const meter = choice && beat === "outcome" ? choice.meter : world.meter[beat === "outcome" ? "choose" : beat];
  const CellIcon = world.cells.icon;
  const MeterIcon = world.meter.icon;
  const active = mechanics[index];
  const found = world.choices.filter(c => endings.includes(`${world.id}:${c.key}`));

  return <section id="casual-signal" className="casual-reel-section" aria-labelledby="casual-reel-heading">
    <div className="product-container casual-reel-layout">
      <div className="casual-reel-intro">
        <p className="casual-eyebrow">Play an opening</p>
        <h2 id="casual-reel-heading">Feels like a reel. <span>Plays like a game.</span></h2>
        <p>Three worlds, three moods. Make your move in the world itself, collect the endings, then dare a friend to find another.</p>
      </div>

      <div className="casual-reel-column">
        <div ref={player} className="casual-reel" data-world={world.id} data-beat={beat} data-choice={choiceKey ?? "none"} data-playing={playing}>
          <div className="casual-reel-screen" key={world.id}>
            <Scene world={world.id} beat={beat} choice={choiceKey} label={`${world.name}. ${caption.title} ${caption.body}`} />
            <div className="casual-reel-scrim" aria-hidden="true" />

            <div className="casual-reel-top">
              <div className="casual-reel-segments" aria-hidden="true">
                {beats.map((b, i) => <span key={b} data-state={i < index ? "done" : i === index ? "active" : "next"}>
                  <i key={i === index ? round : undefined} style={i === index && BEAT_MS[b] ? { animationDuration: `${BEAT_MS[b]}ms`, animationPlayState: playing ? "running" : "paused" } : undefined} onAnimationEnd={i === index ? forward : undefined} />
                </span>)}
              </div>
              <div className="casual-reel-meta">
                <span className="casual-reel-avatar" data-world={world.id} aria-hidden="true" />
                <p><strong>{world.name}</strong><span>{world.genre}</span></p>
                {BEAT_MS[beat] > 0 && <button type="button" className="casual-reel-icon" onClick={() => setPaused(p => !p)} aria-label={paused ? "Play the opening" : "Pause the opening"}>{paused ? <Play size={16} fill="currentColor" aria-hidden="true" /> : <Pause size={16} fill="currentColor" aria-hidden="true" />}</button>}
              </div>
              <div className="casual-reel-hud" role="group" aria-label={`${world.cells.label} ${cells} of 3, ${world.meter.label} ${meter} percent`}>
                <span className="casual-reel-hud-cells" aria-hidden="true"><CellIcon size={13} />{[0, 1, 2].map(i => <i key={i} data-on={i < cells} style={{ transitionDelay: `${900 + (2 - i) * 180}ms` }} />)}</span>
                <span className="casual-reel-hud-meter" aria-hidden="true"><MeterIcon size={13} /><b><i style={{ width: `${meter}%` }} /></b></span>
              </div>
            </div>

            {index < 2 && <>
              <button type="button" className="casual-reel-tap casual-reel-tap-back" onClick={back} aria-label="Previous scene" />
              <button type="button" className="casual-reel-tap casual-reel-tap-next" onClick={forward} aria-label="Next scene" />
              {world.id === "archive" && <CasualSecret id="bottle" className="casual-bottle" label="A bottle floating in the sea">
                <svg viewBox="0 0 40 40" aria-hidden="true"><g transform="rotate(-28 20 20)"><rect x="13" y="12" width="14" height="22" rx="6" fill="#bfeee0" opacity=".9" /><rect x="17" y="5" width="6" height="9" rx="2" fill="#bfeee0" /><rect x="16.5" y="3" width="7" height="4" rx="1.5" fill="#c79a4a" /><rect x="16" y="17" width="8" height="11" rx="1.5" fill="#fff6dc" /></g></svg>
              </CasualSecret>}
            </>}

            {beat === "choose" && <div className="casual-reel-choices" role="group" aria-label="Choose your move">
              {world.choices.map(c => <button key={c.key} type="button" className="casual-reel-hotspot" data-side={c.side} style={{ left: spot(c).x, top: spot(c).y }} onClick={() => choose(c.key)}>
                <i aria-hidden="true" /><span>{c.move}</span>
              </button>)}
            </div>}

            {choice && beat === "outcome" && <>
              <span className="casual-reel-flash" aria-hidden="true" />
              <CasualBurst x={spot(choice).x} y={spot(choice).y} />
              <ul className="casual-reel-stats" aria-label="What it cost">
                {choice.stats.map((stat, i) => <li key={stat.label} data-good={stat.good} style={{ animationDelay: `${700 + i * 220}ms` }}>{stat.good ? <ArrowUp size={12} strokeWidth={3} aria-hidden="true" /> : <ArrowDown size={12} strokeWidth={3} aria-hidden="true" />}{stat.label}</li>)}
              </ul>
            </>}

            <div className="casual-reel-caption" aria-live="polite">
              <div key={`${world.id}-${beat}-${choiceKey ?? "none"}`}>
                <p className="casual-reel-kicker">{caption.kicker}</p>
                <p className="casual-reel-title">{caption.title}</p>
                <p className="casual-reel-body">{caption.body}</p>
                {beat === "outcome" && <div className="casual-reel-after">
                  <button type="button" onClick={back}><Split size={15} aria-hidden="true" />Try another way</button>
                  <button type="button" onClick={challenge}>{sent === "copied" ? <Check size={15} aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}{sent === "copied" ? "Link copied" : sent === "failed" ? "Copy failed" : "Challenge a friend"}</button>
                  <button type="button" className="casual-reel-restart" onClick={restart} aria-label="Start over"><RotateCcw size={15} aria-hidden="true" /></button>
                </div>}
                {reduce && index < 2 && <button type="button" className="casual-reel-continue" onClick={forward}>Continue</button>}
              </div>
            </div>
          </div>
        </div>

        <div className="casual-reel-switch" role="group" aria-label="Choose a world to play">
          {playables.map((p, i) => <button key={p.id} type="button" aria-pressed={i === worldIndex} onClick={() => switchWorld(i)}>
            <span>{p.name}</span><small>{p.genre}</small>
          </button>)}
        </div>
      </div>

      <ol className="casual-reel-rail" aria-label="How a Realms world plays">
        {mechanics.map((m, i) => {
          const Icon = m.icon;
          return <li key={m.beat} data-active={i === index}>
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
        <div className="casual-endings">
          <p className="casual-endings-title"><Trophy size={16} aria-hidden="true" />Endings in {world.name} <b>{found.length}/3</b></p>
          <ul>
            {world.choices.map(c => {
              const has = endings.includes(`${world.id}:${c.key}`);
              return <li key={c.key} data-found={has}>
                <span className="casual-endings-badge" aria-hidden="true">{has ? <Check size={16} strokeWidth={3} /> : <Lock size={14} />}</span>
                <span>{has ? c.title : "Not found yet"}</span>
              </li>;
            })}
          </ul>
          <p className="casual-endings-total">{endings.length} of 9 endings found across all three worlds</p>
        </div>
      </div>
    </div>
  </section>;
}
