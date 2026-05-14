import { Link } from "react-router-dom";
import { CategoryBadge } from "./Hero";
import "./ArticleCard.css";

export default function ArticleCard({ article, variant = "default" }) {
  const categoryColor = article._raw?.category_color;
  const categoryLabel = article._raw?.category_label;
  const href = `/article/${article.slug}`;

  return (
    <article className={`article-card article-card--${variant}`} aria-label={article.title}>
      <Link to={href} className="article-card__image-wrap" tabIndex="-1" aria-hidden="true">
        <img
          src={article.image || "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&q=80"}
          alt=""
          className="article-card__image"
          loading="lazy"
          width="800"
          height="450"
        />
        <div className="article-card__image-overlay" />
      </Link>

      <div className="article-card__body">
        <div className="article-card__meta-top">
          <Link to={`/category/${article.category}`} className="article-card__cat-link" tabIndex="-1">
            <CategoryBadge
              categoryId={article.category}
              categoryColor={categoryColor}
              categoryLabel={categoryLabel}
              size="sm"
            />
          </Link>
          <time dateTime={article._raw?.published_at} className="article-card__date">
            {article.date}
          </time>
        </div>

        <h3 className="article-card__title">
          <Link to={href}>{article.title}</Link>
        </h3>

        {variant !== "compact" && (
          <p className="article-card__excerpt">{article.excerpt}</p>
        )}

        <div className="article-card__footer">
          <div className="article-card__author">
            <div className="article-card__avatar" aria-hidden="true">
              {article.author?.[0] ?? "?"}
            </div>
            <div className="article-card__author-info">
              <span className="article-card__author-name">{article.author}</span>
              <span className="article-card__read-time">{article.readTime}</span>
            </div>
          </div>

          {article.tags?.length > 0 && variant !== "compact" && (
            <div className="article-card__tags" aria-label="Tags">
              {(article.tags ?? []).slice(0, 2).map((tag) => (
                <Link
                  key={tag}
                  to={`/search?q=${encodeURIComponent(tag)}`}
                  className="article-card__tag"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
