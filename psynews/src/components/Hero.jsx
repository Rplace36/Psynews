import { Link } from "react-router-dom";
import { useFeaturedArticles } from "../hooks/useArticles";
import { SkeletonHeroMain, SkeletonCard, ErrorMessage } from "./Skeleton";
import "./Hero.css";

export default function Hero() {
  const { data: featured, loading, error } = useFeaturedArticles();

  return (
    <section className="hero" aria-label="Featured stories">
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__orb hero__orb--1" />
        <div className="hero__orb hero__orb--2" />
        <div className="hero__orb hero__orb--3" />
        <div className="hero__grid" />
      </div>

      <div className="container hero__inner">
        <div className="hero__masthead" aria-hidden="true">
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
                  <Link to={`/article/${main.slug}`} className="hero__main-image-wrap">
                    <img
                      src={main.image}
                      alt={`Cover image for "${main.title}"`}
                      className="hero__main-image"
                      loading="eager"
                      width="800"
                      height="600"
                    />
                    <div className="hero__main-image-overlay" aria-hidden="true" />
                  </Link>
                  <div className="hero__main-content">
                    <div className="hero__meta-row">
                      <CategoryBadge
                        categoryId={main.category}
                        categoryColor={main._raw?.category_color}
                        categoryLabel={main._raw?.category_label}
                      />
                      <time dateTime={main._raw?.published_at} className="hero__date">
                        {main.date}
                      </time>
                    </div>
                    <h1 className="hero__title">
                      <Link to={`/article/${main.slug}`}>{main.title}</Link>
                    </h1>
                    <p className="hero__excerpt">{main.excerpt}</p>
                    <div className="hero__author-row">
                      <div className="hero__author-avatar" aria-hidden="true">
                        {main.author?.[0] ?? "?"}
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
                    <Link key={article.id} to={`/article/${article.slug}`} className="hero__secondary-card">
                      <div className="hero__secondary-image-wrap">
                        <img
                          src={article.image}
                          alt={`Cover for "${article.title}"`}
                          className="hero__secondary-image"
                        />
                        <div className="hero__secondary-overlay" aria-hidden="true" />
                      </div>
                      <div className="hero__secondary-content">
                        <CategoryBadge
                          categoryId={article.category}
                          categoryColor={article._raw?.category_color}
                          categoryLabel={article._raw?.category_label}
                          size="sm"
                        />
                        <h2 className="hero__secondary-title">{article.title}</h2>
                        <div className="hero__secondary-meta">
                          <span>{article.author}</span> &bull; <time dateTime={article._raw?.published_at}>{article.date}</time>
                        </div>
                      </div>
                    </Link>
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

const LOCAL_COLORS = {
  research: "#7C3AED", policy: "#0EA5E9", culture: "#F59E0B",
  events: "#10B981", books: "#EC4899", opinion: "#EF4444",
};
const LOCAL_LABELS = {
  research: "Psychedelic Research", policy: "Policy", culture: "Culture",
  events: "Events", books: "Books", opinion: "Opinion",
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
