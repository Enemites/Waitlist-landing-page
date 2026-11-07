import { ArrowDownRight, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { scrollToWaitlist } from "../../lib/scroll";
import CompetitiveLegends from "./CompetitiveLegends";
import CompetitiveMatchBoard from "./CompetitiveMatchBoard";

const matchSteps = [
  { label: "Form your team", title: "Bring friends. Or join a team.", copy: "Start with people you know, or find a team to join. Share observations and decide how you’ll work together." },
  { label: "Find your opposition", title: "The same challenge. Another approach.", copy: "The planned matchmaking pairs two teams with shared starting conditions and an objective. Each team brings its own strategy." },
  { label: "Make your move", title: "Coordinate. Commit. Adapt.", copy: "Divide responsibilities and make the call together. Your decisions and the other team’s moves change what happens next." },
] as const;

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
          <CompetitiveMatchBoard />
          <figcaption><span><i className="is-ours" />Your team</span><span><i className="is-shared" />One shared challenge</span><span><i className="is-theirs" />The opposition</span></figcaption>
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

    <CompetitiveLegends />

    <section className="competitive-invitation-section" aria-labelledby="competitive-invitation-heading">
      <div className="product-container"><div className="competitive-invitation"><h3 id="competitive-invitation-heading">Bring this challenge to your group.</h3><div><a href="#join-waitlist" className="competitive-waitlist-link" onClick={scrollToWaitlist}>Get match updates <ArrowRight size={18} aria-hidden="true" /></a><p>Follow team challenges and matchmaking as they take shape.</p></div></div></div>
    </section>
  </div>;
}
