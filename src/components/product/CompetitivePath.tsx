import { ArrowDownRight, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

const matchSteps = [
  { label: "Form your team", title: "Bring friends. Or join a team.", copy: "Start with people you know, or find a team to join. Share observations and decide how you’ll work together." },
  { label: "Find your opposition", title: "The same challenge. Another approach.", copy: "The planned matchmaking pairs two teams with shared starting conditions and an objective. Each team brings its own strategy." },
  { label: "Make your move", title: "Coordinate. Commit. Adapt.", copy: "Divide responsibilities and make the call together. Your decisions and the other team’s moves change what happens next." },
] as const;

function TeamToken({ x, y, opponent = false }: { x: number; y: number; opponent?: boolean }) {
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cy="13" rx="15" ry="8" fill="#132116" opacity=".09" />
    <path d="M-12 0v11c0 8 24 8 24 0V0Z" fill={opponent ? "#3f4943" : "#a7cc62"} />
    <ellipse rx="12" ry="7" fill={opponent ? "#59665c" : "#c4ed6c"} />
  </g>;
}

function CrossingIllustration() {
  return <svg className="competitive-crossing-scene" viewBox="0 0 640 410" role="img" aria-label="Concept illustration: two teams of three approach one crossing from opposite banks. One approach leads toward the gate’s pump station, while the other leads to the central crossing.">
    <ellipse cx="320" cy="323" rx="227" ry="49" fill="#a5b4a2" opacity=".15" />
    <path d="m58 208 262 150v19L58 227Z" fill="#c9d2c3" />
    <path d="m320 358 262-150v19L320 377Z" fill="#b9c5b4" />
    <path d="m58 208 262-150 262 150-262 150Z" fill="#dce3d5" />
    <path d="m245 101 42-24 182 196-42 24Z" fill="#b3c9c0" />
    <path d="m251 106 6-3m34 38 8-5m112 122 11-6m8 30 10-6" fill="none" stroke="#d9e6df" strokeWidth="3" strokeLinecap="round" />
    <path d="m224 256 166-96 42 24-166 97Z" fill="#c7cec0" stroke="#bdc8b6" strokeWidth="1.5" />
    <path d="m224 256 42 25v9l-42-25Z" fill="#abb9a2" />
    <path d="m266 281 166-97v9l-166 97Z" fill="#b5c1aa" />
    <path d="m237 248 29 17 151-88M237 258l29 17 151-88" fill="none" stroke="#a6b39c" strokeWidth="1.5" />
    <path d="m184 248 28-37 23-19" fill="none" stroke="#9fc75f" strokeWidth="4" strokeLinecap="round" />
    <path d="m184 248 63 17 75-43" fill="none" stroke="#bcc9b0" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 8" />
    <path d="m480 226-47-22-62 14" fill="none" stroke="#77877a" strokeWidth="3" strokeLinecap="round" strokeDasharray="5 8" />
    <path d="m205 177 28 17v31l-28-17Z" fill="#b5cf8d" />
    <path d="m233 194 40-23v31l-40 23Z" fill="#98b574" />
    <path d="m205 177 40-23 28 17-40 23Z" fill="#d0e5ac" />
    <path d="m215 187 9 5v14l-9-5Z" fill="#718164" />
    <path d="m247 189 7-4-3 7 7-4-12 17 3-11-6 4Z" fill="#e9f4d3" />
    <path d="m318 228 1-43 39-22v43" fill="none" stroke="#869780" strokeWidth="5" strokeLinejoin="round" />
    <path d="m320 194 36-21v21l-36 21Z" fill="#b6ce99" />
    <path d="m326 196 24-14m-24 22 24-14" fill="none" stroke="#859a79" strokeWidth="2" />
    <path d="m313 231 11-6m29-17 11-6" stroke="#6d8065" strokeWidth="4" strokeLinecap="round" />
    <TeamToken x={154} y={240} />
    <TeamToken x={179} y={254} />
    <TeamToken x={179} y={225} />
    <TeamToken x={466} y={212} opponent />
    <TeamToken x={491} y={226} opponent />
    <TeamToken x={491} y={197} opponent />
  </svg>;
}

export default function CompetitivePath({ children }: { children?: ReactNode }) {
  return <div className="competitive-path">
    <section className="competitive-opening" aria-labelledby="competitive-heading">
      <div className="product-container competitive-intro">
        <div className="competitive-intro-copy">
          <p className="product-eyebrow">Competitive / Team against team</p>
          <h2 id="competitive-heading">One world.<br /><span>Opposing plans.</span></h2>
          <p className="competitive-intro-description">Bring your team. Match against another. Read the same situation, coordinate your decisions, and see whose strategy holds.</p>
          <a className="competitive-entry-link" href="#competitive-matchmaking">How teams enter <ArrowDownRight size={17} aria-hidden="true" /></a>
        </div>
        <figure className="competitive-world-illustration">
          <CrossingIllustration />
          <figcaption><span><i />Your team</span><span>One shared challenge</span><span><i />The opposition</span></figcaption>
        </figure>
      </div>
    </section>

    <section id="competitive-matchmaking" className="competitive-matchmaking" aria-labelledby="competitive-matchmaking-heading">
      <div className="product-container">
        <header className="competitive-matchmaking-heading"><p className="product-eyebrow">The way into a match</p><h2 id="competitive-matchmaking-heading">Find your team.<br /><span>Then face another.</span></h2></header>
        <div className="competitive-matchmaking-layout">
          <figure className="competitive-strategy-table">
            <img src="/assets/realms/competitive-strategy-table-1536.webp" srcSet="/assets/realms/competitive-strategy-table-768.webp 768w, /assets/realms/competitive-strategy-table-1536.webp 1536w" sizes="(max-width: 767px) calc(100vw - 40px), 52vw" width="1536" height="1024" alt="A physical architectural relief of a coastal world on a dark strategy table, with two distinct sets of team tokens placed along its routes." loading="lazy" decoding="async" />
            <figcaption>A shared problem. Different ways through it.</figcaption>
          </figure>
          <ol className="competitive-match-steps">
            {matchSteps.map(step => <li key={step.label}><p className="competitive-label">{step.label}</p><h3>{step.title}</h3><p>{step.copy}</p></li>)}
          </ol>
        </div>
      </div>
    </section>

    {/* Insert the shared static screenshot collage section here, after matchmaking and before the invitation. */}
    {children}

    <section className="competitive-invitation-section" aria-labelledby="competitive-invitation-heading">
      <div className="product-container"><div className="competitive-invitation"><h3 id="competitive-invitation-heading">Bring this challenge to your group.</h3><div><a href="#join-waitlist" className="competitive-waitlist-link">Get match updates <ArrowRight size={18} aria-hidden="true" /></a><p>Follow team challenges and matchmaking as they take shape.</p></div></div></div>
    </section>
  </div>;
}
