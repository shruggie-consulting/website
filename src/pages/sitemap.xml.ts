import type { APIRoute } from "astro";
import { meta, routes, type PageKey } from "../i18n";

// Indexable pages only (the legal pages are noindex), each with its language versions.
export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const pages = (Object.keys(routes) as PageKey[]).filter((p) => !meta[p].de.noindex);
  const entries = pages.flatMap((p) =>
    (["de", "en"] as const).map(
      (lang) => `  <url>
    <loc>${url(routes[p][lang])}</loc>
    <xhtml:link rel="alternate" hreflang="de" href="${url(routes[p].de)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${url(routes[p].en)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${url(routes[p].de)}" />
  </url>`,
    ),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
