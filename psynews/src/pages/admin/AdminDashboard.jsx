import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import "./Admin.css";

const FILTERS = ["all", "published", "scheduled", "draft"];
const STATUS_COLORS = { published: "#10B981", scheduled: "#F59E0B", draft: "#6b6985" };

export default function AdminDashboard() {
  const { isAdmin, isEditor } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [filter,   setFilter]   = useState("all");
  const [stats,    setStats]    = useState({ total: 0, published: 0, scheduled: 0, draft: 0, views: 0 });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("articles")
      .select("id, title, slug, category_id, published, status, featured, published_at, read_time, view_count")
      .order("published_at", { ascending: false });

    const rows = data ?? [];
    setArticles(rows);
    setStats({
      total:     rows.length,
      published: rows.filter((a) => a.status === "published").length,
      scheduled: rows.filter((a) => a.status === "scheduled").length,
      draft:     rows.filter((a) => a.status === "draft").length,
      views:     rows.reduce((s, a) => s + (a.view_count || 0), 0),
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Auto-publish scheduled articles client-side trigger
  useEffect(() => {
    supabase.rpc("publish_scheduled_articles").then(() => load());
  }, []);

  const setStatus = async (article, newStatus) => {
    await supabase.from("articles").update({
      status:    newStatus,
      published: newStatus === "published",
      updated_at: new Date().toISOString(),
    }).eq("id", article.id);
    load();
  };

  const toggleFeatured = async (article) => {
    await supabase.from("articles").update({ featured: !article.featured }).eq("id", article.id);
    load();
  };

  const deleteArticle = async (id) => {
    if (!window.confirm("Delete this article? This cannot be undone.")) return;
    setDeleting(id);
    await supabase.from("articles").delete().eq("id", id);
    setDeleting(null);
    load();
  };

  const filtered = articles.filter((a) => filter === "all" || a.status === filter);

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Editorial overview</p>
        </div>
        <div className="admin-page-header__actions">
          <Link to="/admin/new" className="admin-btn">+ New Article</Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="admin-stats-row" aria-label="Publication statistics">
        {[
          { label: "Total articles", value: stats.total },
          { label: "Published",      value: stats.published, color: "#10B981" },
          { label: "Scheduled",      value: stats.scheduled, color: "#F59E0B" },
          { label: "Drafts",         value: stats.draft,     color: "#6b6985" },
          { label: "Total views",    value: stats.views.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="admin-stat-card">
            <div className="admin-stat-value" style={{ color: s.color || "inherit" }}>{s.value}</div>
            <div className="admin-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="admin-filter-tabs" role="tablist" aria-label="Filter articles by status">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={`admin-tab ${filter === f ? "admin-tab--active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="admin-tab__count">
              {f === "all" ? stats.total : stats[f] ?? 0}
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
          <p>No articles in this status. <Link to="/admin/new">Create one →</Link></p>
        </div>
      ) : (
        <div className="admin-table-wrap" role="region" aria-label="Articles">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
                <th scope="col">Featured</th>
                <th scope="col">Views</th>
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
                  <td><span className="admin-badge">{article.category_id}</span></td>
                  <td>
                    {isEditor ? (
                      <select
                        value={article.status || (article.published ? "published" : "draft")}
                        onChange={(e) => setStatus(article, e.target.value)}
                        className="admin-status-select"
                        aria-label={`Status for ${article.title}`}
                        style={{ "--s-color": STATUS_COLORS[article.status || "draft"] }}
                      >
                        {FILTERS.filter((f) => f !== "all").map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="admin-status-badge" style={{ "--s-color": STATUS_COLORS[article.status || "draft"] }}>
                        {(article.status || "draft")}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className={`admin-featured-btn ${article.featured ? "admin-featured-btn--on" : ""}`}
                      onClick={() => toggleFeatured(article)}
                      aria-label={article.featured ? "Remove from featured" : "Set as featured"}
                      disabled={!isEditor}
                      title={article.featured ? "Featured" : "Not featured"}
                    >
                      {article.featured ? "★" : "☆"}
                    </button>
                  </td>
                  <td className="admin-table__views">
                    {(article.view_count || 0).toLocaleString()}
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
                      title="View live"
                    >↗</Link>
                    <Link
                      to={`/admin/edit/${article.id}`}
                      className="admin-action-btn"
                      aria-label="Edit article"
                      title="Edit"
                    >✎</Link>
                    {isAdmin && (
                      <button
                        className="admin-action-btn admin-action-btn--delete"
                        onClick={() => deleteArticle(article.id)}
                        disabled={deleting === article.id}
                        aria-label="Delete article"
                        title="Delete"
                      >✕</button>
                    )}
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
