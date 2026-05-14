import { useSearchArticles } from "../hooks/useArticles";
import ArticleCard from "./ArticleCard";
import { SkeletonCard, ErrorMessage } from "./Skeleton";
import "./SearchResults.css";

export default function SearchResults({ query, onClear }) {
  const { data: results, loading, error } = useSearchArticles(query);

  return (
    <section className="search-results">
      <div className="container">
        <div className="search-results__header">
          <div className="search-results__meta">
            <h2 className="search-results__title">
              Search: <em>"{query}"</em>
            </h2>
            {!loading && results && (
              <p className="search-results__count">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </p>
            )}
          </div>
          <button className="search-results__clear" onClick={onClear}>
            &larr; Back to homepage
          </button>
        </div>

        {error && !loading && (
          <ErrorMessage message="Search failed. Please try again." />
        )}

        {!loading && !error && results && results.length === 0 && (
          <div className="search-results__empty">
            <p>No articles found for "{query}".</p>
            <button className="search-results__clear" onClick={onClear}>
              &larr; Return to homepage
            </button>
          </div>
        )}

        <div className="search-results__grid">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : results?.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
        </div>
      </div>
    </section>
  );
}
