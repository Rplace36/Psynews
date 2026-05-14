import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import RichTextEditor from "../../components/admin/RichTextEditor";
import ImageUploader from "../../components/admin/ImageUploader";
import AiAssistant from "../../components/admin/AiAssistant";
import "./Admin.css";

const CATEGORIES = [
  { id: "research", label: "Psychedelic Research" },
  { id: "policy",   label: "Policy" },
  { id: "culture",  label: "Culture" },
  { id: "events",   label: "Events" },
  { id: "books",    label: "Books" },
  { id: "opinion",  label: "Opinion" },
];

const READ_TIMES = [
  "2 min read","3 min read","4 min read","5 min read","6 min read",
  "7 min read","8 min read","10 min read","12 min read","14 min read","15 min read",
];

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

const EMPTY_FORM = {
  title: "", slug: "", excerpt: "", body: "", image_url: "",
  category_id: "research", author_id: "", tags: "",
  featured: false, status: "draft", read_time: "5 min read",
  published_at: new Date().toISOString().slice(0, 16),
  seo_title: "", seo_description: "",
};

export default function AdminEditor() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { isEditor, isAdmin, role } = useAuth();
  const isEdit      = !!id;

  const [authors,    setAuthors]    = useState([]);
  const [loading,    setLoading]    = useState(isEdit);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState("");
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [slugManual, setSlugManual] = useState(false);

  // Load authors
  useEffect(() => {
    supabase.from("authors").select("id, name, role").order("name")
      .then(({ data }) => {
        setAuthors(data ?? []);
        if (!isEdit && data?.length) {
          setForm((f) => ({ ...f, author_id: data[0].id }));
        }
      });
  }, [isEdit]);

  // Load article for editing
  useEffect(() => {
    if (!isEdit) return;
    supabase.from("articles").select("*").eq("id", id).single()
      .then(({ data, error: err }) => {
        if (err || !data) { setError("Article not found."); setLoading(false); return; }
        setForm({
          ...EMPTY_FORM,
          ...data,
          tags: (data.tags ?? []).join(", "),
          status: data.status || (data.published ? "published" : "draft"),
          published_at: data.published_at
            ? new Date(data.published_at).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
          seo_title:       data.seo_title || "",
          seo_description: data.seo_description || "",
        });
        setSlugManual(true);
        setLoading(false);
      });
  }, [id, isEdit]);

  const set = (field, value) => {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "title" && !slugManual) next.slug = slugify(value);
      return next;
    });
    if (saved) setSaved(false);
  };

  // Contributor can only set draft
  const allowedStatuses = isEditor
    ? ["draft", "scheduled", "published"]
    : ["draft"];

  const handleSubmit = async (e, saveStatus) => {
    e?.preventDefault();
    const targetStatus = saveStatus || form.status;
    // Contributors can't publish
    if (!isEditor && targetStatus !== "draft") {
      setError("Contributors can only save drafts. An editor must publish.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      status: targetStatus,
      published: targetStatus === "published",
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      published_at: form.published_at
        ? new Date(form.published_at).toISOString()
        : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      seo_title:       form.seo_title || null,
      seo_description: form.seo_description || null,
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

  const statusColors = { draft: "#6b6985", scheduled: "#F59E0B", published: "#10B981" };

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
            <Link to={`/article/${form.slug}`} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn--ghost">
              Preview ↗
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="admin-form admin-form--editor" aria-label="Article editor">
        <div className="admin-editor__layout">

          {/* ── Main column ── */}
          <div className="admin-editor__main">

            {/* Title */}
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

            {/* Slug */}
            <div className="admin-field">
              <label htmlFor="ed-slug" className="admin-label">
                Slug <span className="admin-label__hint">— URL path, auto-generated from title</span>
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

            {/* Excerpt */}
            <div className="admin-field">
              <label htmlFor="ed-excerpt" className="admin-label">
                Excerpt <span className="admin-label__hint">— shown in cards and meta tags</span>
              </label>
              <textarea
                id="ed-excerpt"
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                className="admin-textarea"
                rows={3}
                placeholder="Brief summary…"
                required
              />
            </div>

            {/* Rich text editor */}
            <div className="admin-field">
              <span className="admin-label">Body</span>
              <RichTextEditor value={form.body} onChange={(v) => set("body", v)} />
            </div>

            {/* SEO fields */}
            <div className="admin-card">
              <h2 className="admin-card__title">SEO &amp; Social</h2>
              <div className="admin-field">
                <label htmlFor="ed-seo-title" className="admin-label">
                  SEO title <span className="admin-label__hint">— overrides page title tag (max 60 chars)</span>
                </label>
                <input
                  id="ed-seo-title"
                  type="text"
                  value={form.seo_title}
                  onChange={(e) => set("seo_title", e.target.value)}
                  className="admin-input"
                  maxLength={60}
                  placeholder="Leave blank to use article title"
                />
                <span className="admin-char-count">{form.seo_title.length}/60</span>
              </div>
              <div className="admin-field">
                <label htmlFor="ed-seo-desc" className="admin-label">
                  Meta description <span className="admin-label__hint">— max 155 chars</span>
                </label>
                <textarea
                  id="ed-seo-desc"
                  value={form.seo_description}
                  onChange={(e) => set("seo_description", e.target.value)}
                  className="admin-textarea"
                  rows={2}
                  maxLength={155}
                  placeholder="Leave blank to use excerpt"
                />
                <span className="admin-char-count">{form.seo_description.length}/155</span>
              </div>
            </div>

          </div>

          {/* ── Sidebar column ── */}
          <aside className="admin-editor__sidebar" aria-label="Article settings">

            {/* Publish card */}
            <div className="admin-card">
              <h2 className="admin-card__title">Publish</h2>

              {/* Status selector */}
              <div className="admin-field">
                <label htmlFor="ed-status" className="admin-label">Status</label>
                <select
                  id="ed-status"
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className="admin-select"
                  disabled={!isEditor}
                  aria-describedby={!isEditor ? "status-hint" : undefined}
                >
                  {allowedStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
                {!isEditor && (
                  <span id="status-hint" className="admin-label__hint" style={{ marginTop: 4, display: "block" }}>
                    Contributors can only save drafts
                  </span>
                )}
              </div>

              <div className="admin-status-indicator" style={{ "--s-color": statusColors[form.status] }}>
                <span className="admin-status-dot" />
                {form.status === "draft"     ? "Saved as draft, not visible publicly"     : ""}
                {form.status === "scheduled" ? "Will publish automatically at the set date" : ""}
                {form.status === "published" ? "Live and publicly visible"                 : ""}
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
                  disabled={!isEditor}
                />
              </div>

              <div className="admin-field" style={{ marginTop: 12 }}>
                <label htmlFor="ed-date" className="admin-label">
                  {form.status === "scheduled" ? "Publish at" : "Published date"}
                </label>
                <input
                  id="ed-date"
                  type="datetime-local"
                  value={form.published_at}
                  onChange={(e) => set("published_at", e.target.value)}
                  className="admin-input"
                />
              </div>

              {error && <p className="admin-error" role="alert">{error}</p>}
              {saved && <p className="admin-success" role="status">✓ Saved successfully</p>}

              <div className="admin-editor__save-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  disabled={saving}
                  onClick={() => handleSubmit(null, "draft")}
                >
                  Save draft
                </button>
                {isEditor && (
                  <button
                    type="submit"
                    className="admin-btn"
                    disabled={saving}
                  >
                    {saving ? "Saving…"
                      : form.status === "scheduled" ? "Schedule"
                      : form.status === "published"  ? "Save & publish"
                      : "Save"}
                  </button>
                )}
              </div>
            </div>

            {/* Metadata card */}
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
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
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
                  Tags <span className="admin-label__hint">— comma separated</span>
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

            {/* Image upload */}
            <ImageUploader
              value={form.image_url}
              onChange={(url) => set("image_url", url)}
            />

            {/* AI assistant */}
            <AiAssistant
              form={form}
              onApply={(field, value) => set(field, value)}
            />

          </aside>
        </div>
      </form>
    </div>
  );
}
