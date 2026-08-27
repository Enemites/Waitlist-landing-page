import { useEffect, useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export type ResponsiveNavItem = {
  label: string;
  to?: string;
  href?: string;
  iconPath?: string;
};

export const novaGlobalNavItems: ResponsiveNavItem[] = [
  {
    label: "Home",
    to: "/arena",
  },
  {
    iconPath:
      "M8 5.14v13.72L18.78 12 8 5.14Zm2 3.63L15.02 12 10 15.23V8.77Z",
    label: "How It Works",
    to: "/arena/how-it-works",
  },
  {
    iconPath:
      "M11 10h2v7h-2v-7Zm0-3h2v2h-2V7Zm1-5a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z",
    label: "About Us",
    to: "/arena/about-us",
  },
  {
    iconPath:
      "M5 4h14v2H5V4Zm0 4h14v2H5V8Zm0 4h9v2H5v-2Zm0 4h9v2H5v-2Zm12.4-3.2a3.2 3.2 0 1 0-2.26 5.46l-1.57 1.57L15 21.24l1.57-1.57a3.2 3.2 0 0 0 .83-6.87Zm0 1.8a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8Z",
    label: "Research",
    href: "https://research.enemitesarena.tech",
  },
];

type ResponsiveHeaderProps = {
  className?: string;
  desktopItems?: ResponsiveNavItem[];
  mobileItems?: ResponsiveNavItem[];
  theme?: "dark" | "light";
};

const getHeaderClasses = (className: string) => {
  const baseLayout = "fixed left-1/2 z-50 flex w-[calc(100%-1rem)] max-w-4xl -translate-x-1/2 items-center justify-between rounded-xl px-3 py-2 sm:w-[calc(100%-2rem)] sm:px-4 sm:py-3 md:w-[calc(100%-3rem)]";
  // Universal neutral glass for BOTH light and dark themes
  const universalGlass = "backdrop-blur-xl bg-neutral-500/10 border border-neutral-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]";
  return `${baseLayout} ${universalGlass} ${className}`;
};

const ResponsiveHeader = ({
  className = "",
  desktopItems = novaGlobalNavItems,
  mobileItems = desktopItems,
  theme = "dark",
}: ResponsiveHeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const location = useLocation();
  const isDark = theme === "dark";

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const isActive = (item: ResponsiveNavItem) => {
    return Boolean(item.to && item.to === location.pathname);
  };

  const renderNavItem = (item: ResponsiveNavItem, isMobile = false) => {
    const active = isActive(item);
    let itemClass = "";
    
    // Text colors still adapt to theme so they are readable
    if (isMobile) {
      if (active) {
         itemClass = isDark ? "bg-white/[0.1] text-[#E8E4D9]" : "bg-black/[0.05] text-[#111317]";
      } else {
         itemClass = isDark ? "text-[rgba(232,228,217,0.78)] hover:bg-white/[0.08] hover:text-[#E8E4D9]" : "text-[#4A4F5E] hover:bg-black/[0.04] hover:text-[#111317]";
      }
      itemClass = `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${itemClass}`;
    } else {
      if (active) {
         itemClass = isDark ? "border border-white/15 bg-white/[0.08] text-[#E8E4D9]" : "border border-black/10 bg-black/[0.03] text-[#111317]";
      } else {
         itemClass = isDark ? "text-[rgba(232,228,217,0.78)] hover:bg-white/[0.08] hover:text-[#E8E4D9]" : "text-[#4A4F5E] hover:bg-black/[0.04] hover:text-[#111317]";
      }
      itemClass = `inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${itemClass}`;
    }

    const content = (
      <>
        {item.iconPath ? (
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d={item.iconPath} />
          </svg>
        ) : null}
        <span>{item.label}</span>
      </>
    );

    if (item.href) {
      return (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className={itemClass}
          onClick={() => setIsOpen(false)}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        key={item.label}
        to={item.to ?? "/"}
        className={itemClass}
        onClick={() => setIsOpen(false)}
      >
        {content}
      </Link>
    );
  };

  return (
    <header className={getHeaderClasses(className)} style={{ top: "env(safe-area-inset-top, 0.5rem)" }}>
      <Link
        to="/home"
        className={`nova-display text-lg font-semibold tracking-normal sm:text-xl flex items-center gap-2.5 ${isDark ? 'text-[#E8E4D9]' : 'text-[#111317]'}`}
      >
        <img src="/assets/logo.png" alt="" className={`h-7 w-auto ${isDark ? 'invert' : ''}`} />
        <span>Enemites</span>
      </Link>

      <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary navigation">
        {desktopItems.map((item) => renderNavItem(item))}
      </nav>

      <div className="relative sm:hidden">
        <button
          type="button"
          aria-controls={menuId}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
            isDark 
              ? 'border-white/10 bg-white/[0.08] text-[#E8E4D9] hover:bg-white/[0.12]' 
              : 'border-black/10 bg-black/[0.03] text-[#111317] hover:bg-black/[0.06]'
          }`}
          onClick={() => setIsOpen((current) => !current)}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {isOpen ? (
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            )}
          </svg>
        </button>

        {isOpen ? (
          <nav
            id={menuId}
            className="absolute right-0 top-11 w-56 rounded-xl border border-neutral-500/20 bg-neutral-500/10 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.34)] backdrop-blur-2xl"
            aria-label="Mobile navigation"
          >
            {mobileItems.map((item) => renderNavItem(item, true))}
          </nav>
        ) : null}
      </div>
    </header>
  );
};

export default ResponsiveHeader;
