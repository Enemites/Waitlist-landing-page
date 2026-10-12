import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import ResponsiveHeader from "@/components/ResponsiveHeader";
import NotFoundPage from "@/pages/NotFoundPage";
import { REALMS_BLOGS, findRealmsBlog, formatBlogDate, realmsBlogPath } from "../../shared/realms-blogs";
import "@/blogs.css";

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = findRealmsBlog(slug ?? "");
  if (!post) return <NotFoundPage />;
  const readingMinutes = Math.max(1, Math.ceil([post.introduction, ...post.sections.flatMap(section => section.paragraphs), ...(post.faqs ?? []).map(faq => `${faq.question} ${faq.answer}`)].join(" ").split(/\s+/).length / 200));

  return (
    <div className="product-site realms-blogs">
      <ResponsiveHeader theme="dark" />
      <main className="product-container blogs-main">
        <article className="blog-article">
          <div className="blog-article-topline"><Link className="blog-back-link" to="/realms/blogs"><ArrowLeft size={16} aria-hidden="true" /> Blogs Overview</Link>
            <span>The Realms Journal</span>
          </div>
          <header className="blog-article-heading">
            <p className="product-eyebrow">{post.category}</p>
            <h1>{post.title}</h1>
            <p>{post.description}</p>
            <div className="blog-meta"><span>Enemites team</span><time dateTime={post.addedAt}>{formatBlogDate(post.addedAt)}</time><span className="blog-reading-time">{readingMinutes} min read</span></div>
          </header>
          <div className="blog-article-art">
            <picture>
              <source type="image/avif" srcSet={`/assets/blogs/${post.slug}-640.avif 640w, /assets/blogs/${post.slug}-960.avif 960w, /assets/blogs/${post.slug}-1536.avif 1536w`} sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 72px), 1160px" />
              <img src={post.image} srcSet={`/assets/blogs/${post.slug}-640.webp 640w, /assets/blogs/${post.slug}-960.webp 960w, /assets/blogs/${post.slug}-1536.webp 1536w`} sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 72px), 1160px" alt={post.imageAlt} width="1536" height="1024" />
            </picture>
          </div>
          <div className="blog-article-body">
            <p className="blog-introduction">{post.introduction}</p>
            {post.facts?.length ? <dl className="blog-facts">{post.facts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl> : null}
            {post.sections.map((section, index) => (
              <section key={section.heading} data-article-section>
                <span className="blog-section-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h2>{section.heading}</h2>
                {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}
            {post.faqs?.length ? <section id="faq" className="blog-faq" aria-labelledby="blog-faq-title"><h2 id="blog-faq-title">Questions about Enemites Realms</h2>{post.faqs.map(faq => <div key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></div>)}</section> : null}
            {post.references?.length ? <section className="blog-references" aria-labelledby="blog-references-title"><h2 id="blog-references-title">Official sources and further reading</h2><ul>{post.references.map(reference => <li key={reference.path}><Link to={reference.path}>{reference.label}</Link></li>)}</ul></section> : null}
            <div className="blog-article-cta"><p className="product-eyebrow">From ideas to experience</p><h2>Step inside Realms.</h2><p>Explore the learning experience we're building.</p><Link to="/realms">Discover Realms <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
          </div>
        </article>
        <aside className="blogs-related" aria-labelledby="more-from-realms">
          <div className="blogs-related-heading"><p className="product-eyebrow">Keep exploring</p><h2 id="more-from-realms">More from Realms</h2></div>
          <div>{REALMS_BLOGS.filter(other => other.slug !== post.slug).slice(0, 2).map(other => (
            <Link key={other.slug} to={realmsBlogPath(other.slug)}>
              <div className="blogs-related-art"><picture><source type="image/avif" srcSet={`/assets/blogs/${other.slug}-640.avif 640w, /assets/blogs/${other.slug}-960.avif 960w`} sizes="(max-width: 600px) calc(100vw - 40px), 560px" /><img src={`/assets/blogs/${other.slug}-960.webp`} srcSet={`/assets/blogs/${other.slug}-640.webp 640w, /assets/blogs/${other.slug}-960.webp 960w`} sizes="(max-width: 600px) calc(100vw - 40px), 560px" alt={other.imageAlt} width="1536" height="1024" loading="lazy" /></picture></div>
              <span>{other.category}</span><h3>{other.title}</h3><span className="blog-read-link">Read the story <ArrowUpRight size={16} aria-hidden="true" /></span>
            </Link>
          ))}</div>
        </aside>
        <footer className="blogs-footer"><span>Enemites Realms</span><Link to="/realms/blogs">Blogs Overview <ArrowUpRight size={16} aria-hidden="true" /></Link></footer>
      </main>
    </div>
  );
}
