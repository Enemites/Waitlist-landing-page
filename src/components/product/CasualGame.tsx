import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Sparkles, Trophy, KeyRound } from "lucide-react";

/*
 * The light game layer that runs across the Casual path: three secrets hidden around the page and
 * the endings of each playable opening to collect, with a toast when something is found. There is
 * no floating counter; the World Maker's locked place is where the hunt shows itself.
 * Progress is kept in this browser only, as a convenience; the page works the same without it.
 */

export type SecretId = "falling-star" | "bottle" | "odd-bulb";

export const secretNames: Record<SecretId, { name: string; hint: string }> = {
  "falling-star": { name: "A falling star", hint: "Look up when you arrive somewhere." },
  bottle: { name: "A message in a bottle", hint: "Something floats in the opening, before the choice." },
  "odd-bulb": { name: "The odd bulb", hint: "One light on the machine isn't like the others." },
};

type Toast = { id: number; kind: "secret" | "ending" | "unlock"; title: string; detail: string };
type Progress = { secrets: SecretId[]; endings: string[] };
type GameApi = Progress & { findSecret: (id: SecretId) => void; findEnding: (id: string, name: string) => void; unlocked: boolean };

const GameContext = createContext<GameApi>({ secrets: [], endings: [], unlocked: false, findSecret: () => undefined, findEnding: () => undefined });
export const useCasualGame = () => useContext(GameContext);

const STORAGE_KEY = "realms-casual-progress";
const SECRET_IDS = Object.keys(secretNames) as SecretId[];

export function CasualGameProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>({ secrets: [], endings: [] });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Progress> | null;
      if (saved) setProgress({
        secrets: (saved.secrets ?? []).filter((id): id is SecretId => SECRET_IDS.includes(id as SecretId)),
        endings: (saved.endings ?? []).filter((id): id is string => typeof id === "string" && id.includes(":")),
      });
    } catch { /* Progress is optional. */ }
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
    toast({ kind: "secret", title: "You found a secret", detail: `${secretNames[id].name} · ${secrets.length} of 3` });
    if (secrets.length === SECRET_IDS.length) window.setTimeout(() => toast({ kind: "unlock", title: "Secret place unlocked", detail: "It's on the World Maker's place reel now." }), 900);
  }, [toast]);

  const findEnding = useCallback((id: string, name: string) => {
    const now = current.current;
    if (now.endings.includes(id)) return;
    const endings = [...now.endings, id];
    commit({ ...now, endings });
    toast({ kind: "ending", title: "New ending", detail: `${name} · ${endings.length} of 9` });
  }, [toast]);

  const unlocked = progress.secrets.length === SECRET_IDS.length;
  const api = useMemo(() => ({ ...progress, unlocked, findSecret, findEnding }), [progress, unlocked, findSecret, findEnding]);

  return <GameContext.Provider value={api}>
    {children}
    <div className="casual-toasts" aria-live="polite">
      {toasts.map(t => <div key={t.id} className="casual-toast" data-kind={t.kind}>
        <span className="casual-toast-icon" aria-hidden="true">{t.kind === "secret" ? <Sparkles size={18} /> : t.kind === "ending" ? <Trophy size={18} /> : <KeyRound size={18} />}</span>
        <span><strong>{t.title}</strong><span>{t.detail}</span></span>
      </div>)}
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
    {Array.from({ length: count }, (_, i) => <i key={i} style={{ "--a": `${(360 / count) * i + (i % 2) * 9}deg`, "--d": `${46 + (i % 3) * 22}px` } as CSSProperties} />)}
  </span>;
}
