import { useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { scrollToWaitlist } from "../../lib/scroll";
import CasualPortal from "./CasualPortal";
import CasualReel from "./CasualReel";
import CasualWorldDeck from "./CasualWorldDeck";

export default function CasualPath({ children }: { children?: ReactNode }) {
  const [shareState, setShareState] = useState<"idle" | "copied" | "manual">("idle");
  const [shareUrl, setShareUrl] = useState("");
  const shareInput = useRef<HTMLInputElement>(null);

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

  return <div className="casual-path">
    <CasualPortal />
    <CasualReel />
    <CasualWorldDeck />

    {/* Static screen illustration is inserted here by the page composition. */}
    {children}

    <div className="product-container casual-invitation">
      <div className="casual-invitation-copy"><h3>Bring another perspective.</h3><p>Send a friend the same signal. Compare the first moves you would make.</p></div>
      <div className="casual-invitation-actions"><button type="button" className="casual-share" onClick={copyWorldLink}>{shareState === "copied" ? <Check size={16} strokeWidth={1.5} aria-hidden="true" /> : <Copy size={16} strokeWidth={1.5} aria-hidden="true" />}{shareState === "copied" ? "Link copied" : "Copy world link"}</button><a className="casual-access" href="#join-waitlist" onClick={scrollToWaitlist}>Request early access <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /></a></div>
      <div className="casual-share-feedback" aria-live="polite">{shareState === "copied" && <p>The world link is ready to share.</p>}{shareState === "manual" && <div><label htmlFor="casual-world-link">Copy this link to share the world</label><input id="casual-world-link" ref={shareInput} type="url" readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} /></div>}</div>
    </div>
  </div>;
}
