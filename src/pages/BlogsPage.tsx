import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import ResponsiveHeader from "@/components/ResponsiveHeader";
import { REALMS_BLOGS, formatBlogDate, realmsBlogPath } from "../../shared/realms-blogs";
import "@/blogs.css";

export default function BlogsPage() {
  return (
    <div className="product-site realms-blogs">
      <ResponsiveHeader theme="dark" />
      <main className="product-container blogs-main">
        <section className="blogs-heading" aria-labelledby="blogs-title">
          <p className="product-eyebrow">The Realms Journal</p>
          <h1 id="blogs-title">Ideas behind <span>the experience.</span></h1>
          <p>New perspectives on learning, decisions, and what we're building. A closer look inside Enemites Realms.</p>
          <div className="blogs-heading-meta"><span>Blogs Overview</span><span>{REALMS_BLOGS.length} stories to explore</span></div>
        </section>
        <section className="blogs-grid" aria-label="Realms blog articles">
          {REALMS_BLOGS.map((post, index) => (
            <article key={post.slug} lang="en" className={`blog-card ${index === 0 ? "blog-card-featured" : "blog-card-supporting"}`}>
              <div className="blog-card-label"><span>{index === 0 ? "Latest perspective" : "From the journal"}</span><span aria-hidden="true">{String(index + 1).padStart(2, "0")} / {String(REALMS_BLOGS.length).padStart(2, "0")}</span></div>
              <Link to={realmsBlogPath(post.slug)} className="blog-card-link">
                <div className="blog-card-art">
                  <picture>
                    <source type="image/avif" srcSet={`/assets/blogs/${post.slug}-640.avif 640w, /assets/blogs/${post.slug}-960.avif 960w, /assets/blogs/${post.slug}-1536.avif 1536w`} sizes={index === 0 ? "(max-width: 600px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 72px), 1160px" : "(max-width: 600px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 72px), 640px"} />
                    <img src={post.image} srcSet={`/assets/blogs/${post.slug}-640.webp 640w, /assets/blogs/${post.slug}-960.webp 960w, /assets/blogs/${post.slug}-1536.webp 1536w`} sizes={index === 0 ? "(max-width: 600px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 72px), 1160px" : "(max-width: 600px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 72px), 640px"} alt={post.imageAlt} width="1536" height="1024" loading={index === 0 ? "eager" : "lazy"} />
                  </picture>
                </div>
                <div className="blog-card-copy">
                  <div className="blog-meta"><span>{post.category}</span><time dateTime={post.addedAt}>{formatBlogDate(post.addedAt)}</time></div>
                  <h2>{post.title}</h2>
                  <p>{post.description}</p>
                  <span className="blog-read-link">Read the story <ArrowUpRight size={16} aria-hidden="true" /></span>
                </div>
              </Link>
            </article>
          ))}
        </section>
        <footer className="blogs-footer"><span>Enemites Realms</span><Link to="/realms">Explore Realms <ArrowUpRight size={16} aria-hidden="true" /></Link></footer>
      </main>
    </div>
  );
}
