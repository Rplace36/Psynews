import { articles, getCategoryById } from "../data/articles";
import ArticleCard from "./ArticleCard";
import "./SearchResults.css";

export default function SearchResults({ query, onClear }) {
  const q = query.toLowerCase();
  const results = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q)) ||
      getCategoryById(a.category)?.label.toLowerCase().includes(q)
  );

  return (
    <section className="search-results">
      <div className="container">
        <div className="search-results__header">
          <div className="search-results__meta">
            <h2 className="search-results__title">
              Search: <em>"{query}"</em>
            </h2>
            <p className="search-results__count">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <button className="search-results__clear" onClick={onClear}>
            &larr; Back to homepage
          </button>
        </div>

        {results.length > 0 ? (
          <div className="search-results__grid">
            {results.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="search-results__empty">
            <p>No articles found for "{query}".</p>
            <button className="search-results__clear" onClick={onClear}>
              &larr; Return to homepage
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
