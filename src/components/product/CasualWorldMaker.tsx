import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Check, Dices, Link2, Lock, LockOpen, Shuffle, Star } from "lucide-react";
import CasualWorldPoster, { worlds, type WorldId } from "./CasualWorldPoster";
import TidalArchiveScene from "./TidalArchiveScene";
import { CasualBurst, CasualSecret, secretNames, useCasualGame, type SecretId } from "./CasualGame";

/*
 * The World Maker: a slot machine with three reels (a place, a moment, a twist). Each spin deals a
 * world card: the place's art under the moment's weather, the twist as its premise, and three first
 * moves. Hold a reel to keep it. Cards can be sent to a friend, who opens them ready to remix. The
 * secret place appears on the place reel once the three secrets on the page are found.
 */

export type PlaceId = WorldId | "archive" | "upside";

type Place = { id: PlaceId; label: string; name: string; secret?: boolean };
type Moment = { id: string; label: string; phrase: string };
type Twist = { id: string; label: string; line: string; genre: string; moves: [string, string, string] };

const places: Place[] = [
  ...worlds.slice(0, 2).map(w => ({ id: w.id, label: w.short, name: w.name })),
  { id: "archive", label: "Tidal Archive", name: "The Tidal Archive" },
  ...worlds.slice(2).map(w => ({ id: w.id, label: w.short, name: w.name })),
  { id: "upside", label: "Upside-down Archive", name: "The Upside-down Archive", secret: true },
];

const moments: Moment[] = [
  { id: "sunset", label: "Last sunset", phrase: "At the last sunset" },
  { id: "festival", label: "Festival night", phrase: "On festival night" },
  { id: "blackout", label: "Blackout", phrase: "During a blackout" },
  { id: "snow", label: "First snow", phrase: "On the morning of the first snow" },
  { id: "storm", label: "Storm", phrase: "In the middle of a storm" },
  { id: "flood", label: "After the flood", phrase: "The morning after the flood" },
  { id: "fog", label: "Thick fog", phrase: "In fog so thick you can't see your hands" },
];

const twists: Twist[] = [
  { id: "gravity", label: "Gravity flips", line: "Gravity flips every hour, on the hour.", genre: "Puzzle", moves: ["Tie yourself down", "Ride the next flip", "Find who's flipping it"] },
  { id: "rivals", label: "Best friend, other team", line: "Your best friend is on the other team.", genre: "Rivals", moves: ["Make a secret deal", "Play to win", "Switch sides"] },
  { id: "forgotten", label: "Nobody knows you", line: "Everyone here has forgotten your name.", genre: "Mystery", moves: ["Borrow someone's name", "Find who remembers", "Write yours everywhere"] },
  { id: "crew", label: "Everyone joins", line: "Everyone you meet wants to join your crew.", genre: "Party", moves: ["Say yes to all of them", "Hold auditions", "Run for it"] },
  { id: "map", label: "Living map", line: "The map redraws itself every time you blink.", genre: "Explore", moves: ["Try not to blink", "Follow the newest road", "Draw your own map"] },
  { id: "key", label: "Stranger's key", line: "A stranger presses a key into your hand and runs.", genre: "Chase", moves: ["Chase the stranger", "Find the lock", "Hide the key"] },
  { id: "yesterday", label: "Doors to yesterday", line: "Every door here opens onto yesterday.", genre: "Time loop", moves: ["Fix one mistake", "Warn someone", "Stay a little longer"] },
  { id: "strike", label: "Animal strike", line: "The animals have gone on strike.", genre: "Comedy", moves: ["Hear their demands", "Cross the picket line", "Join the strike"] },
];

const REPEAT = 5;
const reelsDef = [{ key: "place", label: "Place", items: places }, { key: "moment", label: "Moment", items: moments }, { key: "twist", label: "Twist", items: twists }] as const;
type Pick = [number, number, number];
type ReelMotion = { pos: number; ms: number };

const rest = (n: number, index: number) => n * 2 + index;
const rarity = (pick: Pick) => {
  if (places[pick[0]].secret) return 3;
  const roll = (pick[0] * 7 + pick[1] * 13 + pick[2] * 31) % 10;
  return roll === 9 ? 3 : roll >= 5 ? 2 : 1;
};
const rarityName = ["", "Common", "Rare", "Legendary"];

function WorldArt({ place }: { place: PlaceId }) {
  if (place === "archive") return <TidalArchiveScene beat="arrive" />;
  if (place === "upside") return <div className="casual-card-upside"><TidalArchiveScene beat="arrive" /></div>;
  return <CasualWorldPoster world={place} />;
}

export default function CasualWorldMaker({ request }: { request?: { place: PlaceId; nonce: number } }) {
  const { unlocked, secrets } = useCasualGame();
  const [fromFriend, setFromFriend] = useState(false);
  const [pick, setPick] = useState<Pick>([0, 2, 0]);
  const [held, setHeld] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [motion, setMotion] = useState<ReelMotion[]>(() => reelsDef.map((r, i) => ({ pos: rest(r.items.length, [0, 2, 0][i]), ms: 0 })));
  const [spinning, setSpinning] = useState(false);
  const [deal, setDeal] = useState(0);
  const [made, setMade] = useState(0);
  const [copied, setCopied] = useState<"idle" | "copied" | "manual">("idle");
  const [manualUrl, setManualUrl] = useState("");
  const timers = useRef<number[]>([]);
  const card = useRef<HTMLElement>(null);

  const available = (reel: number) => reelsDef[reel].items.map((_, i) => i).filter(i => reel !== 0 || !places[i].secret || unlocked);

  const settle = (next: Pick) => {
    setMotion(reelsDef.map((r, i) => ({ pos: rest(r.items.length, next[i]), ms: 0 })));
    setPick(next);
  };

  // A shared world arrives in the URL as ?world=place.moment.twist.
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("world");
    if (!value) return;
    const [p, m, t] = value.split(".");
    const next: Pick = [places.findIndex(x => x.id === p), moments.findIndex(x => x.id === m), twists.findIndex(x => x.id === t)];
    if (next.every(i => i >= 0)) { settle(next); setDeal(d => d + 1); setFromFriend(true); }
    return () => timers.current.forEach(window.clearTimeout);
  }, []);

  const spin = (hold = held, base = pick) => {
    if (spinning) return;
    const spinReels = hold.map(h => !h);
    if (!spinReels.some(Boolean)) return;
    const next = base.map((current, reel) => {
      if (!spinReels[reel]) return current;
      const options = available(reel).filter(i => i !== current);
      return options[Math.floor(Math.random() * options.length)];
    }) as Pick;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setCopied("idle");
    setMade(count => count + 1);
    if (reduce) { settle(next); setDeal(d => d + 1); return; }
    setSpinning(true);
    // Jump each spinning reel back one copy without animation, then roll it forward several copies.
    setMotion(reelsDef.map((r, i) => ({ pos: spinReels[i] ? r.items.length + base[i] : rest(r.items.length, base[i]), ms: 0 })));
    let longest = 0;
    timers.current.push(window.setTimeout(() => {
      setMotion(reelsDef.map((r, i) => {
        if (!spinReels[i]) return { pos: rest(r.items.length, base[i]), ms: 0 };
        const ms = 900 + i * 380;
        longest = Math.max(longest, ms);
        return { pos: r.items.length * (REPEAT - 1) + next[i], ms };
      }));
      timers.current.push(window.setTimeout(() => {
        settle(next);
        setSpinning(false);
        setDeal(d => d + 1);
      }, longest + 120));
    }, 40));
  };

  // A world picked from the feed above: put it on the place reel, hold it, and spin the rest.
  useEffect(() => {
    if (!request) return;
    const index = places.findIndex(p => p.id === request.place);
    if (index < 0) return;
    const base: Pick = [index, pick[1], pick[2]];
    const hold: [boolean, boolean, boolean] = [true, false, false];
    settle(base);
    setHeld(hold);
    timers.current.push(window.setTimeout(() => spin(hold, base), 700));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.nonce]);

  // Remixing a friend's world keeps their place and moment and spins a new twist.
  const remix = () => {
    const hold: [boolean, boolean, boolean] = [true, true, false];
    setHeld(hold);
    setFromFriend(false);
    spin(hold);
  };

  const toggleHold = (reel: number) => setHeld(current => current.map((h, i) => i === reel ? !h : h) as [boolean, boolean, boolean]);

  const place = places[pick[0]];
  const moment = moments[pick[1]];
  const twist = twists[pick[2]];
  const stars = rarity(pick);
  const shine = stars === 3 || unlocked;

  async function copyLink() {
    const url = new URL("/realms", window.location.origin);
    url.searchParams.set("entry", "casual");
    url.searchParams.set("world", `${place.id}.${moment.id}.${twist.id}`);
    url.hash = "casual-maker";
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url.toString());
      setCopied("copied");
    } catch {
      setManualUrl(url.toString());
      setCopied("manual");
    }
  }

  const tilt = (event: ReactPointerEvent<HTMLElement>) => {
    const node = card.current;
    if (!node || event.pointerType !== "mouse") return;
    const r = node.getBoundingClientRect();
    const x = (event.clientX - r.left) / r.width;
    const y = (event.clientY - r.top) / r.height;
    node.style.setProperty("--rx", `${((0.5 - y) * 14).toFixed(2)}deg`);
    node.style.setProperty("--ry", `${((x - 0.5) * 16).toFixed(2)}deg`);
    node.style.setProperty("--px", `${(x * 100).toFixed(1)}%`);
    node.style.setProperty("--py", `${(y * 100).toFixed(1)}%`);
  };
  const untilt = () => { card.current?.style.setProperty("--rx", "0deg"); card.current?.style.setProperty("--ry", "0deg"); };

  return <section id="casual-maker" className="casual-maker" aria-labelledby="casual-maker-heading">
    <div className="product-container">
      <div className="casual-maker-heading">
        <p className="casual-eyebrow">World Maker</p>
        <h2 id="casual-maker-heading">Spin up <span>a world.</span></h2>
        <p>Pick a place, a moment and a twist, or let the machine choose. Send it to a friend and see what they make of it. In Realms, our AI world model imagines everything else around it.</p>
      </div>

      <div className="casual-maker-layout">
        <div className="casual-machine" data-spinning={spinning}>
          <div className="casual-machine-marquee">
            <span className="casual-machine-bulbs" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} />)}</span>
            <strong>World Maker</strong>
            <span className="casual-machine-bulbs" aria-hidden="true">{Array.from({ length: 4 }, (_, i) => <i key={i} />)}</span>
            <CasualSecret id="odd-bulb" className="casual-odd-bulb" label="An odd bulb on the machine"><i /></CasualSecret>
            <span className="casual-machine-bulbs" aria-hidden="true">{Array.from({ length: 2 }, (_, i) => <i key={i} />)}</span>
          </div>

          <div className="casual-machine-reels">
            {reelsDef.map((reel, r) => {
              const items = reel.items as readonly (Place | Moment | Twist)[];
              return <div key={reel.key} className="casual-slot" data-held={held[r]}>
                <p className="casual-slot-label">{reel.label}</p>
                <div className="casual-slot-window" aria-hidden="true">
                  <div className="casual-slot-strip" style={{ transform: `translateY(calc(${1 - motion[r].pos} * var(--slot-h)))`, transitionDuration: `${motion[r].ms}ms` }}>
                    {Array.from({ length: REPEAT }, (_, copy) => items.map((item, i) => {
                      const locked = r === 0 && (item as Place).secret && !unlocked;
                      return <span key={`${copy}-${i}`} className="casual-slot-item" data-locked={locked}>
                        {locked ? <><Lock size={14} />???</> : item.label}
                      </span>;
                    }))}
                  </div>
                </div>
                <button type="button" className="casual-slot-hold" onClick={() => toggleHold(r)} aria-pressed={held[r]} disabled={spinning}>
                  {held[r] ? <Lock size={14} aria-hidden="true" /> : <LockOpen size={14} aria-hidden="true" />}{held[r] ? "Held" : "Hold"}
                  <span className="sr-only"> {reel.label.toLowerCase()}: {items[pick[r]].label}</span>
                </button>
              </div>;
            })}
          </div>

          <button type="button" className="casual-btn casual-machine-spin" onClick={() => spin()} disabled={spinning || held.every(Boolean)}>
            <Dices size={20} strokeWidth={2.2} aria-hidden="true" />{spinning ? "Spinning…" : made ? "Spin again" : "Spin a world"}
          </button>
          <p className="casual-machine-count">{made ? `Worlds made: ${made}` : "Tip: hold a reel to keep it between spins."}</p>
          {!unlocked && <details className="casual-machine-locked">
            <summary><Lock size={13} aria-hidden="true" />One place is locked. Three secrets are hidden on this page ({secrets.length} found).</summary>
            <ul>{(Object.keys(secretNames) as SecretId[]).map(id => <li key={id} data-found={secrets.includes(id)}>{secrets.includes(id) ? `Found: ${secretNames[id].name}` : secretNames[id].hint}</li>)}</ul>
          </details>}
          <button type="button" className="casual-machine-lever" onClick={() => spin()} tabIndex={-1} aria-hidden="true"><i /></button>
        </div>

        <div className="casual-card-stage">
          {fromFriend && <div className="casual-card-friend">
            <p><strong>A friend sent you this world.</strong> Keep their place and moment, and spin a twist of your own.</p>
            <button type="button" className="casual-btn casual-btn-small" onClick={remix} disabled={spinning}><Shuffle size={16} aria-hidden="true" />Remix it</button>
          </div>}
          <article key={deal} ref={card} className="casual-card" data-shine={shine} data-rarity={stars} onPointerMove={tilt} onPointerLeave={untilt}>
            <div className="casual-card-inner">
              <div className="casual-card-art" data-moment={moment.id}>
                <WorldArt place={place.id} />
                <span className="casual-card-fx" aria-hidden="true">{(moment.id === "festival" || moment.id === "snow") && Array.from({ length: 14 }, (_, i) => <i key={i} />)}</span>
                <span className="casual-card-genre">{twist.genre}</span>
                <span className="casual-card-stars" aria-label={`${rarityName[stars]} world`}>{Array.from({ length: 3 }, (_, i) => <Star key={i} size={14} fill={i < stars ? "currentColor" : "none"} aria-hidden="true" />)}</span>
              </div>
              <p className="casual-card-moment">{moment.phrase}</p>
              <h3>{place.name}</h3>
              <p className="casual-card-line">{twist.line}</p>
              <p className="casual-card-moves-label">Your first move?</p>
              <ul className="casual-card-moves">{twist.moves.map(move => <li key={move}>{move}</li>)}</ul>
              <div className="casual-card-foot">
                <span className="casual-card-rarity">{rarityName[stars]}</span>
                <button type="button" className="casual-card-share" onClick={copyLink}>{copied === "copied" ? <Check size={15} aria-hidden="true" /> : <Link2 size={15} aria-hidden="true" />}{copied === "copied" ? "Link copied" : "Send to a friend"}</button>
              </div>
            </div>
            <span className="casual-card-foil" aria-hidden="true" />
          </article>
          <p className="sr-only" aria-live="polite">{spinning ? "Spinning." : deal ? `Dealt: ${place.name}. ${moment.phrase}. ${twist.line}` : ""}</p>
          {deal > 0 && stars === 3 && <CasualBurst key={`burst-${deal}`} y="38%" count={22} />}
          {copied === "manual" && <div className="casual-card-manual"><label htmlFor="casual-world-share">Copy this link to share the world</label><input id="casual-world-share" readOnly value={manualUrl} onFocus={e => e.currentTarget.select()} /></div>}
        </div>
      </div>
      <p className="casual-maker-note">A toy version for this page. Places are illustrated concepts; Realms is in development.</p>
    </div>
  </section>;
}
