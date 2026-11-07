import { useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { scrollToWaitlist } from "../../lib/scroll";
import CasualPortal from "./CasualPortal";
import CasualReel from "./CasualReel";
import CasualWorldMaker, { type PlaceId } from "./CasualWorldMaker";
import { CasualGameProvider } from "./CasualGame";

export default function CasualPath({ children }: { children?: ReactNode }) {
  const [shareState, setShareState] = useState<"idle" | "copied" | "manual">("idle");
  const [shareUrl, setShareUrl] = useState("");
  const shareInput = useRef<HTMLInputElement>(null);
  const [makerRequest, setMakerRequest] = useState<{ place: PlaceId; nonce: number }>();

  // Picking a world in the feed deals it on the World Maker.
  const pickWorld = (place: PlaceId) => {
    setMakerRequest(current => ({ place, nonce: (current?.nonce ?? 0) + 1 }));
    document.getElementById("casual-maker")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  };

  async function copyWorldLink() {
    const url = new URL("/realms", window.location.origin);
    url.searchParams.set("entry", "casual");
    url.hash = "casual-signal";
    const link = url.toString();
    setShareUrl(link);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(link);
      setShareState("copied");
    } catch {
      setShareState("manual");
      requestAnimationFrame(() => {
        shareInput.current?.focus();
        shareInput.current?.select();
      });
    }
  }

  return <CasualGameProvider><div className="casual-path">
    <CasualPortal onPick={pickWorld} />
    <CasualReel />
    <CasualWorldMaker request={makerRequest} />

    {/* Static screen illustration is inserted here by the page composition. */}
    {children}

    <div className="product-container casual-invitation">
      <div className="casual-invitation-copy"><h3>Play it with a friend.</h3><p>Send them the same opening. See who finds all three endings first.</p></div>
      <div className="casual-invitation-actions"><button type="button" className="casual-share" onClick={copyWorldLink}>{shareState === "copied" ? <Check size={16} strokeWidth={1.5} aria-hidden="true" /> : <Copy size={16} strokeWidth={1.5} aria-hidden="true" />}{shareState === "copied" ? "Link copied" : "Copy world link"}</button><a className="casual-access" href="#join-waitlist" onClick={scrollToWaitlist}>Request early access <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /></a></div>
      <div className="casual-share-feedback" aria-live="polite">{shareState === "copied" && <p>The world link is ready to share.</p>}{shareState === "manual" && <div><label htmlFor="casual-world-link">Copy this link to share the world</label><input id="casual-world-link" ref={shareInput} type="url" readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} /></div>}</div>
    </div>
  </div></CasualGameProvider>;
}
