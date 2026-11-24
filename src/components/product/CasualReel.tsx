import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Check, Footprints, MoonStar, Pause, Play, RadioTower, Send, Split, Waves } from "lucide-react";
import TidalArchiveScene, { type ArchiveBeat, type ArchiveChoice } from "./TidalArchiveScene";
import { PlayableScene } from "./CasualWorldScenes";
import { CasualBurst, CasualSecret, useCasualGame } from "./CasualGame";

/*
 * A feed of playable openings, each built to a content contract in docs/CASUAL-PRODUCT-EXAMPLES.md:
 * a quiet mystery where the place already knows you, a rooftop chase that turns out to be a drone
 * returning your label, and a snowball war where one kid on the other team is building your team a
 * snowman. Every opening runs like a story (segments, tap left or right, pause) and is worth watching
 * without a single tap. At the decision the world keeps moving: the default move's ring fills, and
 * how long it waits is part of the world (the rooftop barely waits). A move lands with what it
 * changed, and the moves you made yourself join your trail. Interface stays white on dark; colour
 * belongs to the worlds.
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
  /** How long the decision waits before the world takes its default. */
  decideMs: number;
  /** The move the world makes when nobody taps, and how the outcome is introduced then. */
  fallback: string;
  fallbackKicker: string;
  choices: Choice[];
};

// One line of situation per beat. The scenes carry the people, the odd detail and its resolution.
const playables: Playable[] = [
  {
    id: "archive", name: "Signal Zero", genre: "Sci-Fi",
    story: {
      arrive: { kicker: "Ep. 01", title: "The space station went dark.", body: "One airlock is opening from the outside." },
      signal: { kicker: "Override", title: "A beacon pings your suit ID.", body: "No crew manifest matches the visitor." },
      choose: { kicker: "Your move", title: "Pressure seals are failing.", body: "The inner blast door lifts." },
    },
    decideMs: 9000,
    fallback: "wave", fallbackKicker: "You held position",
    choices: [
      { key: "wave", move: "Flash your visor light", title: "They recognize your callsign.", body: "The EVA figure lowers their cutter and hands over a black-box drive from your own ship.", trail: "You answered the outside signal.", stats: [{ label: "Drive recovered", good: true }, { label: "Ally aboard", good: true }, { label: "Hull pressure low", good: false }], x: 522, y: 466, side: "right" },
      { key: "read", move: "Trace the station relay", title: "The distress call was yours.", body: "Timestamped 48 hours from now. Someone sent the orbital warning back through the relay.", trail: "You traced the future ping.", stats: [{ label: "Timeline clue", good: true }, { label: "Power rerouted", good: true }, { label: "Airlock breached", good: false }], x: 660, y: 284, side: "left" },
      { key: "descend", move: "Drop to the service deck", title: "The escape pod is already armed.", body: "Warm thrusters, coordinates pre-locked to the planet's dark side. Someone planned your exit.", trail: "You found the hidden pod.", stats: [{ label: "Escape route", good: true }, { label: "Stealth advantage", good: true }, { label: "Left the visitor", good: false }], x: 800, y: 616, side: "left" },
    ],
  },
  {
    id: "rooftop", name: "Midnight Vault", genre: "Heist",
    story: {
      arrive: { kicker: "90s left", title: "The laser grid resets in 12 seconds.", body: "Your crew just locked you inside." },
      signal: { kicker: "Scan", title: "The vault door is cracked open.", body: "Gold light spills across the marble floor." },
      choose: { kicker: "Now", title: "Red beams sweep toward your plinth.", body: "No time to hesitate." },
    },
    decideMs: 3800,
    fallback: "hide", fallbackKicker: "Grid locked",
    choices: [
      { key: "jump", move: "Vault the laser sweep", title: "Clean clearance by inches.", body: "You snag the ledger from the vault pedestal and cut the backup relay before lockdown.", trail: "You cleared the midnight grid.", stats: [{ label: "Vault breached", good: true }, { label: "Zero alarms", good: true }, { label: "Crew betrayed you", good: false }], x: 605, y: 700, side: "right" },
      { key: "zip", move: "Spoof the holo-plinth", title: "You hijacked their exit.", body: "The grid locks your double-crossing crew in the lobby while the skylight hatch opens for you.", trail: "You turned the grid on your crew.", stats: [{ label: "Skylight open", good: true }, { label: "Full payout", good: true }, { label: "High heat", good: false }], x: 601, y: 561, side: "right" },
      { key: "hide", move: "Slip inside the vault", title: "The vault isn't empty.", body: "Another operative is already inside—and offers a 50/50 split if you crack the skylight together.", trail: "You found a rival inside.", stats: [{ label: "Safe from beams", good: true }, { label: "New partner", good: true }, { label: "Split cut", good: false }], x: 366, y: 500, side: "right" },
    ],
  },
  {
    id: "snowball", name: "Crownfall", genre: "Arena",
    story: {
      arrive: { kicker: "Final 4", title: "The bridge collapses behind you.", body: "Only one seat left on the drop-ship." },
      signal: { kicker: "Storm", title: "Two rivals are closing fast.", body: "The VTOL ramp lowers through the rain." },
      choose: { kicker: "Your call", title: "The final span snaps.", body: "Thrusters flare ten meters ahead." },
    },
    decideMs: 8000,
    fallback: "build", fallbackKicker: "Span gave way",
    choices: [
      { key: "charge", move: "Leap for the ramp", title: "Fingertips on hot steel.", body: "You pull yourself aboard as the last pylon drops into the cloud abyss below.", trail: "You claimed the final seat.", stats: [{ label: "Extracted first", good: true }, { label: "Crown secured", good: true }, { label: "Rivals dropped", good: false }], x: 600, y: 712, side: "right" },
      { key: "build", move: "Sever the winch cable", title: "You swung under the hull.", body: "The snapped cable launches you onto the upper wing as lightning splits the storm behind you.", trail: "You rode the storm cable.", stats: [{ label: "Style clutch", good: true }, { label: "Still alive", good: true }, { label: "No cover", good: false }], x: 396, y: 568, side: "right" },
      { key: "truce", move: "Pull your rival up", title: "You both make the jump.", body: "The pilot overrides the seat cap—now you enter Round 2 with a loyal duo against the whole lobby.", trail: "You forged a storm alliance.", stats: [{ label: "Duo unlocked", good: true }, { label: "Both survived", good: true }, { label: "Shared bounty", good: false }], x: 735, y: 500, side: "left" },
    ],
  },
];

/** The first line of each world, which is also what its card in the feed says. */
export const openings = Object.fromEntries(playables.map(p => [p.id, p.story.arrive.title])) as Record<PlayId, string>;

/** Trail entries are versioned with the story, so a returning visitor never sees a line they didn't live. */
const trailId = (world: PlayId, key: string) => `${world}:${key}:2`;

const beats: Beat[] = ["arrive", "signal", "choose", "outcome"];
// Story beats run on their own. The decision waits as long as its world does (Playable.decideMs).
const STORY_MS = 6500;

const mechanics = [
  { beat: "arrive", icon: MoonStar, label: "Arrive" },
  { beat: "signal", icon: RadioTower, label: "Notice" },
  { beat: "choose", icon: Split, label: "Decide" },
  { beat: "outcome", icon: Waves, label: "Live with it" },
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
    const timer = window.setTimeout(() => findEnding(trailId(world.id, choice.key), choice.trail), 1400);
    return () => window.clearTimeout(timer);
  }, [beat, choice, auto, world.id, findEnding]);

  // Under reduced motion nothing moves on by itself, so the decision never times out.
  const timed = (b: Beat) => b === "choose" ? !reduce : b !== "outcome";
  const beatMs = (b: Beat) => b === "choose" ? world.decideMs : STORY_MS;
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
    ? { kicker: auto ? `${world.fallbackKicker} · ${choice.move}` : choice.move, title: choice.title, body: choice.body }
    : world.story[beat === "outcome" ? "choose" : beat];
  const nextWorld = playables[(worldIndex + 1) % playables.length];
  // The trail holds what this browser has lived through in this world, and nothing else.
  const trail = world.choices.filter(c => endings.includes(trailId(world.id, c.key)));

  return <section id="casual-signal" className="casual-reel-section" aria-labelledby="casual-reel-heading">
    <div className="product-container casual-reel-layout">
      <div className="casual-reel-intro">
        <p className="casual-eyebrow">Play an opening</p>
        <h2 id="casual-reel-heading">Feels like a reel. <span>Plays like a game.</span></h2>
        <p>A lamp swinging over the sea. A drone that won't let go. A snowman in the wrong colours.</p>
      </div>

      <div className="casual-reel-column">
        <div ref={player} className="casual-reel" data-world={world.id} data-beat={beat} data-choice={choiceKey ?? "none"} data-playing={playing}>
          <div className="casual-reel-screen" key={world.id}>
            <Scene world={world.id} beat={beat} choice={choiceKey} label={`${world.name}. ${caption.title} ${caption.body}`} />
            <div className="casual-reel-scrim" aria-hidden="true" />

            <div className="casual-reel-top">
              <div className="casual-reel-segments" aria-hidden="true">
                {beats.map((b, i) => <span key={b} data-state={i < index ? "done" : i === index ? "active" : "next"}>
                  <i key={i === index ? round : undefined} style={i === index && timed(b) ? { animationDuration: `${beatMs(b)}ms`, animationPlayState: playing ? "running" : "paused" } : undefined} onAnimationEnd={i === index && timed(b) ? advance : undefined} />
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
                  <i aria-hidden="true">{fallback && timed("choose") && <svg key={round} className="casual-reel-countdown" viewBox="0 0 40 40" style={{ animationDuration: `${world.decideMs}ms`, animationPlayState: playing ? "running" : "paused" }}><circle cx="20" cy="20" r="17" pathLength={1} /></svg>}</i>
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
        {trail.length > 0 && <div className="casual-trail">
          <p className="casual-trail-title"><Footprints size={16} aria-hidden="true" />Your trail in {world.name}</p>
          <ul>{trail.map(c => <li key={c.key}>{c.trail}</li>)}</ul>
          {trail.length < world.choices.length && <p className="casual-trail-more">There's another way this one ends.</p>}
        </div>}
      </div>
    </div>
  </section>;
}
