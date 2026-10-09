import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { metadataForPath, SITE_ORIGIN, SOCIAL_IMAGE, structuredData } from "../../shared/seo";

export default function SeoMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = metadataForPath(pathname);
    document.title = page.title;
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
    const values = { "og:type": "website", "og:site_name": "Enemites", "og:locale": "en_US", "og:title": page.title, "og:description": page.description, "og:url": `${SITE_ORIGIN}${page.path}`, "og:image": SOCIAL_IMAGE, "og:image:width": "1200", "og:image:height": "630", "og:image:alt": "Enemites — Research and learning simulations" };
    for (const [name, value] of Object.entries(values)) setMeta("property", name, value);
    for (const [name, value] of Object.entries({ "twitter:card": "summary_large_image", "twitter:title": page.title, "twitter:description": page.description, "twitter:image": SOCIAL_IMAGE })) setMeta("name", name, value);
    document.getElementById("site-structured-data")?.remove();
    const schema = structuredData(page);
    if (schema) {
      const script = document.createElement("script"); script.id = "site-structured-data"; script.type = "application/ld+json"; script.textContent = JSON.stringify(schema); document.head.append(script);
    }
  }, [pathname]);
  return null;
}
