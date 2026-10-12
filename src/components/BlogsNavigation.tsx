import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { LATEST_REALMS_BLOGS, realmsBlogPath } from "../../shared/realms-blogs";

type BlogsNavigationProps = {
  className: string;
  isMobile: boolean;
  onNavigate: () => void;
  onOpenChange: (open: boolean) => void;
};

export default function BlogsNavigation({ className, isMobile, onNavigate, onOpenChange }: BlogsNavigationProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const location = useLocation();
  const active = location.pathname === "/realms/blogs" || location.pathname.startsWith("/realms/blogs/");

  useEffect(() => { setOpen(false); }, [location.key]);
  useEffect(() => { if (!isMobile) onOpenChange(open); }, [open, isMobile, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    rootRef.current?.addEventListener("keydown", closeOnEscape);
    const root = rootRef.current;
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      root?.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const navigate = () => { setOpen(false); onNavigate(); };

  return (
    <div
      ref={rootRef}
      className={`blogs-navigation${isMobile ? " blogs-navigation-mobile" : ""}`}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`${className} blogs-trigger`}
        aria-expanded={open}
        aria-controls={panelId}
        data-active={active || undefined}
        onClick={() => setOpen(value => !value)}
      >
        <span>Blogs</span>
      </button>
      {open && (
        <div id={panelId} className="blogs-dropdown">
          <div className="blogs-menu-layout">
          <div className="blogs-menu-stories">
          <p className="blogs-dropdown-label">Latest from Realms</p>
          <ul>
            {LATEST_REALMS_BLOGS.map(post => (
              <li key={post.slug}>
                <Link to={realmsBlogPath(post.slug)} onClick={navigate} aria-current={location.pathname.replace(/\/$/, "") === realmsBlogPath(post.slug) ? "page" : undefined}>
                  <span className="blogs-dropdown-title">{post.title}</span>
                  <span className="blogs-dropdown-category">{post.category}</span>
                </Link>
              </li>
            ))}
          </ul>
          </div>
          <div className="blogs-menu-resources">
          <p className="blogs-dropdown-label">Explore the journal</p>
          <Link className="blogs-overview-link" to="/realms/blogs" onClick={navigate} aria-current={location.pathname.replace(/\/$/, "") === "/realms/blogs" ? "page" : undefined}>
            Blogs Overview <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <p className="blogs-menu-description">Ideas on learning through simulation, thoughtful reflection, and evidence of capability.</p>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
