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
          <p className="product-eyebrow">Enemites Realms / Journal</p>
          <h1 id="blogs-title">Ideas behind <span>the experience.</span></h1>
          <p>Explore the thinking behind Realms: learning through simulation, reflecting on decisions, and making progress visible.</p>
          <div className="blogs-heading-meta"><span>Blogs Overview</span><span>{REALMS_BLOGS.length} articles</span></div>
        </section>
        <section className="blogs-grid" aria-label="Realms blog articles">
          {REALMS_BLOGS.map((post, index) => (
            <article key={post.slug} className="blog-card">
              <Link to={realmsBlogPath(post.slug)} className="blog-card-link">
                <div className="blog-card-art">
                  <img src={post.image} alt={post.imageAlt} width="960" height="640" loading={index === 0 ? "eager" : "lazy"} />
                  <span className="blog-card-number" aria-hidden="true">0{index + 1}</span>
                </div>
                <div className="blog-card-copy">
                  <div className="blog-meta"><span>{post.category}</span><time dateTime={post.addedAt}>{formatBlogDate(post.addedAt)}</time></div>
                  <h2>{post.title}</h2>
                  <p>{post.description}</p>
                  <span className="blog-read-link">Read article <ArrowUpRight size={18} aria-hidden="true" /></span>
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
