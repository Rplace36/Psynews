import { Link } from "react-router-dom";
import { useArticlesByCategory } from "../hooks/useArticles";
import ArticleCard from "./ArticleCard";
import { SkeletonCard } from "./Skeleton";

export default function CategoryArticles({ cat, alt }) {
  const { data: articles, loading } = useArticlesByCategory(cat.id, 3);

  if (!loading && (!articles || articles.length === 0)) return null;

  return (
    <section
      id={cat.id}
      className={`category-section section-spacing ${alt ? "category-section--alt" : ""}`}
      aria-labelledby={`cat-heading-${cat.id}`}
    >
      <div className="container">
        <div className="section-header">
          <div className="section-header__left">
            <span className="section-eyebrow" style={{ color: cat.color }}>Category</span>
            <h2 className="section-title" id={`cat-heading-${cat.id}`}>
              <span className="section-title__accent">{cat.label}</span>
            </h2>
          </div>
          <Link to={`/category/${cat.id}`} className="section-view-all">
            All {cat.label} &rarr;
          </Link>
        </div>

        <div className="category-section__divider" style={{ background: cat.color }} aria-hidden="true" />

        <div className="category-section__grid">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : (articles ?? []).map((article, idx) => (
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
