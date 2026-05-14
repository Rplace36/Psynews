import { getCategoryById } from "../data/articles";
import "./ArticleCard.css";

export default function ArticleCard({ article, variant = "default" }) {
  const cat = getCategoryById(article.category);

  return (
    <article className={`article-card article-card--${variant}`}>
      <a href="#article" className="article-card__image-wrap">
        <img
          src={article.image}
          alt={article.title}
          className="article-card__image"
          loading="lazy"
        />
        <div className="article-card__image-overlay" />
      </a>

      <div className="article-card__body">
        <div className="article-card__meta-top">
          {cat && (
            <span
              className="article-card__cat"
              style={{ "--cat-color": cat.color }}
            >
              {cat.label}
            </span>
          )}
          <span className="article-card__date">{article.date}</span>
        </div>

        <h3 className="article-card__title">
          <a href="#article">{article.title}</a>
        </h3>

        {variant !== "compact" && (
          <p className="article-card__excerpt">{article.excerpt}</p>
        )}

        <div className="article-card__footer">
          <div className="article-card__author">
            <div className="article-card__avatar">
              {article.author[0]}
            </div>
            <div className="article-card__author-info">
              <span className="article-card__author-name">{article.author}</span>
              <span className="article-card__read-time">{article.readTime}</span>
            </div>
          </div>

          {article.tags && variant !== "compact" && (
            <div className="article-card__tags">
              {article.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="article-card__tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
