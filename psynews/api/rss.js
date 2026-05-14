/**
 * Vercel Serverless Function: /api/rss → aliased as /rss.xml
 * Returns an RSS 2.0 feed of the 50 most recent published articles.
 */

const SITE_URL    = process.env.SITE_URL || "https://psynews.vercel.app";
const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY    = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

function escapeXml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default async function handler(req, res) {
  let articles = [];

  if (SUPABASE_URL && ANON_KEY) {
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/articles_with_author?select=id,title,slug,excerpt,image_url,author_name,category_label,published_at&status=eq.published&order=published_at.desc&limit=50`,
        { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
      );
      if (r.ok) articles = await r.json();
    } catch { /* fallback */ }
  }

  const items = articles.map((a) => `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${SITE_URL}/article/${a.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/article/${a.slug}</guid>
      <description>${escapeXml(a.excerpt)}</description>
      <pubDate>${new Date(a.published_at).toUTCString()}</pubDate>
      <author>${escapeXml(a.author_name)}</author>
      <category>${escapeXml(a.category_label)}</category>
      ${a.image_url ? `<enclosure url="${escapeXml(a.image_url)}" type="image/jpeg" length="0"/>` : ""}
    </item>`).join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>PsyNews — The Psychedelic Intelligence Network</title>
    <link>${SITE_URL}</link>
    <description>Independent journalism covering the psychedelic renaissance — research, policy, culture, and science.</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/og-default.svg</url>
      <title>PsyNews</title>
      <link>${SITE_URL}</link>
    </image>
    ${items}
  </channel>
</rss>`;

  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate");
  res.status(200).send(rss);
}
