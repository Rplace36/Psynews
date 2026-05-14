import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "./Admin.css";

export default function AdminDashboard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState("all"); // all | published | draft

  const load = () => {
    setLoading(true);
    supabase
      .from("articles")
      .select("id, title, slug, category_id, published, featured, published_at, read_time")
      .order("published_at", { ascending: false })
      .then(({ data }) => { setArticles(data ?? []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const togglePublish = async (article) => {
    await supabase
      .from("articles")
      .update({ published: !article.published })
      .eq("id", article.id);
    load();
  };

  const toggleFeatured = async (article) => {
    await supabase
      .from("articles")
      .update({ featured: !article.featured })
      .eq("id", article.id);
    load();
  };

  const deleteArticle = async (id) => {
    if (!window.confirm("Delete this article? This cannot be undone.")) return;
    setDeleting(id);
    await supabase.from("articles").delete().eq("id", id);
    setDeleting(null);
    load();
  };

  const filtered = articles.filter((a) => {
    if (filter === "published") return a.published;
    if (filter === "draft") return !a.published;
    return true;
  });

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Articles</h1>
          <p className="admin-page-subtitle">{articles.length} total articles</p>
        </div>
        <Link to="/admin/new" className="admin-btn">+ New Article</Link>
      </div>

      {/* Filter tabs */}
      <div className="admin-filter-tabs" role="tablist">
        {["all", "published", "draft"].map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={`admin-tab ${filter === f ? "admin-tab--active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="admin-tab__count">
              {f === "all" ? articles.length
               : f === "published" ? articles.filter((a) => a.published).length
               : articles.filter((a) => !a.published).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-table-skeleton">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton admin-row-skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <p>No articles yet. <Link to="/admin/new">Create your first article →</Link></p>
        </div>
      ) : (
        <div className="admin-table-wrap" role="region" aria-label="Articles table">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
                <th scope="col">Featured</th>
                <th scope="col">Date</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((article) => (
                <tr key={article.id} className={deleting === article.id ? "admin-row--deleting" : ""}>
                  <td className="admin-table__title">
                    <Link to={`/admin/edit/${article.id}`} className="admin-table__link">
                      {article.title}
                    </Link>
                    <span className="admin-table__slug">{article.slug}</span>
                  </td>
                  <td>
                    <span className="admin-badge">{article.category_id}</span>
                  </td>
                  <td>
                    <button
                      className={`admin-status-btn ${article.published ? "admin-status-btn--live" : "admin-status-btn--draft"}`}
                      onClick={() => togglePublish(article)}
                      aria-label={article.published ? "Unpublish article" : "Publish article"}
                    >
                      {article.published ? "Live" : "Draft"}
                    </button>
                  </td>
                  <td>
                    <button
                      className={`admin-featured-btn ${article.featured ? "admin-featured-btn--on" : ""}`}
                      onClick={() => toggleFeatured(article)}
                      aria-label={article.featured ? "Remove from featured" : "Set as featured"}
                      title={article.featured ? "Featured" : "Not featured"}
                    >
                      {article.featured ? "★" : "☆"}
                    </button>
                  </td>
                  <td className="admin-table__date">
                    {article.published_at
                      ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="admin-table__actions">
                    <Link
                      to={`/article/${article.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-action-btn"
                      aria-label="View article"
                      title="View"
                    >
                      ↗
                    </Link>
                    <Link
                      to={`/admin/edit/${article.id}`}
                      className="admin-action-btn"
                      aria-label="Edit article"
                      title="Edit"
                    >
                      ✎
                    </Link>
                    <button
                      className="admin-action-btn admin-action-btn--delete"
                      onClick={() => deleteArticle(article.id)}
                      disabled={deleting === article.id}
                      aria-label="Delete article"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
