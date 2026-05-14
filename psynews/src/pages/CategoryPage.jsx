import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import SEO from "../components/SEO";
import ArticleCard from "../components/ArticleCard";
import { SkeletonCard } from "../components/Skeleton";
import Newsletter from "../components/Newsletter";
import { fetchArticlesByCategory, fetchCategories } from "../lib/articleService";
import { categoryMeta } from "../lib/seo";
import "./CategoryPage.css";

const LOCAL_COLORS = {
  research: "#7C3AED", policy: "#0EA5E9", culture: "#F59E0B",
  events: "#10B981", books: "#EC4899", opinion: "#EF4444",
};

export default function CategoryPage() {
  const { categoryId } = useParams();
  const [articles, setArticles] = useState([]);
  const [cat, setCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allCats, setAllCats] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    Promise.all([
      fetchArticlesByCategory(categoryId, 24),
      fetchCategories(),
    ]).then(([{ data: arts }, { data: cats }]) => {
      setArticles(arts ?? []);
      setAllCats(cats ?? []);
      const found = (cats ?? []).find((c) => c.id === categoryId);
      setCat(found || { id: categoryId, label: categoryId, color: LOCAL_COLORS[categoryId] || "#7C3AED" });
      setLoading(false);
    });
  }, [categoryId]);

  const meta = cat ? categoryMeta(cat) : {};

  return (
    <>
      {cat && (
        <SEO
          title={cat.label}
          description={meta.description}
          url={meta.url}
        />
      )}

      <div className="category-page">
        {/* Header */}
        <header className="category-page__header">
          <div className="category-page__header-bg" aria-hidden="true" />
          <div className="container category-page__header-inner">
            <nav className="article-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">{cat?.label || categoryId}</span>
            </nav>
            <div
              className="category-page__accent"
              style={{ background: cat?.color || LOCAL_COLORS[categoryId] }}
            />
            <h1 className="category-page__title">{cat?.label || categoryId}</h1>
            <p className="category-page__desc">
              Latest {cat?.label} coverage from PsyNews — the psychedelic intelligence network.
            </p>
          </div>
        </header>

        {/* Category nav pills */}
        <div className="category-page__nav" role="navigation" aria-label="Browse categories">
          <div className="container category-page__nav-inner">
            {allCats.map((c) => (
              <Link
                key={c.id}
                to={`/category/${c.id}`}
                className={`cat-pill ${c.id === categoryId ? "cat-pill--active" : ""}`}
                style={{ "--pill-color": c.color }}
                aria-current={c.id === categoryId ? "page" : undefined}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Grid */}
        <section className="category-page__grid-wrap section-spacing">
          <div className="container">
            {loading ? (
              <div className="category-page__grid">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : articles.length === 0 ? (
              <p className="category-page__empty">No articles found in this category yet.</p>
            ) : (
              <div className="category-page__grid">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        </section>

        <Newsletter />
      </div>
    </>
  );
}
