import { REALMS_BLOGS, realmsBlogPath } from "./realms-blogs";

export const SITE_ORIGIN = "https://enemites.com";
export const SOCIAL_IMAGE = `${SITE_ORIGIN}/assets/enemites-social.jpg`;

export const REALMS_ENTITY_ID = `${SITE_ORIGIN}/realms#product`;
export const REALMS_DEFINITION = "Enemites Realms is an AI-assisted learning environment being developed by Enemites, combining problem-based learning, interactive world simulations, AI mentor reflection, and evidence of capability.";

export type PageMetadata = {
  path: string;
  title: string;
  description: string;
  index: boolean;
  lastModified?: string;
};

export const PUBLIC_PAGES: PageMetadata[] = [
  { path: "/home", title: "Enemites — A Research-Driven Collective", description: "Enemites is a research-driven collective advancing technology and cognitive infrastructure through foundational world models and educational environments.", index: true },
  { path: "/realms", title: "Enemites Realms — AI Learning Simulations & Waitlist", description: "Discover problem-based learning through world simulations, AI mentor reflection, and evidence of capability. Join the Enemites Realms launch waitlist.", index: true },
  { path: "/realms/how-it-works", title: "How Enemites Realms Works — Decisions, Reflection & Proof", description: "See the Enemites Realms learning loop: enter a scenario, make decisions, observe consequences, reflect with an AI mentor, and review capability evidence.", index: true },
  { path: "/realms/about-us", title: "About Enemites — Our Mission & Team", description: "Meet the students building Enemites and learn why we are exploring simulation, problem-solving practice, and evidence of human capability.", index: true },
  { path: "/realms/privacy-policy", title: "Privacy Policy — Enemites", description: "Read how Enemites handles waitlist information, email preferences, parent-led registration, privacy requests, and third-party video consent.", index: true },
  { path: "/realms/terms-of-service", title: "Terms of Service — Enemites", description: "Read the terms for the Enemites waitlist and early access, including parent-led registration, age appropriate service plans, and learning limitations.", index: true },
  { path: "/realms/blogs", title: "Realms Blogs — Ideas Behind the Experience | Enemites", description: "Read the Enemites Realms journal on learning simulations, AI mentor reflection, and evidence of capability.", index: true },
  ...REALMS_BLOGS.map(post => {
    const path = realmsBlogPath(post.slug);
    return {
      path, title: `${post.title} — Realms Blog | Enemites`, description: post.description, index: true, lastModified: post.updatedAt ?? post.addedAt,
    };
  }),
];

export const UNINDEXED_PAGES: PageMetadata[] = [
  { path: "/realms/contact", title: "Contact — Enemites", description: "Contact the Enemites team for support and questions.", index: false },
  { path: "/realms/login", title: "Login — Enemites", description: "Enemites account access is not available on the current waitlist.", index: false },
  { path: "/realms/pricing", title: "Pricing — Enemites", description: "Enemites pricing is not available on the current waitlist.", index: false },
];

export function metadataForPath(pathname: string): PageMetadata {
  const path = pathname === "/" ? "/home" : pathname.replace(/\/$/, "");
  const known = [...PUBLIC_PAGES, ...UNINDEXED_PAGES].find(page => page.path === path);
  if (known) return known;
  if (path === "/private") return { path, title: "Invitations & Questionnaires — Enemites", description: "Open an Enemites invitation or questionnaire.", index: false };
  if (path === "/realms/parent-waitlist") return { path, title: "Parent Waitlist Invitation — Enemites", description: "Review your parent or guardian invitation for the Enemites waitlist.", index: false };
  if (/^\/form\/[^/]+$/.test(path)) return { path, title: "Questionnaire — Enemites", description: "Complete an Enemites questionnaire.", index: false };
  return { path, title: "Page Not Found — Enemites", description: "This page could not be found. Explore Enemites or return to Realms.", index: false };
}

export function structuredData(page: PageMetadata) {
  if (!page.index) return null;
  const post = REALMS_BLOGS.find(post => realmsBlogPath(post.slug) === page.path);
  const language = "en";
  const isRealms = page.path === "/realms" || page.path.startsWith("/realms/");
  const blogId = `${SITE_ORIGIN}/realms/blogs#blog`;
  const graph: Record<string, unknown>[] = [
    { "@type": "Organization", "@id": `${SITE_ORIGIN}/#organization`, name: "Enemites", description: "A student-led, research-driven collective building learning environments and exploring cognitive infrastructure.", url: `${SITE_ORIGIN}/home`, logo: `${SITE_ORIGIN}/assets/logo.png`, email: "support@enemites.com" },
    { "@type": "WebSite", "@id": `${SITE_ORIGIN}/#website`, name: "Enemites", url: `${SITE_ORIGIN}/home`, publisher: { "@id": `${SITE_ORIGIN}/#organization` }, inLanguage: "en" },
    { "@type": "WebPage", "@id": `${SITE_ORIGIN}${page.path}#webpage`, url: `${SITE_ORIGIN}${page.path}`, name: page.title, description: page.description, isPartOf: { "@id": `${SITE_ORIGIN}/#website` }, inLanguage: language,
      ...(isRealms ? { about: { "@id": REALMS_ENTITY_ID } } : {}),
      ...(post ? { mainEntity: { "@id": `${SITE_ORIGIN}${page.path}#article` } } : page.path === "/realms" ? { mainEntity: { "@id": REALMS_ENTITY_ID } } : {}),
    },
  ];
  if (isRealms) graph.push({ "@type": "Product", "@id": REALMS_ENTITY_ID, name: "Enemites Realms", alternateName: "Realms", description: REALMS_DEFINITION, category: "AI-assisted learning simulation environment", url: `${SITE_ORIGIN}/realms`, brand: { "@id": `${SITE_ORIGIN}/#organization` }, image: SOCIAL_IMAGE });
  if (post || page.path === "/realms/blogs") {
    graph.push({ "@type": "Blog", "@id": blogId, name: "Enemites Realms Journal", url: `${SITE_ORIGIN}/realms/blogs`, about: { "@id": REALMS_ENTITY_ID }, publisher: { "@id": `${SITE_ORIGIN}/#organization` }, inLanguage: "en" });
    const crumbs = [{ name: "Enemites", path: "/home" }, { name: "Enemites Realms", path: "/realms" }, { name: "Blogs", path: "/realms/blogs" }, ...(post ? [{ name: post.title, path: page.path }] : [])];
    graph.push({ "@type": "BreadcrumbList", "@id": `${SITE_ORIGIN}${page.path}#breadcrumbs`, itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: `${SITE_ORIGIN}${crumb.path}` })) });
  }
  if (post) {
    graph.push({ "@type": "BlogPosting", "@id": `${SITE_ORIGIN}${page.path}#article`, url: `${SITE_ORIGIN}${page.path}`, headline: post.title, description: post.description, abstract: post.introduction, articleSection: post.category, datePublished: post.addedAt, dateModified: post.updatedAt ?? post.addedAt, image: `${SITE_ORIGIN}${post.image}`, author: { "@id": `${SITE_ORIGIN}/#organization` }, publisher: { "@id": `${SITE_ORIGIN}/#organization` }, mainEntityOfPage: { "@id": `${SITE_ORIGIN}${page.path}#webpage` }, isPartOf: { "@id": blogId }, about: { "@id": REALMS_ENTITY_ID }, inLanguage: language,
      ...(post.references?.length ? { citation: post.references.map(reference => ({ "@type": "WebPage", name: reference.label, url: `${SITE_ORIGIN}${reference.path}` })) } : {}),
    });
    if (post.faqs?.length) graph.push({ "@type": "FAQPage", "@id": `${SITE_ORIGIN}${page.path}#faq`, inLanguage: language, mainEntity: post.faqs.map(faq => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export function socialMetadataForPage(page: PageMetadata) {
  const post = REALMS_BLOGS.find(post => realmsBlogPath(post.slug) === page.path);
  return {
    type: post ? "article" : "website",
    locale: "en_US",
    image: post ? `${SITE_ORIGIN}${post.image}` : SOCIAL_IMAGE,
    width: post ? "1536" : "1200", height: post ? "1024" : "630",
    alt: post?.imageAlt ?? "Enemites — Research and learning simulations",
  };
}

export const robotsContent = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
export const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PUBLIC_PAGES.map(page => `  <url><loc>${SITE_ORIGIN}${page.path}</loc>${page.lastModified ? `<lastmod>${page.lastModified}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`;

export const llmsContent = `# Enemites\n\n> ${REALMS_DEFINITION}\n\nRealms is in development. The public site provides product information and a launch waitlist, not a promised release date or immediate simulation access. These are first-party product sources, not independent assessments.\n\n## Official product sources\n\n- [Enemites Realms](${SITE_ORIGIN}/realms): Product introduction and launch waitlist.\n- [How it works](${SITE_ORIGIN}/realms/how-it-works): The intended scenario, decision, reflection, and evidence loop.\n- [About Enemites](${SITE_ORIGIN}/realms/about-us): Team, mission, and product background.\n\n## Realms journal\n\n${REALMS_BLOGS.map(post => `- [${post.title}](${SITE_ORIGIN}${realmsBlogPath(post.slug)}): ${post.description} Language: en.`).join("\n")}\n`;

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
export function metadataHtml(page: PageMetadata): string {
  const url = escapeHtml(`${SITE_ORIGIN}${page.path}`);
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const schema = structuredData(page);
  const social = socialMetadataForPage(page);
  return `<title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="${page.index ? "index,follow" : "noindex,follow"}" />
    ${page.index ? `<link rel="canonical" href="${url}" />` : ""}
    <meta property="og:type" content="${social.type}" />
    <meta property="og:site_name" content="Enemites" />
    <meta property="og:locale" content="${social.locale}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${escapeHtml(social.image)}" />
    <meta property="og:image:width" content="${social.width}" />
    <meta property="og:image:height" content="${social.height}" />
    <meta property="og:image:alt" content="${escapeHtml(social.alt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${escapeHtml(social.image)}" />
    ${["/realms/parent-waitlist", "/private"].includes(page.path) ? '<meta name="referrer" content="no-referrer" />' : ""}
    ${schema ? `<script id="site-structured-data" type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>` : ""}`;
}
