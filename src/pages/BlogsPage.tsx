import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import ResponsiveHeader from "@/components/ResponsiveHeader";
import { REALMS_BLOGS, blogReadingMinutes, formatBlogDate, realmsBlogPath, type RealmsBlogPost } from "../../shared/realms-blogs";
import "@/blogs.css";

// Waypoints for the journal atlas: one per story, oldest to newest along a single route.
const ATLAS_POINTS = [
  [92, 318], [168, 214], [262, 268], [330, 150], [430, 214], [498, 112], [560, 236],
  [612, 140], [656, 300],
];

function BlogPlate({ post, sizes, eager = false }: { post: RealmsBlogPost; sizes: string; eager?: boolean }) {
  return (
    <picture>
      <source type="image/avif" srcSet={`/assets/blogs/${post.slug}-640.avif 640w, /assets/blogs/${post.slug}-960.avif 960w, /assets/blogs/${post.slug}-1536.avif 1536w`} sizes={sizes} />
      <img src={post.image} srcSet={`/assets/blogs/${post.slug}-640.webp 640w, /assets/blogs/${post.slug}-960.webp 960w, /assets/blogs/${post.slug}-1536.webp 1536w`} sizes={sizes} alt={post.imageAlt} width="1536" height="1024" loading={eager ? "eager" : "lazy"} decoding="async" />
    </picture>
  );
}

/** The journal drawn as an expedition: each story is a waypoint on one contour map. */
function JournalAtlas({ active, onActive }: { active: string | null; onActive: (slug: string | null) => void }) {
  const chronological = [...REALMS_BLOGS].reverse();
  const points = chronological.map((post, index) => ({ post, number: index + 1, at: ATLAS_POINTS[index % ATLAS_POINTS.length] }));
  const route = points.map(({ at }, index) => `${index ? "L" : "M"}${at[0]} ${at[1]}`).join("");
  return (
    <div className="journal-atlas" aria-hidden="true">
      <div className="journal-atlas-terrain" />
      <svg viewBox="0 0 720 420">
        <path d={route} className="journal-atlas-route" />
        {points.map(({ post, number, at }) => (
          <Link key={post.slug} to={realmsBlogPath(post.slug)} tabIndex={-1} className={`journal-atlas-point${active === post.slug ? " is-active" : ""}`} onPointerEnter={() => onActive(post.slug)} onPointerLeave={() => onActive(null)}>
            <circle cx={at[0]} cy={at[1]} r="22" className="journal-atlas-halo" />
            <circle cx={at[0]} cy={at[1]} r="6" className="journal-atlas-dot" />
            <text x={at[0] + 14} y={at[1] - 12}>{String(number).padStart(2, "0")}</text>
          </Link>
        ))}
      </svg>
    </div>
  );
}

export default function BlogsPage() {
  const [active, setActive] = useState<string | null>(null);
  const [lead, ...rest] = REALMS_BLOGS;
  const chronologicalNumber = (slug: string) => REALMS_BLOGS.length - REALMS_BLOGS.findIndex(post => post.slug === slug);

  return (
    <div className="product-site realms-blogs">
      <ResponsiveHeader theme="dark" />
      <main className="blogs-main">
        <section className="journal-hero product-container" aria-labelledby="blogs-title">
          <div className="journal-hero-copy">
            <p className="product-eyebrow">The Realms Journal</p>
            <h1 id="blogs-title">Field notes from <span>the worlds we build.</span></h1>
            <p>How we think about learning, decisions, and the simulation behind Enemites Realms. One story at a time.</p>
          </div>
          <JournalAtlas active={active} onActive={setActive} />
        </section>

        <section className="journal-lead product-container" aria-label="Latest story">
          <Link to={realmsBlogPath(lead.slug)} className={`journal-lead-link${active === lead.slug ? " is-active" : ""}`} onPointerEnter={() => setActive(lead.slug)} onPointerLeave={() => setActive(null)}>
            <div className="journal-plate journal-plate--lead"><BlogPlate post={lead} eager sizes="(max-width: 900px) calc(100vw - 48px), 640px" /></div>
            <div className="journal-lead-copy">
              <div className="journal-meta"><span>Latest</span><span>{lead.category}</span><time dateTime={lead.addedAt}>{formatBlogDate(lead.addedAt)}</time></div>
              <h2>{lead.title}</h2>
              <p>{lead.description}</p>
              <span className="journal-read">Read the story <ArrowUpRight size={18} aria-hidden="true" /></span>
            </div>
          </Link>
        </section>

        <section className="journal-index product-container" aria-labelledby="journal-index-title">
          <h2 id="journal-index-title">Every story</h2>
          <ol>
            {rest.map(post => (
              <li key={post.slug} lang="en">
                <Link to={realmsBlogPath(post.slug)} className={`journal-row${active === post.slug ? " is-active" : ""}`} onPointerEnter={() => setActive(post.slug)} onPointerLeave={() => setActive(null)} onFocus={() => setActive(post.slug)} onBlur={() => setActive(null)}>
                  <span className="journal-row-number" aria-hidden="true">{String(chronologicalNumber(post.slug)).padStart(2, "0")}</span>
                  <div className="journal-row-copy">
                    <h3>{post.title}</h3>
                    <p>{post.description}</p>
                    <div className="journal-meta"><span>{post.category}</span><time dateTime={post.addedAt}>{formatBlogDate(post.addedAt)}</time><span>{blogReadingMinutes(post)} min read</span></div>
                  </div>
                  <div className="journal-plate journal-plate--row"><BlogPlate post={post} sizes="(max-width: 700px) calc(100vw - 48px), 280px" /></div>
                  <ArrowUpRight className="journal-row-arrow" size={22} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="journal-close product-container">
          <h2>Ideas are a start. <span>Decisions are the point.</span></h2>
          <Link to="/realms" className="journal-close-link">Explore Realms <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </section>
      </main>
    </div>
  );
}
