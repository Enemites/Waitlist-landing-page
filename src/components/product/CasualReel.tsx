import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Check, Footprints, MoonStar, Pause, Play, RadioTower, Send, Split, Waves } from "lucide-react";
import TidalArchiveScene, { type ArchiveBeat, type ArchiveChoice } from "./TidalArchiveScene";
import { PlayableScene } from "./CasualWorldScenes";
import { CasualBurst, CasualSecret, useCasualGame } from "./CasualGame";

/*
 * A feed of playable openings, each in a different mood: a quiet mystery at sea, a rooftop chase,
 * and a snowball war you play with a team. Every opening runs like a story (segments, tap left or
 * right, pause) and is worth watching without a single tap. The third beat offers a move made by
 * tapping a spot in the world; if nobody taps, the world takes its own default when the bar runs
 * out. A move lands with a flash and what it changed, and the moves you made yourself join your
 * trail. Interface stays white on dark; colour belongs to the worlds.
 */

type Beat = ArchiveBeat;
export type PlayId = "archive" | "rooftop" | "snowball";
type Caption = { kicker: string; title: string; body: string };
type Stat = { label: string; good: boolean };
type Choice = { key: string; move: string; title: string; body: string; trail: string; stats: Stat[]; x: number; y: number; side: "right" | "left" };
type Playable = {
  id: PlayId;
  name: string;
  genre: string;
  story: Record<"arrive" | "signal" | "choose", Caption>;
  /** The move the world makes when nobody taps before the bar runs out. */
  fallback: string;
  choices: Choice[];
};

// One line of situation per beat; the stakes are on screen before the decision is.
const playables: Playable[] = [
  {
    id: "archive", name: "The Tidal Archive", genre: "Mystery",
    story: {
      arrive: { kicker: "Arrive", title: "You wash up at a flooded archive.", body: "Something on its roof is still blinking." },
      signal: { kicker: "Listen", title: "Someone inside is calling the shore.", body: "The relay pulses, then goes quiet. The tide is coming in." },
      choose: { kicker: "Your move", title: "Power for one light. Which one?", body: "Tap a light. Wait, and the tide takes you down the channel." },
    },
    fallback: "channel",
    choices: [
      { key: "relay", move: "Wake the relay", title: "A voice answers.", body: "Someone on the far shore heard you. Behind you, the tide takes the crossing.", trail: "You answered the signal.", stats: [{ label: "Ally found", good: true }, { label: "Power spent", good: false }, { label: "Crossing lost", good: false }], x: 660, y: 284, side: "right" },
      { key: "crossing", move: "Raise the crossing", title: "The way back holds.", body: "The crossing rises clear of the water. Inside the archive, the signal goes dark.", trail: "You kept the way home open.", stats: [{ label: "Way home", good: true }, { label: "Power spent", good: false }, { label: "Signal lost", good: false }], x: 532, y: 546, side: "right" },
      { key: "channel", move: "Follow the lower channel", title: "You keep the power.", body: "A line of stones leads to a service passage below the waterline. The tide keeps rising.", trail: "You found the passage below.", stats: [{ label: "Secret passage", good: true }, { label: "Power kept", good: true }, { label: "Tide rising", good: false }], x: 800, y: 616, side: "left" },
    ],
  },
  {
    id: "rooftop", name: "Rooftop Relay", genre: "Action",
    story: {
      arrive: { kicker: "Arrive", title: "Three roofs to go. The clock is running.", body: "The package is yours to deliver before sunset." },
      signal: { kicker: "Look up", title: "A drone is hunting you.", body: "Its light sweeps the roof. It hasn't seen you yet." },
      choose: { kicker: "Your move", title: "It's coming this way. Move!", body: "Tap a way off. Freeze, and you duck inside." },
    },
    fallback: "hide",
    choices: [
      { key: "jump", move: "Jump the gap", title: "You fly.", body: "You clear the gap with a foot to spare. The drone loses you in the sun.", trail: "You jumped the gap.", stats: [{ label: "Lost the drone", good: true }, { label: "Fastest route", good: true }, { label: "Out of breath", good: false }], x: 605, y: 700, side: "right" },
      { key: "zip", move: "Ride the line", title: "Clean getaway. Literally.", body: "You hook the line and slide across in a storm of shirts. The drone follows the socks.", trail: "You rode the laundry line.", stats: [{ label: "Decoy", good: true }, { label: "Style", good: true }, { label: "Someone's laundry", good: false }], x: 601, y: 561, side: "right" },
      { key: "hide", move: "Duck inside", title: "Gone.", body: "The door clicks shut. The drone circles twice, then gives up. You're going to be late.", trail: "You outwaited the drone.", stats: [{ label: "Unseen", good: true }, { label: "Safe", good: true }, { label: "Late for the drop", good: false }], x: 366, y: 572, side: "right" },
    ],
  },
  {
    id: "snowball", name: "Snowball Siege", genre: "Team battle",
    story: {
      arrive: { kicker: "Arrive", title: "Snow day. Your fort is half built.", body: "You're team red. Blue has more snowballs, and better aim." },
      signal: { kicker: "Heads up", title: "Incoming! Your team looks at you.", body: "One more volley and the wall comes down." },
      choose: { kicker: "Your call", title: "They'll follow your lead.", body: "Tap a plan. No call, and they build the wall." },
    },
    fallback: "build",
    choices: [
      { key: "charge", move: "Charge together", title: "Full send.", body: "The whole team runs out yelling. Half of you get hit. The blue flag is yours.", trail: "You led the charge.", stats: [{ label: "Flag captured", good: true }, { label: "Team spirit", good: true }, { label: "Soaked", good: false }], x: 600, y: 712, side: "right" },
      { key: "build", move: "Build the wall higher", title: "Fortress mode.", body: "You stack blocks while your teammate throws cover. Nothing gets through. Nobody gets anywhere, either.", trail: "You held the fort.", stats: [{ label: "Wall ×2", good: true }, { label: "Everyone safe", good: true }, { label: "Stalemate", good: false }], x: 396, y: 628, side: "right" },
      { key: "truce", move: "Call a truce", title: "Everybody wins.", body: "Both teams meet in the middle and build the biggest snowman this hill has ever seen.", trail: "You made peace on the hill.", stats: [{ label: "New friends", good: true }, { label: "Snowman", good: true }, { label: "No winner", good: false }], x: 822, y: 574, side: "left" },
    ],
  },
];

const beats: Beat[] = ["arrive", "signal", "choose", "outcome"];
// The decision waits a little longer than a story beat, then the world moves on by itself.
const BEAT_MS: Record<Beat, number> = { arrive: 6500, signal: 6500, choose: 8000, outcome: 0 };

const mechanics = [
  { beat: "arrive", icon: MoonStar, label: "Arrive", line: "It starts mid-scene." },
  { beat: "signal", icon: RadioTower, label: "Notice", line: "The world shows you what's at stake." },
  { beat: "choose", icon: Split, label: "Decide", line: "Tap the world, or let it move on." },
  { beat: "outcome", icon: Waves, label: "Live with it", line: "Your move changes what happens." },
] as const;

/** Positions as percentages of the 9:16 reel, which shows canvas x 318.75-881.25. */
const spot = (c: Choice) => ({ x: `${((c.x - 318.75) / 562.5) * 100}%`, y: `${(c.y / 1000) * 100}%` });

function Scene({ world, beat, choice, label }: { world: PlayId; beat: Beat; choice: string | null; label: string }): ReactNode {
  if (world === "archive") return <TidalArchiveScene beat={beat} choice={choice as ArchiveChoice | null} label={label} />;
  return <PlayableScene world={world} beat={beat} choice={choice} label={label} />;
}

export default function CasualReel({ request }: { request?: { world: PlayId; nonce: number } }) {
  const { endings, findEnding } = useCasualGame();
  const [worldIndex, setWorldIndex] = useState(0);
  const [beat, setBeat] = useState<Beat>("arrive");
  const [choiceKey, setChoiceKey] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
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

  // Only moves the player made themselves join the trail; a default the world took is not theirs.
  useEffect(() => {
    if (beat !== "outcome" || !choice || auto) return;
    const timer = window.setTimeout(() => findEnding(`${world.id}:${choice.key}`, choice.trail), 1400);
    return () => window.clearTimeout(timer);
  }, [beat, choice, auto, world.id, findEnding]);

  // Under reduced motion nothing moves on by itself, so the decision never times out.
  const timed = (b: Beat) => BEAT_MS[b] > 0 && !(b === "choose" && reduce);
  const playing = inView && !paused && timed(beat);

  const go = (next: Beat) => {
    if (next === "outcome" && !choiceKey) next = "choose";
    if (next !== "outcome") { setChoiceKey(null); setAuto(false); }
    setBeat(next);
    setRound(r => r + 1);
    setSent("idle");
  };
  const forward = () => { if (index < 2) go(beats[index + 1]); };
  const back = () => {
    if (beat === "outcome") { go("choose"); return; }
    if (index > 0) go(beats[index - 1]); else setRound(r => r + 1);
  };
  const choose = (key: string, byWorld = false) => { setChoiceKey(key); setAuto(byWorld); setBeat("outcome"); setRound(r => r + 1); };
  const advance = () => { if (beat === "choose") choose(world.fallback, true); else forward(); };
  const switchWorld = (next: number) => {
    setWorldIndex((next + playables.length) % playables.length);
    setChoiceKey(null);
    setAuto(false);
    setBeat("arrive");
    setRound(r => r + 1);
    setSent("idle");
    setPaused(reduce);
  };

  // A card in the feed opens its world here.
  useEffect(() => {
    if (!request) return;
    const next = playables.findIndex(p => p.id === request.world);
    if (next >= 0) switchWorld(next);
    // switchWorld only reads state that is current on each request, so it is not a dependency.
  }, [request]);

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

  const caption = choice && beat === "outcome"
    ? { kicker: auto ? `No call · ${choice.move}` : choice.move, title: choice.title, body: choice.body }
    : world.story[beat === "outcome" ? "choose" : beat];
  const active = mechanics[index];
  const nextWorld = playables[(worldIndex + 1) % playables.length];
  // The trail holds what this browser has lived through in this world, and nothing else.
  const trail = world.choices.filter(c => endings.includes(`${world.id}:${c.key}`));

  return <section id="casual-signal" className="casual-reel-section" aria-labelledby="casual-reel-heading">
    <div className="product-container casual-reel-layout">
      <div className="casual-reel-intro">
        <p className="casual-eyebrow">Play an opening</p>
        <h2 id="casual-reel-heading">Feels like a reel. <span>Plays like a game.</span></h2>
        <p>Three worlds, about 30 seconds each. Watch it play out, or tap the world and change how it ends.</p>
      </div>

      <div className="casual-reel-column">
        <div ref={player} className="casual-reel" data-world={world.id} data-beat={beat} data-choice={choiceKey ?? "none"} data-playing={playing}>
          <div className="casual-reel-screen" key={world.id}>
            <Scene world={world.id} beat={beat} choice={choiceKey} label={`${world.name}. ${caption.title} ${caption.body}`} />
            <div className="casual-reel-scrim" aria-hidden="true" />

            <div className="casual-reel-top">
              <div className="casual-reel-segments" aria-hidden="true">
                {beats.map((b, i) => <span key={b} data-state={i < index ? "done" : i === index ? "active" : "next"}>
                  <i key={i === index ? round : undefined} style={i === index && timed(b) ? { animationDuration: `${BEAT_MS[b]}ms`, animationPlayState: playing ? "running" : "paused" } : undefined} onAnimationEnd={i === index && timed(b) ? advance : undefined} />
                </span>)}
              </div>
              <div className="casual-reel-meta">
                <span className="casual-reel-avatar" data-world={world.id} aria-hidden="true" />
                <p><strong>{world.name}</strong><span>{world.genre}</span></p>
                {timed(beat) && <button type="button" className="casual-reel-icon" onClick={() => setPaused(p => !p)} aria-label={paused ? "Play the opening" : "Pause the opening"}>{paused ? <Play size={16} fill="currentColor" aria-hidden="true" /> : <Pause size={16} fill="currentColor" aria-hidden="true" />}</button>}
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
              {world.choices.map(c => {
                const fallback = c.key === world.fallback;
                return <button key={c.key} type="button" className="casual-reel-hotspot" data-side={c.side} data-default={fallback} style={{ left: spot(c).x, top: spot(c).y }} onClick={() => choose(c.key)} aria-label={fallback && timed("choose") ? `${c.move} (happens if you don't choose)` : undefined}>
                  <i aria-hidden="true">{fallback && timed("choose") && <svg key={round} className="casual-reel-countdown" viewBox="0 0 40 40" style={{ animationDuration: `${BEAT_MS.choose}ms`, animationPlayState: playing ? "running" : "paused" }}><circle cx="20" cy="20" r="17" pathLength={1} /></svg>}</i>
                  <span>{c.move}</span>
                </button>;
              })}
            </div>}

            {choice && beat === "outcome" && <>
              <span className="casual-reel-flash" aria-hidden="true" />
              <CasualBurst x={spot(choice).x} y={spot(choice).y} />
              <ul className="casual-reel-stats" aria-label="What changed">
                {choice.stats.map((stat, i) => <li key={stat.label} data-good={stat.good} style={{ animationDelay: `${700 + i * 220}ms` }}>{stat.good ? <ArrowUp size={12} strokeWidth={3} aria-hidden="true" /> : <ArrowDown size={12} strokeWidth={3} aria-hidden="true" />}{stat.label}</li>)}
              </ul>
            </>}

            <div className="casual-reel-caption" aria-live="polite">
              <div key={`${world.id}-${beat}-${choiceKey ?? "none"}`}>
                <p className="casual-reel-kicker">{caption.kicker}</p>
                <p className="casual-reel-title">{caption.title}</p>
                <p className="casual-reel-body">{caption.body}</p>
                {beat === "outcome" && <div className="casual-reel-after">
                  <button type="button" onClick={() => switchWorld(worldIndex + 1)} aria-label={`Next world: ${nextWorld.name}`}>Next world <ArrowRight size={15} aria-hidden="true" /></button>
                  <button type="button" onClick={back}><Split size={15} aria-hidden="true" />Another way</button>
                  <button type="button" onClick={challenge}>{sent === "copied" ? <Check size={15} aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}{sent === "copied" ? "Link copied" : sent === "failed" ? "Copy failed" : "Send to a friend"}</button>
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
        <p className="casual-reel-explain" key={active.beat}>{active.line}</p>
        {trail.length > 0 && <div className="casual-trail">
          <p className="casual-trail-title"><Footprints size={16} aria-hidden="true" />Your trail in {world.name}</p>
          <ul>{trail.map(c => <li key={c.key}>{c.trail}</li>)}</ul>
          {trail.length < world.choices.length && <p className="casual-trail-more">There's another way this one ends.</p>}
        </div>}
      </div>
    </div>
  </section>;
}
