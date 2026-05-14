import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./CommentsSection.css";

export default function CommentsSection({ articleId }) {
  const [comments,  setComments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [form, setForm] = useState({ name: "", body: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!articleId) return;
    supabase
      .from("comments")
      .select("id, author_name, body, created_at")
      .eq("article_id", articleId)
      .eq("status", "approved")
      .order("created_at", { ascending: true })
      .then(({ data }) => { setComments(data ?? []); setLoading(false); });
  }, [articleId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.body.trim()) {
      setError("Please fill in your name and comment.");
      return;
    }
    if (form.body.length > 2000) {
      setError("Comment is too long (max 2000 characters).");
      return;
    }
    setSubmitting(true);
    setError("");
    const { error: err } = await supabase.from("comments").insert({
      article_id:   articleId,
      author_name:  form.name.trim(),
      body:         form.body.trim(),
      status:       "pending",
    });
    setSubmitting(false);
    if (err) { setError("Failed to submit. Please try again."); return; }
    setSubmitted(true);
    setForm({ name: "", body: "" });
  };

  return (
    <section className="comments-section section-spacing" aria-labelledby="comments-heading">
      <div className="container comments-inner">
        <h2 className="comments-title" id="comments-heading">
          Discussion
          {!loading && comments.length > 0 && (
            <span className="comments-count">{comments.length}</span>
          )}
        </h2>

        {/* Comment list */}
        {loading ? (
          <div className="comments-loading" aria-label="Loading comments">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="comment-skeleton">
                <div className="skeleton skeleton--avatar" />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton--author" style={{ marginBottom: 8 }} />
                  <div className="skeleton skeleton--text" />
                  <div className="skeleton skeleton--text skeleton--text-short" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="comments-empty">No comments yet. Be the first to share your thoughts.</p>
        ) : (
          <ol className="comments-list">
            {comments.map((c) => (
              <li key={c.id} className="comment">
                <div className="comment__avatar" aria-hidden="true">
                  {c.author_name[0]?.toUpperCase()}
                </div>
                <div className="comment__body">
                  <div className="comment__meta">
                    <strong className="comment__author">{c.author_name}</strong>
                    <time
                      className="comment__date"
                      dateTime={c.created_at}
                    >
                      {new Date(c.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </time>
                  </div>
                  <p className="comment__text">{c.body}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {/* Submission form */}
        <div className="comments-form-wrap">
          <h3 className="comments-form-title">Leave a comment</h3>
          <p className="comments-form-note">
            Comments are reviewed before publication. Please keep discussion civil and on-topic.
          </p>

          {submitted ? (
            <div className="comments-success" role="status">
              <span aria-hidden="true">✓</span>
              Thanks for your comment! It will appear after moderation.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="comments-form" aria-label="Comment form" noValidate>
              <div className="comments-form__row">
                <div className="admin-field">
                  <label htmlFor="comment-name" className="admin-label">Name <span aria-hidden="true">*</span></label>
                  <input
                    id="comment-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="admin-input"
                    placeholder="Your name"
                    maxLength={80}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
              <div className="admin-field">
                <label htmlFor="comment-body" className="admin-label">
                  Comment <span aria-hidden="true">*</span>
                  <span className="admin-label__hint"> — {form.body.length}/2000</span>
                </label>
                <textarea
                  id="comment-body"
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  className="admin-textarea"
                  rows={4}
                  placeholder="Share your thoughts…"
                  maxLength={2000}
                  required
                />
              </div>
              {error && <p className="admin-error" role="alert">{error}</p>}
              <button type="submit" className="comments-submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Post comment"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
