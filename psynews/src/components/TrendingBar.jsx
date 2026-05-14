import { articles } from "../data/articles";
import { getCategoryById } from "../data/articles";
import "./TrendingBar.css";

export default function TrendingBar() {
  const trending = articles.slice(0, 5);

  return (
    <section className="trending-bar section-spacing">
      <div className="container">
        <div className="trending-bar__header">
          <span className="trending-bar__label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
            Trending Now
          </span>
        </div>
        <div className="trending-bar__list">
          {trending.map((article, i) => {
            const cat = getCategoryById(article.category);
            return (
              <a key={article.id} href="#article" className="trending-item">
                <span className="trending-item__number">{String(i + 1).padStart(2, "0")}</span>
                <div className="trending-item__body">
                  {cat && (
                    <span
                      className="trending-item__cat"
                      style={{ color: cat.color }}
                    >
                      {cat.label}
                    </span>
                  )}
                  <h4 className="trending-item__title">{article.title}</h4>
                  <span className="trending-item__meta">{article.readTime} &bull; {article.date}</span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
