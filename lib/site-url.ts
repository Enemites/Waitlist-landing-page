// Deployment settings may use either the site origin or the Realms product URL.
// Always resolve API and invitation paths from the origin to avoid /realms/realms.
export function publicSiteOrigin(): URL {
  const configured = process.env.PUBLIC_SITE_URL?.trim();
  if (!configured) throw new Error("Configure PUBLIC_SITE_URL with the HTTPS site origin or /realms URL.");
  const site = new URL(configured);
  if (site.protocol !== "https:" || site.username || site.password || site.search || site.hash ||
    !["/", "/realms", "/realms/"].includes(site.pathname)) {
    throw new Error("PUBLIC_SITE_URL must be an HTTPS origin or its /realms URL, without credentials, query parameters, or a fragment.");
  }
  return new URL(site.origin);
}
