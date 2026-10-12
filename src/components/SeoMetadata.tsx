import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { metadataForPath, SITE_ORIGIN, socialMetadataForPage, structuredData } from "../../shared/seo";

export default function SeoMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = metadataForPath(pathname);
    document.title = page.title;
    document.documentElement.lang = page.language ?? "en";
    const setMeta = (key: "name" | "property", name: string, content: string) => {
      let node = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${name}"]`);
      if (!node) { node = document.createElement("meta"); node.setAttribute(key, name); document.head.append(node); }
      node.content = content;
    };
    setMeta("name", "description", page.description);
    setMeta("name", "robots", page.index ? "index,follow" : "noindex,follow");
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (page.index) {
      if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.append(canonical); }
      canonical.href = `${SITE_ORIGIN}${page.path}`;
    } else canonical?.remove();
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(node => node.remove());
    for (const alternate of page.alternates ?? []) {
      const link = document.createElement("link"); link.rel = "alternate"; link.hreflang = alternate.language; link.href = `${SITE_ORIGIN}${alternate.path}`; document.head.append(link);
    }
    const social = socialMetadataForPage(page);
    const values = { "og:type": social.type, "og:site_name": "Enemites", "og:locale": social.locale, "og:title": page.title, "og:description": page.description, "og:url": `${SITE_ORIGIN}${page.path}`, "og:image": social.image, "og:image:width": social.width, "og:image:height": social.height, "og:image:alt": social.alt };
    for (const [name, value] of Object.entries(values)) setMeta("property", name, value);
    for (const [name, value] of Object.entries({ "twitter:card": "summary_large_image", "twitter:title": page.title, "twitter:description": page.description, "twitter:image": social.image })) setMeta("name", name, value);
    document.getElementById("site-structured-data")?.remove();
    const schema = structuredData(page);
    if (schema) {
      const script = document.createElement("script"); script.id = "site-structured-data"; script.type = "application/ld+json"; script.textContent = JSON.stringify(schema); document.head.append(script);
    }
  }, [pathname]);
  return null;
}
