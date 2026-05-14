import { Helmet } from "react-helmet-async";
import { SITE } from "../lib/seo";

export default function SEO({
  title,
  description = SITE.description,
  image = SITE.defaultImage,
  url,
  type = "website",
  publishedTime,
  author,
  section,
  tags = [],
}) {
  const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
  const canonical = url || SITE.url;

  // Derive image dimensions — article covers are 16:9 (1200×630 equivalent),
  // default OG image is 1200×630.
  const isDefault = image === SITE.defaultImage;
  const imgWidth  = "1200";
  const imgHeight = isDefault ? "630" : "630";
  const imgType   = image.endsWith(".svg") ? "image/svg+xml"
                  : image.endsWith(".png") ? "image/png"
                  : "image/jpeg";

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:site_name"   content={SITE.name} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={image} />
      <meta property="og:image:width"  content={imgWidth} />
      <meta property="og:image:height" content={imgHeight} />
      <meta property="og:image:type"   content={imgType} />
      <meta property="og:image:alt"    content={`${SITE.name} — ${SITE.tagline}`} />
      <meta property="og:url"         content={canonical} />
      <meta property="og:type"        content={type} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {author  && <meta property="article:author"  content={author} />}
      {section && <meta property="article:section" content={section} />}
      {(tags ?? []).map((tag) => <meta key={tag} property="article:tag" content={tag} />)}

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content={SITE.twitterHandle} />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={image} />
      <meta name="twitter:image:alt"   content={`${SITE.name} — ${SITE.tagline}`} />

      {/* Misc */}
      <meta name="theme-color" content="#7C3AED" />
    </Helmet>
  );
}
