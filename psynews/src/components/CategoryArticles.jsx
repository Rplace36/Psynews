import { useArticlesByCategory } from "../hooks/useArticles";
import ArticleCard from "./ArticleCard";
import { SkeletonCard } from "./Skeleton";

/**
 * Renders one category section, fetching its own articles.
 * Splitting this out avoids fetching all categories' articles in one hook.
 */
export default function CategoryArticles({ cat, alt }) {
  const { data: articles, loading } = useArticlesByCategory(cat.id, 3);

  // Don't render the section at all if there's nothing to show (after load)
  if (!loading && (!articles || articles.length === 0)) return null;

  return (
    <section
      id={cat.id}
      className={`category-section section-spacing ${alt ? "category-section--alt" : ""}`}
    >
      <div className="container">
        <div className="section-header">
          <div className="section-header__left">
            <span className="section-eyebrow" style={{ color: cat.color }}>
              Category
            </span>
            <h2 className="section-title">
              <span className="section-title__accent">{cat.label}</span>
            </h2>
          </div>
          <a href="#" className="section-view-all">
            All {cat.label} &rarr;
          </a>
        </div>

        <div className="category-section__divider" style={{ background: cat.color }} />

        <div className="category-section__grid">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : articles.map((article, idx) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant={idx === 0 && articles.length >= 2 ? "default" : "compact"}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
