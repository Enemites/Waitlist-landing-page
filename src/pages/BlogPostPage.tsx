import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Plus } from "lucide-react";
import ResponsiveHeader from "@/components/ResponsiveHeader";
import NotFoundPage from "@/pages/NotFoundPage";
import { REALMS_BLOGS, blogReadingMinutes, blogSectionId, findRealmsBlog, formatBlogDate, realmsBlogPath } from "../../shared/realms-blogs";
import "@/blogs.css";

/** Highlights the section being read in the outline. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const targets = ids.map(id => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node));
    if (!targets.length) return;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: "-20% 0px -65% 0px" });
    targets.forEach(target => observer.observe(target));
    return () => observer.disconnect();
  }, [ids.join("|")]);
  return active;
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = findRealmsBlog(slug ?? "");
  const sectionIds = post ? post.sections.map(section => blogSectionId(section.heading)) : [];
  const activeSection = useActiveSection(sectionIds);
  if (!post) return <NotFoundPage />;

  const index = REALMS_BLOGS.findIndex(other => other.slug === post.slug);
  const next = REALMS_BLOGS[(index + 1) % REALMS_BLOGS.length];
  const related = REALMS_BLOGS.filter(other => other.slug !== post.slug && other.slug !== next.slug).slice(0, 2);

  return (
    <div className="product-site realms-blogs">
      <ResponsiveHeader theme="dark" />
      <div className="story-progress" aria-hidden="true" />
      <main className="blogs-main">
        <article className="story">
          <header className="story-hero product-container">
            <div className="story-hero-copy">
              <Link className="story-back" to="/realms/blogs"><ArrowLeft size={16} aria-hidden="true" /> The Realms Journal</Link>
              <p className="product-eyebrow">{post.category}</p>
              <h1>{post.title}</h1>
              <p className="story-dek">{post.description}</p>
              <div className="journal-meta"><span>Enemites team</span><time dateTime={post.addedAt}>{formatBlogDate(post.addedAt)}</time><span>{blogReadingMinutes(post)} min read</span></div>
            </div>
            <div className="journal-plate journal-plate--hero">
              <picture>
                <source type="image/avif" srcSet={`/assets/blogs/${post.slug}-640.avif 640w, /assets/blogs/${post.slug}-960.avif 960w, /assets/blogs/${post.slug}-1536.avif 1536w`} sizes="(max-width: 900px) calc(100vw - 48px), 560px" />
                <img src={post.image} srcSet={`/assets/blogs/${post.slug}-640.webp 640w, /assets/blogs/${post.slug}-960.webp 960w, /assets/blogs/${post.slug}-1536.webp 1536w`} sizes="(max-width: 900px) calc(100vw - 48px), 560px" alt={post.imageAlt} width="1536" height="1024" />
              </picture>
            </div>
          </header>

          <div className="story-layout product-container">
            <nav className="story-outline" aria-label="In this story">
              <p>In this story</p>
              <ol>
                {post.sections.map(section => {
                  const id = blogSectionId(section.heading);
                  return <li key={id}><a href={`#${id}`} aria-current={activeSection === id ? "true" : undefined}>{section.heading}</a></li>;
                })}
                {post.faqs?.length ? <li><a href="#faq">Questions</a></li> : null}
              </ol>
            </nav>

            <div className="story-body">
              <p className="story-lead">{post.introduction}</p>
              {post.facts?.length ? (
                <dl className="story-facts">
                  {post.facts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
                </dl>
              ) : null}
              {post.sections.map(section => (
                <section key={section.heading} id={blogSectionId(section.heading)} data-article-section>
                  <h2>{section.heading}</h2>
                  {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                </section>
              ))}
              {post.faqs?.length ? (
                <section id="faq" className="story-faq" aria-labelledby="blog-faq-title">
                  <h2 id="blog-faq-title">Questions about Enemites Realms</h2>
                  {post.faqs.map(faq => (
                    <details key={faq.question}>
                      <summary><h3>{faq.question}</h3><Plus size={18} aria-hidden="true" /></summary>
                      <p>{faq.answer}</p>
                    </details>
                  ))}
                </section>
              ) : null}
              {post.references?.length ? (
                <section className="story-references" aria-labelledby="blog-references-title">
                  <h2 id="blog-references-title">Official sources and further reading</h2>
                  <ul>{post.references.map(reference => <li key={reference.path}><Link to={reference.path}>{reference.label} <ArrowUpRight size={14} aria-hidden="true" /></Link></li>)}</ul>
                </section>
              ) : null}
            </div>
          </div>
        </article>

        <section className="story-next" aria-labelledby="story-next-title">
          <Link to={realmsBlogPath(next.slug)} className="story-next-link product-container">
            <span className="story-next-label">Next story</span>
            <h2 id="story-next-title">{next.title}</h2>
            <span className="journal-read">{next.category} <ArrowUpRight size={18} aria-hidden="true" /></span>
          </Link>
        </section>

        <aside className="story-related product-container" aria-labelledby="more-from-realms">
          <h2 id="more-from-realms">More from the journal</h2>
          <div>
            {related.map(other => (
              <Link key={other.slug} to={realmsBlogPath(other.slug)} className="story-related-card">
                <div className="journal-plate journal-plate--row">
                  <picture>
                    <source type="image/avif" srcSet={`/assets/blogs/${other.slug}-640.avif 640w`} />
                    <img src={`/assets/blogs/${other.slug}-640.webp`} alt={other.imageAlt} width="1536" height="1024" loading="lazy" decoding="async" />
                  </picture>
                </div>
                <div>
                  <div className="journal-meta"><span>{other.category}</span><span>{blogReadingMinutes(other)} min read</span></div>
                  <h3>{other.title}</h3>
                </div>
              </Link>
            ))}
            <Link to="/realms" className="story-related-cta">
              <span>Step inside Realms.</span>
              <small>See the learning experience these stories are about.</small>
              <ArrowUpRight size={22} aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </main>
    </div>
  );
}
