import { articles } from "../data/articles";
import ArticleCard from "./ArticleCard";
import "./LatestNews.css";

export default function LatestNews() {
  // Show non-featured articles as latest
  const latest = articles.filter((a) => !a.featured).slice(0, 6);

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

        <div className="latest-news__grid">
          {latest.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
