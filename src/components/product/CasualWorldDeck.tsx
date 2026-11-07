import { useEffect, useRef, useState } from "react";
import { Dices } from "lucide-react";
import CasualWorldPoster, { worlds } from "./CasualWorldPoster";

/*
 * More worlds, as a deck: one card open, the rest as slivers you can open. "Drop me somewhere"
 * flicks through the deck like a slot reel and lands on a world you were not looking at.
 */

export default function CasualWorldDeck() {
  const [open, setOpen] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const shuffle = () => {
    if (spinning) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const others = worlds.map((_, i) => i).filter(i => i !== open);
    const target = others[Math.floor(Math.random() * others.length)];
    if (reduce) { setOpen(target); return; }
    // Flick through the deck, slowing down, and land on the target.
    const steps = 5 + ((target - open + worlds.length) % worlds.length);
    let at = open;
    let delay = 0;
    setSpinning(true);
    for (let s = 1; s <= steps; s += 1) {
      delay += 70 + s * s * 9;
      const next = s === steps ? target : (at = (at + 1) % worlds.length);
      timers.current.push(window.setTimeout(() => {
        setOpen(next);
        if (s === steps) setSpinning(false);
      }, delay));
    }
  };

  return <section className="casual-deck" aria-labelledby="casual-deck-heading">
    <div className="product-container">
      <div className="casual-deck-heading">
        <div>
          <p className="casual-portal-eyebrow">More worlds</p>
          <h2 id="casual-deck-heading">Where to <span>next?</span></h2>
        </div>
        <div className="casual-deck-aside">
          <p>Realms imagines its worlds with AI and lets your choices shape them. A few of the places taking shape:</p>
          <button type="button" className="casual-deck-shuffle" onClick={shuffle} disabled={spinning} data-spinning={spinning}>
            <Dices size={18} strokeWidth={1.6} aria-hidden="true" />Drop me somewhere
          </button>
        </div>
      </div>

      <div className="casual-deck-cards" data-spinning={spinning}>
        {worlds.map((world, i) => {
          const isOpen = i === open;
          return <article key={world.id} className="casual-deck-card" data-open={isOpen} data-world={world.id}>
            <CasualWorldPoster world={world.id} />
            <button type="button" className="casual-deck-toggle" onClick={() => setOpen(i)} aria-expanded={isOpen} aria-controls={`casual-deck-${world.id}`}>
              <span className="casual-deck-index">0{i + 1}</span>
              <span className="casual-deck-name">{world.name}</span>
            </button>
            <div id={`casual-deck-${world.id}`} className="casual-deck-detail" hidden={!isOpen}>
              <p className="casual-deck-tag">{world.tag}</p>
              <h3>{world.name}</h3>
              <p className="casual-deck-hook">{world.hook}</p>
              <p className="casual-deck-moves-label">Your first move?</p>
              <ul className="casual-deck-moves">{world.moves.map(move => <li key={move}>{move}</li>)}</ul>
            </div>
          </article>;
        })}
      </div>
      <p className="casual-deck-note">Illustrated world concepts. Realms is in development.</p>
      <p className="sr-only" aria-live="polite">{spinning ? "Finding you a world." : `Now showing ${worlds[open].name}.`}</p>
    </div>
  </section>;
}
