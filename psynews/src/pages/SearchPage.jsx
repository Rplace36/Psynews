import { useSearchParams, Link } from "react-router-dom";
import { useEffect } from "react";
import SEO from "../components/SEO";
import ArticleCard from "../components/ArticleCard";
import { SkeletonCard } from "../components/Skeleton";
import { useSearchArticles } from "../hooks/useArticles";
import "./SearchPage.css";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { data: results, loading } = useSearchArticles(query);

  useEffect(() => { window.scrollTo(0, 0); }, [query]);

  return (
    <>
      <SEO title={query ? `Search: "${query}"` : "Search"} />

      <section className="search-page">
        <div className="search-page__header">
          <div className="container">
            <nav className="article-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">Search</span>
            </nav>
            <h1 className="search-page__title">
              {query ? <>Results for <em>"{query}"</em></> : "Search PsyNews"}
            </h1>
            {!loading && query && (
              <p className="search-page__count" aria-live="polite">
                {results.length} article{results.length !== 1 ? "s" : ""} found
              </p>
            )}
          </div>
        </div>

        <div className="container search-page__body">
          {loading && (
            <div className="search-page__grid">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <div className="search-page__empty">
              <p>No articles found for "{query}".</p>
              <Link to="/" className="btn-secondary">← Back to homepage</Link>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="search-page__grid">
              {results.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
