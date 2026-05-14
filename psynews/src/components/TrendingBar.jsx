import { Link } from "react-router-dom";
import { useTrendingArticles } from "../hooks/useArticles";
import { CategoryBadge } from "./Hero";
import "./TrendingBar.css";

const LOCAL_COLORS = {
  research: "#7C3AED", policy: "#0EA5E9", culture: "#F59E0B",
  events: "#10B981", books: "#EC4899", opinion: "#EF4444",
};

export default function TrendingBar() {
  const { data: articles, loading } = useTrendingArticles(5);

  return (
    <section className="trending-bar section-spacing" aria-labelledby="trending-heading">
      <div className="container">
        <div className="trending-bar__header">
          <span className="trending-bar__label" id="trending-heading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
            Trending Now
          </span>
        </div>
        <ol className="trending-bar__list" aria-labelledby="trending-heading">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="trending-item trending-item--skeleton" aria-hidden="true">
                  <span className="trending-item__number">{String(i + 1).padStart(2, "0")}</span>
                  <div className="trending-item__body">
                    <div className="skeleton skeleton--tag" style={{ width: 70 }} />
                    <div className="skeleton skeleton--title" style={{ marginTop: 8 }} />
                    <div className="skeleton skeleton--title" style={{ width: "70%" }} />
                  </div>
                </li>
              ))
            : (articles ?? []).map((article, i) => {
                const color = article._raw?.category_color || LOCAL_COLORS[article.category];
                const label = article._raw?.category_label;
                return (
                  <li key={article.id}>
                    <Link to={`/article/${article.slug}`} className="trending-item">
                      <span className="trending-item__number" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="trending-item__body">
                        <CategoryBadge
                          categoryId={article.category}
                          categoryColor={color}
                          categoryLabel={label}
                          size="sm"
                        />
                        <h3 className="trending-item__title">{article.title}</h3>
                        <div className="trending-item__meta">
                          <span>{article.readTime}</span> &bull;{" "}
                          <time dateTime={article._raw?.published_at}>{article.date}</time>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
        </ol>
      </div>
    </section>
  );
}
