import { useState } from "react";
import {
  generateExcerpt,
  suggestTags,
  generateSeoTitle,
  generateSeoDescription,
  suggestHeadlines,
  generateSummary,
} from "../../lib/aiTools";
import "./AiAssistant.css";

const TOOLS = [
  { id: "excerpt",     label: "Generate excerpt",       icon: "✍" },
  { id: "tags",        label: "Suggest tags",           icon: "🏷" },
  { id: "seo_title",   label: "SEO title",              icon: "🔍" },
  { id: "seo_desc",    label: "SEO description",        icon: "📝" },
  { id: "headlines",   label: "Alt headlines",          icon: "💡" },
  { id: "summary",     label: "Key takeaways",          icon: "📌" },
];

export default function AiAssistant({ form, onApply }) {
  const [activeTool, setActiveTool] = useState(null);
  const [result,     setResult]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [open,       setOpen]       = useState(false);

  const run = async (toolId) => {
    setActiveTool(toolId);
    setResult("");
    setError("");
    setLoading(true);

    let res;
    switch (toolId) {
      case "excerpt":    res = await generateExcerpt(form.title, form.body);                             break;
      case "tags":       res = await suggestTags(form.title, form.body, form.category_id);               break;
      case "seo_title":  res = await generateSeoTitle(form.title, form.category_id);                    break;
      case "seo_desc":   res = await generateSeoDescription(form.title, form.excerpt, form.category_id); break;
      case "headlines":  res = await suggestHeadlines(form.title, form.excerpt);                         break;
      case "summary":    res = await generateSummary(form.body);                                         break;
      default:           res = { result: null, error: "Unknown tool" };
    }

    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setResult(res.result);
  };

  const apply = () => {
    if (!result || !activeTool) return;
    const fieldMap = {
      excerpt:   "excerpt",
      tags:      "tags",
      seo_title: "seo_title",
      seo_desc:  "seo_description",
    };
    const field = fieldMap[activeTool];
    if (field) {
      // Tags need special handling
      const value = field === "tags"
        ? result.split(",").map((t) => t.trim()).filter(Boolean).join(", ")
        : result;
      onApply(field, value);
    }
    setResult("");
    setActiveTool(null);
  };

  return (
    <div className="ai-assistant admin-card">
      <button
        type="button"
        className="ai-assistant__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="ai-assistant__icon" aria-hidden="true">✨</span>
        <span>AI Writing Assistant</span>
        <span className="ai-assistant__badge">Beta</span>
        <span className="ai-assistant__chevron" aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="ai-assistant__body">
          <p className="ai-assistant__note">
            All suggestions require manual review. Nothing is applied automatically.
          </p>

          <div className="ai-assistant__tools" role="group" aria-label="AI tools">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={`ai-tool-btn ${activeTool === tool.id ? "ai-tool-btn--active" : ""}`}
                onClick={() => run(tool.id)}
                disabled={loading}
                aria-pressed={activeTool === tool.id}
              >
                <span aria-hidden="true">{tool.icon}</span>
                {tool.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="ai-assistant__loading" role="status" aria-label="Generating suggestion">
              <div className="ai-assistant__spinner" />
              <span>Generating…</span>
            </div>
          )}

          {error && <p className="admin-error" role="alert">{error}</p>}

          {result && !loading && (
            <div className="ai-assistant__result">
              <div className="ai-assistant__result-label">
                {TOOLS.find((t) => t.id === activeTool)?.label} suggestion:
              </div>
              <div className="ai-assistant__result-text" aria-live="polite">
                {result}
              </div>
              <div className="ai-assistant__result-actions">
                {["excerpt", "tags", "seo_title", "seo_desc"].includes(activeTool) && (
                  <button type="button" className="admin-btn" onClick={apply}>
                    Apply to field
                  </button>
                )}
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => run(activeTool)}
                >
                  Regenerate
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => { setResult(""); setActiveTool(null); }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
