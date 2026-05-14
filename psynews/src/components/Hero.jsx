import { useFeaturedArticles } from "../hooks/useArticles";
import { SkeletonHeroMain, SkeletonCard, ErrorMessage } from "./Skeleton";
import "./Hero.css";

export default function Hero() {
  const { data: featured, loading, error } = useFeaturedArticles();

  return (
    <section className="hero">
      {/* Psychedelic background */}
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__orb hero__orb--1" />
        <div className="hero__orb hero__orb--2" />
        <div className="hero__orb hero__orb--3" />
        <div className="hero__grid" />
      </div>

      <div className="container hero__inner">
        {/* Masthead */}
        <div className="hero__masthead">
          <div className="hero__masthead-line" />
          <span className="hero__masthead-label">The Psychedelic Intelligence Network</span>
          <div className="hero__masthead-line" />
        </div>

        {loading && (
          <>
            <SkeletonHeroMain />
            <div className="hero__secondary">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </>
        )}

        {error && !loading && <ErrorMessage message="Could not load featured articles." />}

        {!loading && !error && featured && (() => {
          const [main, ...secondary] = featured;
          return (
            <>
              {main && (
                <div className="hero__main">
                  <a href="#article" className="hero__main-image-wrap">
                    <img
                      src={main.image}
                      alt={main.title}
                      className="hero__main-image"
                      loading="eager"
                    />
                    <div className="hero__main-image-overlay" />
                  </a>
                  <div className="hero__main-content">
                    <div className="hero__meta-row">
                      <CategoryBadge categoryId={main.category} />
                      <span className="hero__date">{main.date}</span>
                    </div>
                    <h1 className="hero__title">
                      <a href="#article">{main.title}</a>
                    </h1>
                    <p className="hero__excerpt">{main.excerpt}</p>
                    <div className="hero__author-row">
                      <div className="hero__author-avatar">
                        {main.author[0]}
                      </div>
                      <div>
                        <div className="hero__author-name">{main.author}</div>
                        <div className="hero__author-role">{main.authorRole} &bull; {main.readTime}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {secondary.length > 0 && (
                <div className="hero__secondary">
                  {secondary.map((article) => (
                    <a key={article.id} href="#article" className="hero__secondary-card">
                      <div className="hero__secondary-image-wrap">
                        <img src={article.image} alt={article.title} className="hero__secondary-image" />
                        <div className="hero__secondary-overlay" />
                      </div>
                      <div className="hero__secondary-content">
                        <CategoryBadge categoryId={article.category} size="sm" />
                        <h3 className="hero__secondary-title">{article.title}</h3>
                        <div className="hero__secondary-meta">
                          {article.author} &bull; {article.date}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>
    </section>
  );
}

// CategoryBadge reads from the article's category field.
// When Supabase is live we have category_color on the row; we also keep
// the local fallback color map for the static-data path.
const LOCAL_COLORS = {
  research: "#7C3AED",
  policy:   "#0EA5E9",
  culture:  "#F59E0B",
  events:   "#10B981",
  books:    "#EC4899",
  opinion:  "#EF4444",
};

const LOCAL_LABELS = {
  research: "Psychedelic Research",
  policy:   "Policy",
  culture:  "Culture",
  events:   "Events",
  books:    "Books",
  opinion:  "Opinion",
};

export function CategoryBadge({ categoryId, categoryColor, categoryLabel, size = "md" }) {
  const color = categoryColor || LOCAL_COLORS[categoryId] || "#7C3AED";
  const label = categoryLabel || LOCAL_LABELS[categoryId] || categoryId;
  return (
    <span
      className={`category-badge category-badge--${size}`}
      style={{ "--badge-color": color }}
    >
      {label}
    </span>
  );
}
