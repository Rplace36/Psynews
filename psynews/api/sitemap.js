/**
 * Vercel Serverless Function: /api/sitemap
 * Returns a dynamic XML sitemap reading articles from Supabase.
 * Also aliased via vercel.json rewrite → /sitemap.xml
 */

const SITE_URL    = process.env.SITE_URL || "https://psynews.vercel.app";
const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY    = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const STATIC_PAGES = [
  { path: "/",                     priority: "1.0",  changefreq: "daily" },
  { path: "/category/research",    priority: "0.8",  changefreq: "daily" },
  { path: "/category/policy",      priority: "0.8",  changefreq: "daily" },
  { path: "/category/culture",     priority: "0.8",  changefreq: "weekly" },
  { path: "/category/events",      priority: "0.7",  changefreq: "weekly" },
  { path: "/category/books",       priority: "0.7",  changefreq: "weekly" },
  { path: "/category/opinion",     priority: "0.7",  changefreq: "weekly" },
];

export default async function handler(req, res) {
  let articles = [];

  if (SUPABASE_URL && ANON_KEY) {
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/articles?select=slug,published_at,updated_at&status=eq.published&order=published_at.desc&limit=500`,
        { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
      );
      if (r.ok) articles = await r.json();
    } catch { /* fallback to empty */ }
  }

  const staticUrls = STATIC_PAGES.map(({ path, priority, changefreq }) => `
  <url>
    <loc>${SITE_URL}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join("");

  const articleUrls = articles.map((a) => `
  <url>
    <loc>${SITE_URL}/article/${a.slug}</loc>
    <lastmod>${new Date(a.updated_at || a.published_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${articleUrls}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  res.status(200).send(xml);
}
