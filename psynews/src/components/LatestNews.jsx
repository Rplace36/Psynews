import { useLatestArticles } from "../hooks/useArticles";
import ArticleCard from "./ArticleCard";
import { SkeletonCard, ErrorMessage } from "./Skeleton";
import "./LatestNews.css";

export default function LatestNews() {
  const { data: articles, loading, error } = useLatestArticles(6);

  return (
    <section className="latest-news section-spacing">
      <div className="container">
        <div className="section-header">
          <div className="section-header__left">
            <span className="section-eyebrow">Latest</span>
            <h2 className="section-title">Recent Stories</h2>
          </div>
          <a href="#" className="section-view-all">View all stories &rarr;</a>
        </div>

        {error && !loading && <ErrorMessage message="Could not load recent articles." />}

        <div className="latest-news__grid">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : articles?.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
        </div>
      </div>
    </section>
  );
}
