import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import SEO from "../components/SEO";
import Newsletter from "../components/Newsletter";
import ArticleCard from "../components/ArticleCard";
import CommentsSection from "../components/CommentsSection";
import { CategoryBadge } from "../components/Hero";
import { fetchArticleBySlug, fetchArticlesByCategory } from "../lib/articleService";
import { articleMeta } from "../lib/seo";
import { trackArticleView } from "../lib/analytics";
import "./ArticlePage.css";

export default function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    window.scrollTo(0, 0);
    fetchArticleBySlug(slug).then(({ data }) => {
      if (!data) { setNotFound(true); setLoading(false); return; }
      setArticle(data);
      setLoading(false);
      // Track view after article loads
      trackArticleView(data.id, slug);
      fetchArticlesByCategory(data.category, 4).then(({ data: rel }) => {
        setRelated((rel ?? []).filter((a) => a.slug !== slug).slice(0, 3));
      });
    });
  }, [slug]);

  if (loading) return <ArticleSkeleton />;
  if (notFound) return (
    <div className="article-not-found">
      <h1>Article not found</h1>
      <Link to="/">← Back to homepage</Link>
    </div>
  );

  const meta = articleMeta(article);
  const body = article._raw?.body;
  const color = article._raw?.category_color;
  const catLabel = article._raw?.category_label;

  return (
    <>
      <SEO
        title={article.title}
        description={article.excerpt}
        image={article.image}
        url={meta.url}
        type="article"
        publishedTime={meta.publishedTime}
        author={meta.author}
        section={meta.section}
        tags={article.tags}
      />

      <article className="article-page" aria-label={article.title}>
        {/* Hero */}
        <header className="article-hero">
          <div className="article-hero__bg" aria-hidden="true" />
          <div className="container article-hero__inner">
            <nav className="article-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true"> / </span>
              {article.category && (
                <>
                  <Link to={`/category/${article.category}`}>{catLabel || article.category}</Link>
                  <span aria-hidden="true"> / </span>
                </>
              )}
              <span aria-current="page">{article.title}</span>
            </nav>

            <div className="article-hero__meta">
              <CategoryBadge
                categoryId={article.category}
                categoryColor={color}
                categoryLabel={catLabel}
              />
              <time dateTime={article._raw?.published_at} className="article-hero__date">
                {article.date}
              </time>
              <span className="article-hero__read-time">{article.readTime}</span>
            </div>

            <h1 className="article-hero__title">{article.title}</h1>
            <p className="article-hero__excerpt">{article.excerpt}</p>

            <div className="article-hero__byline">
              <div className="article-hero__avatar" aria-hidden="true">
                {article.author?.[0] ?? "?"}
              </div>
              <div>
                <div className="article-hero__author">{article.author}</div>
                <div className="article-hero__role">{article.authorRole}</div>
              </div>
              <div className="article-hero__share" role="group" aria-label="Share article">
                <ShareButton platform="twitter" article={article} />
                <ShareButton platform="linkedin" article={article} />
                <CopyLinkButton slug={slug} />
              </div>
            </div>
          </div>
        </header>

        {/* Cover image */}
        {article.image && (
          <div className="article-cover container">
            <img
              src={article.image}
              alt={`Cover image for "${article.title}"`}
              className="article-cover__img"
              width="1200"
              height="630"
            />
          </div>
        )}

        {/* Body */}
        <div className="container article-layout">
          <div className="article-content">
            {body ? (
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            ) : (
              <ArticlePlaceholderBody excerpt={article.excerpt} />
            )}

            {/* Tags */}
            {article.tags?.length > 0 && (
              <footer className="article-tags" aria-label="Article tags">
                <span className="article-tags__label">Topics:</span>
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/search?q=${encodeURIComponent(tag)}`}
                    className="article-tags__tag"
                  >
                    #{tag}
                  </Link>
                ))}
              </footer>
            )}

            {/* Share (bottom) */}
            <div className="article-share-bottom" role="group" aria-label="Share article">
              <span className="article-share-bottom__label">Share:</span>
              <ShareButton platform="twitter" article={article} large />
              <ShareButton platform="linkedin" article={article} large />
              <CopyLinkButton slug={slug} large />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="article-sidebar" aria-label="Article sidebar">
            <div className="sidebar-author-card">
              <div className="sidebar-author__avatar" aria-hidden="true">
                {article.author?.[0] ?? "?"}
              </div>
              <div className="sidebar-author__name">{article.author}</div>
              <div className="sidebar-author__role">{article.authorRole}</div>
              {article._raw?.author_bio && (
                <p className="sidebar-author__bio">{article._raw.author_bio}</p>
              )}
            </div>

            {related.length > 0 && (
              <div className="sidebar-related">
                <h2 className="sidebar-related__title">More from {catLabel}</h2>
                {related.map((a) => (
                  <ArticleCard key={a.id} article={a} variant="compact" />
                ))}
              </div>
            )}
          </aside>
        </div>
      </article>

      <CommentsSection articleId={article.id} />
      <Newsletter />
    </>
  );
}

/* ── Share helpers ──────────────────────────────────────────────── */
function ShareButton({ platform, article, large }) {
  const url = encodeURIComponent(`https://psynews.vercel.app/article/${article.slug}`);
  const text = encodeURIComponent(article.title);
  const href =
    platform === "twitter"
      ? `https://twitter.com/intent/tweet?text=${text}&url=${url}&via=PsyNews`
      : `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`;
  const label = platform === "twitter" ? "Share on X/Twitter" : "Share on LinkedIn";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`share-btn share-btn--${platform} ${large ? "share-btn--large" : ""}`}
      aria-label={label}
    >
      {platform === "twitter" ? "𝕏" : "in"}
    </a>
  );
}

function CopyLinkButton({ slug, large }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(`https://psynews.vercel.app/article/${slug}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className={`share-btn share-btn--copy ${large ? "share-btn--large" : ""}`}
      aria-label="Copy link to article"
    >
      {copied ? "✓" : "⎘"}
    </button>
  );
}

/* ── Placeholder body (when no rich text stored yet) ──────────── */
function ArticlePlaceholderBody({ excerpt }) {
  return (
    <div className="article-body">
      <p className="article-body__lead">{excerpt}</p>
      <p>
        This article is part of PsyNews&rsquo; ongoing coverage of the psychedelic renaissance.
        Full article text is available to registered subscribers. The excerpt above summarises
        the key findings reported in this story.
      </p>
      <p>
        PsyNews publishes independent, rigorously sourced journalism on psychedelic research,
        policy, culture, and science. Our editorial team includes scientists, clinicians, and
        award-winning journalists dedicated to accurate coverage of this rapidly evolving field.
      </p>
      <h2>Key Takeaways</h2>
      <ul>
        <li>Peer-reviewed research and clinical evidence underpin every claim.</li>
        <li>All sources are cited and independently verifiable.</li>
        <li>Expert commentary is sought from leading researchers and practitioners.</li>
        <li>Editorial independence is maintained from all commercial interests.</li>
      </ul>
      <p>
        Subscribe to PsyNews to read the full article and access our complete archive of
        psychedelic intelligence reporting.
      </p>
    </div>
  );
}

/* ── Loading skeleton ─────────────────────────────────────────── */
function ArticleSkeleton() {
  return (
    <div className="article-page">
      <div className="article-hero">
        <div className="container article-hero__inner">
          <div className="skeleton skeleton--tag" style={{ width: 120, marginBottom: 24 }} />
          <div className="skeleton skeleton--h1" style={{ marginBottom: 12 }} />
          <div className="skeleton skeleton--h1 skeleton--h1-short" style={{ marginBottom: 24 }} />
          <div className="skeleton skeleton--text" style={{ marginBottom: 8 }} />
          <div className="skeleton skeleton--text" style={{ marginBottom: 8 }} />
          <div className="skeleton skeleton--text skeleton--text-short" style={{ marginBottom: 32 }} />
          <div style={{ display: "flex", gap: 12 }}>
            <div className="skeleton skeleton--avatar" />
            <div>
              <div className="skeleton skeleton--author" style={{ marginBottom: 6 }} />
              <div className="skeleton skeleton--text" style={{ width: 100 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
