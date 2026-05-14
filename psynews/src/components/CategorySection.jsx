import { categories, getArticlesByCategory } from "../data/articles";
import ArticleCard from "./ArticleCard";
import "./CategorySection.css";

export default function CategorySection() {
  return (
    <div className="categories-wrapper">
      {categories.map((cat, i) => {
        const catArticles = getArticlesByCategory(cat.id).slice(0, 3);
        if (catArticles.length === 0) return null;
        return (
          <section
            key={cat.id}
            id={cat.id}
            className={`category-section section-spacing ${i % 2 === 1 ? "category-section--alt" : ""}`}
          >
            <div className="container">
              <div className="section-header">
                <div className="section-header__left">
                  <span className="section-eyebrow" style={{ color: cat.color }}>
                    Category
                  </span>
                  <h2 className="section-title" style={{ "--title-accent": cat.color }}>
                    <span className="section-title__accent">{cat.label}</span>
                  </h2>
                </div>
                <a href="#" className="section-view-all">
                  All {cat.label} &rarr;
                </a>
              </div>

              <div className="category-section__divider" style={{ background: cat.color }} />

              <div className="category-section__grid">
                {catArticles.map((article, idx) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant={idx === 0 && catArticles.length >= 2 ? "default" : "compact"}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
