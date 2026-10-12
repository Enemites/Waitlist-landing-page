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

  return (
    <div className="product-site realms-blogs">
      <ResponsiveHeader theme="dark" />
      <main className="product-container blogs-main">
        <article className="blog-article">
          <Link className="blog-back-link" to="/realms/blogs"><ArrowLeft size={16} aria-hidden="true" /> Blogs Overview</Link>
          <header className="blog-article-heading">
            <p className="product-eyebrow">Enemites Realms / {post.category}</p>
            <h1>{post.title}</h1>
            <p>{post.description}</p>
            <div className="blog-meta"><span>Enemites team</span><time dateTime={post.addedAt}>{formatBlogDate(post.addedAt)}</time></div>
          </header>
          <div className="blog-article-art"><img src={post.image} alt={post.imageAlt} width="960" height="640" /></div>
          <div className="blog-article-body">
            <p className="blog-introduction">{post.introduction}</p>
            {post.sections.map(section => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}
            <div className="blog-article-cta"><p>Explore the experience we're building.</p><Link to="/realms">Discover Realms <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
          </div>
        </article>
        <aside className="blogs-related" aria-labelledby="more-from-realms">
          <h2 id="more-from-realms">More from Realms</h2>
          <div>{REALMS_BLOGS.filter(other => other.slug !== post.slug).slice(0, 2).map(other => (
            <Link key={other.slug} to={realmsBlogPath(other.slug)}><span>{other.category}</span><h3>{other.title}</h3><ArrowUpRight size={20} aria-hidden="true" /></Link>
          ))}</div>
        </aside>
        <footer className="blogs-footer"><span>Enemites Realms</span><Link to="/realms/blogs">Blogs Overview <ArrowUpRight size={16} aria-hidden="true" /></Link></footer>
      </main>
    </div>
  );
}
