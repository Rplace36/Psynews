import { useState } from "react";
import { Link } from "react-router-dom";
import { useLatestArticles, useFeaturedArticles, useAllArticles } from "../hooks/useArticles";
import ArticleCard from "./ArticleCard";
import { SkeletonCard } from "./Skeleton";
import "./LatestNews.css";

const TABS = [
  { id: "latest",   label: "Latest" },
  { id: "featured", label: "Featured" },
  { id: "mostread", label: "Most Read" },
];

export default function LatestNews() {
  const [tab, setTab] = useState("latest");

  const { data: latest,   loading: lL } = useLatestArticles(6);
  const { data: featured, loading: lF } = useFeaturedArticles();
  // "Most read" = all articles sorted by published_at desc as a proxy
  // (extend with a view_count column later)
  const { data: all,      loading: lA } = useAllArticles();

  const mostRead = [...(all ?? [])]
    .sort((a, b) => new Date(b._raw?.published_at) - new Date(a._raw?.published_at))
    .slice(0, 6);

  const articles = tab === "latest" ? latest : tab === "featured" ? featured : mostRead;
  const loading  = tab === "latest" ? lL : tab === "featured" ? lF : lA;

  return (
    <section className="latest-news section-spacing" aria-labelledby="latest-heading">
      <div className="container">
        <div className="section-header">
          <div className="section-header__left">
            <span className="section-eyebrow">Stories</span>
            <h2 className="section-title" id="latest-heading">
              {TABS.find((t) => t.id === tab)?.label}
            </h2>
          </div>
          <Link to="/category/research" className="section-view-all">
            View all stories &rarr;
          </Link>
        </div>

        {/* Tabs */}
        <div className="latest-tabs" role="tablist" aria-label="Article collections">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`tabpanel-${t.id}`}
              className={`latest-tab ${tab === t.id ? "latest-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`tabpanel-${tab}`}
          aria-labelledby={`tab-${tab}`}
        >
          <div className="latest-news__grid">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : (articles ?? []).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}
