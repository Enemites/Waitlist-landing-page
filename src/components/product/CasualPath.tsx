import { useId, useRef, useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Check, Copy } from "lucide-react";
import { scrollToWaitlist } from "../../lib/scroll";

function ArchiveScene() {
  const titleId = useId();
  return <svg className="casual-archive-drawing" viewBox="0 0 640 370" role="img" aria-labelledby={titleId}>
    <title id={titleId}>A tidal archive connected to the shore by one crossing, with a relay on its roof and a lower channel below.</title>
    <path d="M55 213 351 73 598 191 303 332Z" fill="#e3ece5" />
    <g fill="none" stroke="#c2d4c8" strokeWidth="2" strokeLinecap="round"><path d="m84 230 39-18m144 104 46-22m187-43 46-22m-306-81 29-14m227 45 38-18" /><path d="m104 253 22-10m240 58 31-14m115-82 23-11" /></g>
    <path d="m37 244 112-53 103 49-112 53Z" fill="#e5e8dc" />
    <path d="m37 244 103 49v17L37 261Z" fill="#d4dccc" />
    <path d="m140 293 112-53v17l-112 53Z" fill="#b9c9b8" />
    <path d="m57 244 91-43 82 39-91 43Z" fill="none" stroke="#f8faf4" strokeWidth="2" />
    <path d="m320 179 130-61 111 53-130 61Z" fill="#dce3d6" />
    <path d="m320 179 111 53v20l-111-53Z" fill="#b7c8b6" />
    <path d="m431 232 130-61v20l-130 61Z" fill="#a3baa6" />
    <path d="m360 88 86-40 80 38-86 41Z" fill="#f0f1e8" />
    <path d="m360 88 80 39v76l-80-39Z" fill="#d3ddce" />
    <path d="m440 127 86-41v77l-86 40Z" fill="#b7cbb8" />
    <path d="m374 85 72-33 65 31-72 34Z" fill="#e1e7da" />
    <path d="m395 142 22 11v37l-22-11Z" fill="#789080" />
    <path d="m401 149 10 5v26l-10-5Z" fill="#c7d3c0" />
    <g stroke="#8aa58c" strokeWidth="4" strokeLinecap="square"><path d="m375 115 0 21m10-16v21m78-7v19m13-25v19m13-25v19m13-25v19" /></g>
    <path d="m447 105 12-6 12 6-12 6Z" fill="#9bb39c" />
    <path d="M459 102V52" stroke="#5f7d68" strokeWidth="3" />
    <circle cx="459" cy="47" r="5" fill="#8aa58c" />
    <path d="m163 264 14 7 188-89-14-7Z" fill="#e8ecdf" />
    <path d="m177 271 188-89v12l-188 89Z" fill="#a5b9a4" />
    <path d="m165 257 188-89m-176 96 188-89" fill="none" stroke="#7b987e" strokeWidth="2" />
    <path d="M226 251v30m59-58v28m58-57v25" stroke="#99b09a" strokeWidth="3" />
    <path d="m106 258 21-10 26 12-21 10Z" fill="#cad6c2" />
    <path d="m106 258 26 12v9l-26-12Zm26 12 21-10v9l-21 10Z" fill="#a7bda7" />
    <path d="m456 230 21-10v20l-21 10Z" fill="#9eb39f" />
  </svg>;
}

/** One reserve branches into three distinct possibilities, without interface framing. */
function ConsequenceDiagram() {
  const titleId = useId();
  return <svg className="casual-consequence-drawing" viewBox="0 0 720 420" role="img" aria-labelledby={titleId}>
    <title id={titleId}>A single power reserve branches toward an answering signal, a raised crossing above water, and footprints leading to a lower passage.</title>
    <g fill="none" stroke="#4c6851" strokeWidth="2" strokeLinecap="round">
      <path d="M228 210h67c65 0 37-116 109-116h63" />
      <path d="M228 210h240" />
      <path d="M228 210h67c65 0 37 116 109 116h63" strokeDasharray="4 8" />
    </g>
    <circle cx="286" cy="210" r="5" fill="#c4ed6c" />
    <path d="m98 184 73-35 73 35-73 35Z" fill="#d0ec9d" />
    <path d="m98 184 73 35v85l-73-35Z" fill="#a9c67d" />
    <path d="m171 219 73-35v85l-73 35Z" fill="#7f9f62" />
    <path d="m116 188 55-26 54 26-54 26Z" fill="none" stroke="#edf9d1" strokeWidth="2" />
    <path d="m146 166 24-12 27 12-24 12Z" fill="#e8f5d3" />
    <path d="m146 166 27 12v12l-27-12Zm27 12 24-12v12l-24 12Z" fill="#c4da9d" />
    <path d="m187 236 35-17v31l-35 17Z" fill="#d8ecae" />
    <path d="m83 301 90 43 90-43" fill="none" stroke="#23382b" strokeWidth="2" />
    <path d="m507 116 38-18 40 19-38 18Z" fill="#a7bd9f" />
    <path d="m507 116 40 19v10l-40-19Zm40 19 38-18v10l-38 18Z" fill="#668668" />
    <path d="M546 111V64" stroke="#d2dfc8" strokeWidth="4" strokeLinecap="round" />
    <circle cx="546" cy="57" r="5" fill="#c4ed6c" />
    <g fill="none" stroke="#b0ce8b" strokeWidth="2.5" strokeLinecap="round"><path d="M532 48q14-14 28 0m-37-11q23-23 46 0" /><path d="m488 153 39 19m4-2 32-15m18 2 34-16" stroke="#3f5b46" /></g>
    <path d="m490 220 17 8 112-53-17-8Z" fill="#d8e5cb" />
    <path d="m507 228 112-53v12l-112 53Z" fill="#7e9e76" />
    <path d="m491 211 111-52m-95 61 111-52" stroke="#9cbb87" fill="none" strokeWidth="2" />
    <path d="M534 226v32m56-58v32" stroke="#8da985" strokeWidth="5" />
    <path d="m483 266 38-18m9 29 43-20m11 3 39-18" stroke="#365442" fill="none" strokeWidth="2" strokeLinecap="round" />
    <path d="M569 353v-33a26 26 0 0 1 52 0v33" stroke="#9db495" strokeWidth="9" fill="none" />
    <path d="M564 356h63" stroke="#6a8b6c" strokeWidth="3" />
    <path d="M483 345c28 19 48 18 73 1" stroke="#698c5e" fill="none" strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" />
    <g fill="#c0d4a9"><ellipse cx="501" cy="344" rx="3" ry="5" transform="rotate(-45 501 344)" /><ellipse cx="513" cy="353" rx="3" ry="5" transform="rotate(-65 513 353)" /><ellipse cx="528" cy="348" rx="3" ry="5" transform="rotate(-75 528 348)" /><ellipse cx="541" cy="352" rx="3" ry="5" transform="rotate(-105 541 352)" /></g>
  </svg>;
}

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
    <section className="casual-entry" aria-labelledby="casual-world-heading">
      <div className="product-container casual-entry-layout">
        <div className="casual-entry-copy"><h2 id="casual-world-heading">A signal.<br />Then, <span>your move.</span></h2><p>A coastal archive. A rising tide. One power reserve. Where would you go first?</p><a className="casual-preview-link" href="#casual-signal">Follow the signal <ArrowDownRight size={18} strokeWidth={1.5} aria-hidden="true" /></a></div>
        <div className="casual-opening-world"><ArchiveScene /></div>
      </div>
    </section>

    <section id="casual-signal" className="casual-story" aria-labelledby="casual-story-heading">
      <div className="product-container">
        <div className="casual-story-heading"><h2 id="casual-story-heading">One reserve.<br /><span>More than one consequence.</span></h2><p>The shortest route is not the only one. A voice, a crossing, a trail below the waterline.</p></div>
        <div className="casual-story-layout">
          <div className="casual-reserve-art"><ConsequenceDiagram /></div>
          <div className="casual-story-branches">
            <article><h3>Wake the relay.</h3><p>A voice comes back. Behind you, the tide takes the crossing.</p></article>
            <article><h3>Raise the crossing.</h3><p>The shore stays within reach. Inside the archive, the signal goes quiet.</p></article>
            <article><h3>Follow the lower channel.</h3><p>Footprints lead to a service passage. You keep the reserve, but the tide keeps rising.</p></article>
          </div>
        </div>
        <p className="casual-concept-note">An illustrated scenario concept. Realms is in development.</p>
      </div>
    </section>

    {/* Static screen illustration is inserted here by the page composition. */}
    {children}

    <div className="product-container casual-invitation">
      <div className="casual-invitation-copy"><h3>Bring another perspective.</h3><p>Send a friend the same signal. Compare the first moves you would make.</p></div>
      <div className="casual-invitation-actions"><button type="button" className="casual-share" onClick={copyWorldLink}>{shareState === "copied" ? <Check size={16} strokeWidth={1.5} aria-hidden="true" /> : <Copy size={16} strokeWidth={1.5} aria-hidden="true" />}{shareState === "copied" ? "Link copied" : "Copy world link"}</button><a className="casual-access" href="#join-waitlist" onClick={scrollToWaitlist}>Request early access <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /></a></div>
      <div className="casual-share-feedback" aria-live="polite">{shareState === "copied" && <p>The world link is ready to share.</p>}{shareState === "manual" && <div><label htmlFor="casual-world-link">Copy this link to share the world</label><input id="casual-world-link" ref={shareInput} type="url" readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} /></div>}</div>
    </div>
  </div>;
}
