export const SITE = {
  name: "PsyNews",
  tagline: "The Psychedelic Intelligence Network",
  url: "https://psynews.vercel.app",
  description:
    "Independent journalism covering the psychedelic renaissance — research, policy, culture, and science, rigorously reported.",
  twitterHandle: "@PsyNews",
  defaultImage: "https://psynews.vercel.app/og-default.png",
};

export function articleMeta(article) {
  return {
    title: `${article.title} | ${SITE.name}`,
    description: article.excerpt,
    image: article.image || SITE.defaultImage,
    url: `${SITE.url}/article/${article.slug}`,
    type: "article",
    publishedTime: article._raw?.published_at,
    author: article.author,
    section: article._raw?.category_label,
    tags: article.tags,
  };
}

export function categoryMeta(cat) {
  return {
    title: `${cat.label} | ${SITE.name}`,
    description: `Latest ${cat.label} coverage from PsyNews — the psychedelic intelligence network.`,
    image: SITE.defaultImage,
    url: `${SITE.url}/category/${cat.id}`,
    type: "website",
  };
}
