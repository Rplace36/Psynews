import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./Admin.css";

const STATUS_OPTS = ["pending", "approved", "rejected", "spam"];
const STATUS_COLORS = { pending: "#F59E0B", approved: "#10B981", rejected: "#6b6985", spam: "#EF4444" };

export default function AdminComments() {
  const [comments, setComments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("pending");

  const load = () => {
    setLoading(true);
    supabase
      .from("comments")
      .select("id, author_name, body, status, created_at, article_id, articles(title, slug)")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setComments(data ?? []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    await supabase.from("comments").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  const deleteComment = async (id) => {
    if (!window.confirm("Delete this comment?")) return;
    await supabase.from("comments").delete().eq("id", id);
    load();
  };

  const filtered = filter === "all" ? comments : comments.filter((c) => c.status === filter);
  const counts   = STATUS_OPTS.reduce((acc, s) => ({ ...acc, [s]: comments.filter((c) => c.status === s).length }), {});

  return (
    <div className="admin-comments">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Comments</h1>
          <p className="admin-page-subtitle">{counts.pending} pending review</p>
        </div>
      </div>

      <div className="admin-filter-tabs" role="tablist">
        {["all", ...STATUS_OPTS].map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={`admin-tab ${filter === f ? "admin-tab--active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="admin-tab__count">{f === "all" ? comments.length : (counts[f] ?? 0)}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-table-skeleton">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton admin-row-skeleton" style={{ height: 80 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty"><p>No {filter === "all" ? "" : filter} comments.</p></div>
      ) : (
        <div className="admin-comments-list">
          {filtered.map((c) => (
            <div key={c.id} className="admin-comment-card">
              <div className="admin-comment-card__header">
                <div className="admin-comment-card__meta">
                  <strong>{c.author_name}</strong>
                  <span style={{ color: "var(--color-text-faint)", fontSize: "0.78rem" }}>
                    {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  {c.articles && (
                    <a
                      href={`/article/${c.articles.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-comment-article"
                    >
                      on: {c.articles.title}
                    </a>
                  )}
                </div>
                <span
                  className="admin-status-badge"
                  style={{ "--s-color": STATUS_COLORS[c.status] }}
                >
                  {c.status}
                </span>
              </div>
              <p className="admin-comment-card__body">{c.body}</p>
              <div className="admin-comment-card__actions">
                {c.status !== "approved" && (
                  <button className="admin-action-btn" style={{ color: "var(--color-emerald)" }} onClick={() => setStatus(c.id, "approved")} aria-label="Approve">✓ Approve</button>
                )}
                {c.status !== "rejected" && (
                  <button className="admin-action-btn" onClick={() => setStatus(c.id, "rejected")} aria-label="Reject">✕ Reject</button>
                )}
                {c.status !== "spam" && (
                  <button className="admin-action-btn" style={{ color: "var(--color-rose)" }} onClick={() => setStatus(c.id, "spam")} aria-label="Mark spam">⚑ Spam</button>
                )}
                <button className="admin-action-btn admin-action-btn--delete" onClick={() => deleteComment(c.id)} aria-label="Delete">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
