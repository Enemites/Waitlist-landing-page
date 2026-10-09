export const SITE_ORIGIN = "https://enemites.com";
export const SOCIAL_IMAGE = `${SITE_ORIGIN}/assets/enemites-social.jpg`;

export type PageMetadata = { path: string; title: string; description: string; index: boolean };

export const PUBLIC_PAGES: PageMetadata[] = [
  { path: "/home", title: "Enemites — Research Lab & Learning Simulations", description: "Explore Enemites research into world models and educational simulations, and discover Arena, our problem-based learning project.", index: true },
  { path: "/arena", title: "Enemites Arena — AI Learning Simulations & Waitlist", description: "Discover problem-based learning through world simulations, AI mentor reflection, and evidence of capability. Join the Enemites Arena launch waitlist.", index: true },
  { path: "/arena/how-it-works", title: "How Enemites Arena Works — Decisions, Reflection & Proof", description: "See the Enemites Arena learning loop: enter a scenario, make decisions, observe consequences, reflect with an AI mentor, and review capability evidence.", index: true },
  { path: "/arena/about-us", title: "About Enemites — Our Mission & Team", description: "Meet the students building Enemites and learn why we are exploring simulation, problem-solving practice, and evidence of human capability.", index: true },
  { path: "/arena/privacy-policy", title: "Privacy Policy — Enemites", description: "Read how Enemites handles waitlist information, email preferences, parent-led registration, privacy requests, and third-party video consent.", index: true },
  { path: "/arena/terms-of-service", title: "Terms of Service — Enemites", description: "Read the terms for the Enemites waitlist and early access, including parent-led registration, age appropriate service plans, and learning limitations.", index: true },
];

export const UNINDEXED_PAGES: PageMetadata[] = [
  { path: "/arena/contact", title: "Contact — Enemites", description: "Contact the Enemites team for support and questions.", index: false },
  { path: "/arena/login", title: "Login — Enemites", description: "Enemites account access is not available on the current waitlist.", index: false },
  { path: "/arena/pricing", title: "Pricing — Enemites", description: "Enemites pricing is not available on the current waitlist.", index: false },
];

export function metadataForPath(pathname: string): PageMetadata {
  const path = pathname === "/" ? "/home" : pathname.replace(/\/$/, "");
  const known = [...PUBLIC_PAGES, ...UNINDEXED_PAGES].find(page => page.path === path);
  if (known) return known;
  if (path === "/arena/parent-waitlist") return { path, title: "Parent Waitlist Invitation — Enemites", description: "Review your parent or guardian invitation for the Enemites waitlist.", index: false };
  if (/^\/form\/[^/]+$/.test(path)) return { path, title: "Questionnaire — Enemites", description: "Complete an Enemites questionnaire.", index: false };
  return { path, title: "Page Not Found — Enemites", description: "This page could not be found. Explore Enemites or return to Arena.", index: false };
}

export function structuredData(page: PageMetadata) {
  if (!page.index) return null;
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${SITE_ORIGIN}/#organization`, name: "Enemites", url: `${SITE_ORIGIN}/home`, logo: `${SITE_ORIGIN}/assets/logo.png`, email: "support@enemites.com" },
      { "@type": "WebSite", "@id": `${SITE_ORIGIN}/#website`, name: "Enemites", url: `${SITE_ORIGIN}/home`, publisher: { "@id": `${SITE_ORIGIN}/#organization` }, inLanguage: "en" },
      { "@type": "WebPage", "@id": `${SITE_ORIGIN}${page.path}#webpage`, url: `${SITE_ORIGIN}${page.path}`, name: page.title, description: page.description, isPartOf: { "@id": `${SITE_ORIGIN}/#website` }, inLanguage: "en" },
    ],
  };
}

export const robotsContent = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
export const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PUBLIC_PAGES.map(page => `  <url><loc>${SITE_ORIGIN}${page.path}</loc></url>`).join("\n")}\n</urlset>\n`;

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
export function metadataHtml(page: PageMetadata): string {
  const url = escapeHtml(`${SITE_ORIGIN}${page.path}`);
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const schema = structuredData(page);
  return `<title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="${page.index ? "index,follow" : "noindex,follow"}" />
    ${page.index ? `<link rel="canonical" href="${url}" />` : ""}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Enemites" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${SOCIAL_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Enemites — Research and learning simulations" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${SOCIAL_IMAGE}" />
    ${page.path === "/arena/parent-waitlist" ? '<meta name="referrer" content="no-referrer" />' : ""}
    ${schema ? `<script id="site-structured-data" type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>` : ""}`;
}
