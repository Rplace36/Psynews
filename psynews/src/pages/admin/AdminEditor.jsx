import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "./Admin.css";

const CATEGORIES = [
  { id: "research", label: "Psychedelic Research" },
  { id: "policy",   label: "Policy" },
  { id: "culture",  label: "Culture" },
  { id: "events",   label: "Events" },
  { id: "books",    label: "Books" },
  { id: "opinion",  label: "Opinion" },
];

const READ_TIMES = ["2 min read","3 min read","4 min read","5 min read","6 min read","7 min read","8 min read","10 min read","12 min read","14 min read","15 min read"];

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function AdminEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    body: "",
    image_url: "",
    category_id: "research",
    author_id: "",
    tags: "",
    featured: false,
    published: false,
    read_time: "5 min read",
    published_at: new Date().toISOString().slice(0, 16),
  });

  const [slugManual, setSlugManual] = useState(false);

  // Load authors
  useEffect(() => {
    supabase.from("authors").select("id, name, role").order("name").then(({ data }) => {
      setAuthors(data ?? []);
      if (!isEdit && data?.length) {
        setForm((f) => ({ ...f, author_id: data[0].id }));
      }
    });
  }, [isEdit]);

  // Load article for editing
  useEffect(() => {
    if (!isEdit) return;
    supabase.from("articles").select("*").eq("id", id).single().then(({ data, error: err }) => {
      if (err || !data) { setError("Article not found."); setLoading(false); return; }
      setForm({
        ...data,
        tags: (data.tags ?? []).join(", "),
        published_at: data.published_at
          ? new Date(data.published_at).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
      });
      setSlugManual(true);
      setLoading(false);
    });
  }, [id, isEdit]);

  const set = (field, value) => {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "title" && !slugManual) {
        next.slug = slugify(value);
      }
      return next;
    });
    if (saved) setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      published_at: form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    delete payload.id;

    let err;
    if (isEdit) {
      ({ error: err } = await supabase.from("articles").update(payload).eq("id", id));
    } else {
      ({ error: err } = await supabase.from("articles").insert(payload));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    if (!isEdit) navigate("/admin");
  };

  if (loading) return <div className="admin-editor-loading"><div className="admin-loading__spinner" /></div>;

  return (
    <div className="admin-editor">
      <div className="admin-page-header">
        <div>
          <nav className="admin-breadcrumb" aria-label="Breadcrumb">
            <Link to="/admin">Dashboard</Link> / {isEdit ? "Edit article" : "New article"}
          </nav>
          <h1 className="admin-page-title">{isEdit ? "Edit article" : "New article"}</h1>
        </div>
        <div className="admin-page-header__actions">
          {isEdit && form.slug && (
            <Link
              to={`/article/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn--ghost"
            >
              Preview ↗
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="admin-form admin-form--editor" aria-label="Article editor">
        <div className="admin-editor__layout">
          {/* Main column */}
          <div className="admin-editor__main">
            <div className="admin-field">
              <label htmlFor="ed-title" className="admin-label">Title <span aria-hidden="true">*</span></label>
              <input
                id="ed-title"
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="admin-input admin-input--lg"
                placeholder="Article headline…"
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="ed-slug" className="admin-label">
                Slug <span aria-hidden="true">*</span>
                <span className="admin-label__hint"> — URL path</span>
              </label>
              <input
                id="ed-slug"
                type="text"
                value={form.slug}
                onChange={(e) => { setSlugManual(true); set("slug", e.target.value); }}
                className="admin-input admin-input--mono"
                placeholder="article-slug-here"
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="ed-excerpt" className="admin-label">
                Excerpt <span aria-hidden="true">*</span>
                <span className="admin-label__hint"> — shown in cards and meta tags</span>
              </label>
              <textarea
                id="ed-excerpt"
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                className="admin-textarea"
                rows={3}
                placeholder="Brief summary of the article…"
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="ed-body" className="admin-label">
                Body
                <span className="admin-label__hint"> — HTML or plain text</span>
              </label>
              <textarea
                id="ed-body"
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
                className="admin-textarea admin-textarea--body"
                rows={20}
                placeholder="<p>Article body HTML…</p>"
              />
            </div>
          </div>

          {/* Sidebar column */}
          <aside className="admin-editor__sidebar" aria-label="Article settings">
            {/* Publish */}
            <div className="admin-card">
              <h2 className="admin-card__title">Publish</h2>
              <div className="admin-toggle-row">
                <label htmlFor="ed-published" className="admin-toggle-label">Published</label>
                <input
                  id="ed-published"
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => set("published", e.target.checked)}
                  className="admin-toggle"
                  role="switch"
                  aria-checked={form.published}
                />
              </div>
              <div className="admin-toggle-row">
                <label htmlFor="ed-featured" className="admin-toggle-label">Featured</label>
                <input
                  id="ed-featured"
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="admin-toggle"
                  role="switch"
                  aria-checked={form.featured}
                />
              </div>
              <div className="admin-field" style={{ marginTop: 16 }}>
                <label htmlFor="ed-date" className="admin-label">Publish date</label>
                <input
                  id="ed-date"
                  type="datetime-local"
                  value={form.published_at}
                  onChange={(e) => set("published_at", e.target.value)}
                  className="admin-input"
                />
              </div>
              {error && <p className="admin-error" role="alert">{error}</p>}
              {saved && <p className="admin-success" role="status">Saved successfully!</p>}
              <button
                type="submit"
                className="admin-btn admin-btn--full"
                disabled={saving}
              >
                {saving ? "Saving…" : isEdit ? "Save changes" : "Publish article"}
              </button>
            </div>

            {/* Metadata */}
            <div className="admin-card">
              <h2 className="admin-card__title">Metadata</h2>
              <div className="admin-field">
                <label htmlFor="ed-category" className="admin-label">Category</label>
                <select
                  id="ed-category"
                  value={form.category_id}
                  onChange={(e) => set("category_id", e.target.value)}
                  className="admin-select"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="admin-field">
                <label htmlFor="ed-author" className="admin-label">Author</label>
                <select
                  id="ed-author"
                  value={form.author_id}
                  onChange={(e) => set("author_id", e.target.value)}
                  className="admin-select"
                  required
                >
                  <option value="">— Select author —</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                  ))}
                </select>
              </div>
              <div className="admin-field">
                <label htmlFor="ed-read-time" className="admin-label">Read time</label>
                <select
                  id="ed-read-time"
                  value={form.read_time}
                  onChange={(e) => set("read_time", e.target.value)}
                  className="admin-select"
                >
                  {READ_TIMES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label htmlFor="ed-tags" className="admin-label">
                  Tags
                  <span className="admin-label__hint"> — comma separated</span>
                </label>
                <input
                  id="ed-tags"
                  type="text"
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  className="admin-input"
                  placeholder="Psilocybin, Research, FDA"
                />
              </div>
            </div>

            {/* Image */}
            <div className="admin-card">
              <h2 className="admin-card__title">Cover image</h2>
              <div className="admin-field">
                <label htmlFor="ed-image" className="admin-label">Image URL</label>
                <input
                  id="ed-image"
                  type="url"
                  value={form.image_url}
                  onChange={(e) => set("image_url", e.target.value)}
                  className="admin-input"
                  placeholder="https://images.unsplash.com/…"
                />
              </div>
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="Cover preview"
                  className="admin-image-preview"
                  onError={(e) => e.target.style.display = "none"}
                />
              )}
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
