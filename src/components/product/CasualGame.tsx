import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Sparkles, Trophy, KeyRound } from "lucide-react";

/*
 * The light game layer that runs across the Casual path: three secrets hidden around the page,
 * three endings of the Tidal Archive to collect, and toasts when something is found.
 * Progress is kept in this browser only, as a convenience; the page works the same without it.
 */

export type SecretId = "falling-star" | "bottle" | "odd-bulb";
export type EndingId = "relay" | "crossing" | "channel";

export const secretNames: Record<SecretId, { name: string; hint: string }> = {
  "falling-star": { name: "A falling star", hint: "Look up when you arrive somewhere." },
  bottle: { name: "A message in a bottle", hint: "Something floats in the opening, before the choice." },
  "odd-bulb": { name: "The odd bulb", hint: "One light on the machine isn't like the others." },
};

export const endingNames: Record<EndingId, string> = { relay: "The Answer", crossing: "The Way Back", channel: "The Undertow" };

type Toast = { id: number; kind: "secret" | "ending" | "unlock"; title: string; detail: string };
type Progress = { secrets: SecretId[]; endings: EndingId[] };
type GameApi = Progress & { findSecret: (id: SecretId) => void; findEnding: (id: EndingId) => void; unlocked: boolean };

const GameContext = createContext<GameApi>({ secrets: [], endings: [], unlocked: false, findSecret: () => undefined, findEnding: () => undefined });
export const useCasualGame = () => useContext(GameContext);

const STORAGE_KEY = "realms-casual-progress";
const SECRET_IDS = Object.keys(secretNames) as SecretId[];
const ENDING_IDS = Object.keys(endingNames) as EndingId[];

export function CasualGameProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>({ secrets: [], endings: [] });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [visible, setVisible] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Progress> | null;
      if (saved) setProgress({
        secrets: (saved.secrets ?? []).filter((id): id is SecretId => SECRET_IDS.includes(id as SecretId)),
        endings: (saved.endings ?? []).filter((id): id is EndingId => ENDING_IDS.includes(id as EndingId)),
      });
    } catch { /* Progress is optional. */ }
  }, []);


  useEffect(() => {
    const node = area.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "-30% 0px -30% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const toast = useCallback((item: Omit<Toast, "id">) => {
    const id = nextId.current++;
    setToasts(list => [...list.slice(-2), { ...item, id }]);
    window.setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), 3600);
  }, []);

  // Toasts are raised outside the state updater so a strict-mode double call cannot repeat them.
  // Progress is saved only when something is found, so loading can never overwrite it.
  const current = useRef(progress);
  current.current = progress;
  const commit = (next: Progress) => {
    current.current = next;
    setProgress(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Progress is optional. */ }
  };

  const findSecret = useCallback((id: SecretId) => {
    const now = current.current;
    if (now.secrets.includes(id)) return;
    const secrets = [...now.secrets, id];
    commit({ ...now, secrets });
    toast({ kind: "secret", title: "Secret found!", detail: `${secretNames[id].name} · ${secrets.length} of 3` });
    if (secrets.length === SECRET_IDS.length) window.setTimeout(() => toast({ kind: "unlock", title: "Explorer!", detail: "A secret place is now in the World Maker." }), 900);
  }, [toast]);

  const findEnding = useCallback((id: EndingId) => {
    const now = current.current;
    if (now.endings.includes(id)) return;
    const endings = [...now.endings, id];
    commit({ ...now, endings });
    toast({ kind: "ending", title: endings.length === ENDING_IDS.length ? "Every ending found!" : "Ending unlocked", detail: `${endingNames[id]} · ${endings.length} of 3` });
  }, [toast]);

  const unlocked = progress.secrets.length === SECRET_IDS.length;
  const api = useMemo(() => ({ ...progress, unlocked, findSecret, findEnding }), [progress, unlocked, findSecret, findEnding]);

  return <GameContext.Provider value={api}>
    <div ref={area}>{children}</div>
    <div className="casual-toasts" aria-live="polite">
      {toasts.map(t => <div key={t.id} className="casual-toast" data-kind={t.kind}>
        <span className="casual-toast-icon" aria-hidden="true">{t.kind === "secret" ? <Sparkles size={18} /> : t.kind === "ending" ? <Trophy size={18} /> : <KeyRound size={18} />}</span>
        <span><strong>{t.title}</strong><span>{t.detail}</span></span>
      </div>)}
    </div>
    <div className="casual-hud" data-visible={visible} data-complete={unlocked}>
      <button type="button" className="casual-hud-chip" aria-expanded={hintOpen} aria-controls="casual-hud-hints" onClick={() => setHintOpen(open => !open)}>
        <Sparkles size={16} aria-hidden="true" />
        <span><span className="casual-hud-word">Secrets </span><b>{progress.secrets.length}/3</b><span className="sr-only"> found</span></span>
        <span className="casual-hud-dots" aria-hidden="true">{SECRET_IDS.map(id => <i key={id} data-found={progress.secrets.includes(id)} />)}</span>
      </button>
      <div id="casual-hud-hints" className="casual-hud-hints" hidden={!hintOpen}>
        <p>{unlocked ? "All three found. Spin the World Maker to visit the secret place." : "Three things are hidden on this page. Find them to unlock a secret place."}</p>
        <ul>{SECRET_IDS.map(id => <li key={id} data-found={progress.secrets.includes(id)}>{progress.secrets.includes(id) ? secretNames[id].name : secretNames[id].hint}</li>)}</ul>
      </div>
    </div>
  </GameContext.Provider>;
}

/** A hidden collectible. It disappears once found. */
export function CasualSecret({ id, label, className = "", children }: { id: SecretId; label: string; className?: string; children: ReactNode }) {
  const { secrets, findSecret } = useCasualGame();
  if (secrets.includes(id)) return null;
  return <button type="button" className={`casual-secret ${className}`} data-secret={id} aria-label={label} onClick={() => findSecret(id)}>{children}</button>;
}

/** A one-shot burst of confetti, restarted by changing its key. */
export function CasualBurst({ x = "50%", y = "50%", count = 16 }: { x?: string; y?: string; count?: number }) {
  return <span className="casual-burst" style={{ left: x, top: y }} aria-hidden="true">
    {Array.from({ length: count }, (_, i) => <i key={i} style={{ "--a": `${(360 / count) * i + (i % 2) * 9}deg`, "--d": `${46 + (i % 3) * 22}px`, "--c": ["#ffd23f", "#ff6ad5", "#3ee6c8", "#ff7a59", "#b9b3f5"][i % 5] } as CSSProperties} />)}
  </span>;
}
