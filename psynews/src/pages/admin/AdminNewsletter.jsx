import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./Admin.css";

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("all"); // all | confirmed | unsubscribed

  useEffect(() => {
    supabase
      .from("newsletter_subscribers")
      .select("id, email, name, confirmed, welcome_sent, unsubscribed, created_at, source")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setSubscribers(data ?? []); setLoading(false); });
  }, []);

  const exportCSV = () => {
    const rows = [
      ["Email", "Name", "Confirmed", "Subscribed", "Source", "Date"],
      ...filtered.map((s) => [
        s.email, s.name || "", s.confirmed ? "Yes" : "No",
        s.unsubscribed ? "No" : "Yes",
        s.source || "",
        new Date(s.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "psynews-subscribers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = subscribers.filter((s) => {
    const matchFilter =
      filter === "all" ? true
      : filter === "confirmed"    ? s.confirmed && !s.unsubscribed
      : filter === "unsubscribed" ? s.unsubscribed
      : true;
    const matchSearch =
      !search || s.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="admin-newsletter">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Newsletter</h1>
          <p className="admin-page-subtitle">
            {subscribers.filter((s) => !s.unsubscribed).length} active subscriber
            {subscribers.filter((s) => !s.unsubscribed).length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="admin-btn admin-btn--ghost" onClick={exportCSV}>
          ↓ Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="admin-stats-row">
        {[
          { label: "Total",        value: subscribers.length },
          { label: "Confirmed",    value: subscribers.filter((s) => s.confirmed && !s.unsubscribed).length, color: "#10B981" },
          { label: "Unconfirmed",  value: subscribers.filter((s) => !s.confirmed && !s.unsubscribed).length, color: "#F59E0B" },
          { label: "Unsubscribed", value: subscribers.filter((s) => s.unsubscribed).length, color: "#6b6985" },
        ].map((s) => (
          <div key={s.label} className="admin-stat-card">
            <div className="admin-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="admin-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Search by email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input admin-search-input"
          aria-label="Search subscribers"
        />
        <div className="admin-filter-tabs" role="tablist">
          {["all","confirmed","unsubscribed"].map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              className={`admin-tab ${filter === f ? "admin-tab--active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-table-skeleton">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton admin-row-skeleton" />)}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Name</th>
                <th scope="col">Confirmed</th>
                <th scope="col">Source</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="admin-table__empty">No subscribers found.</td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id} style={{ opacity: s.unsubscribed ? 0.4 : 1 }}>
                  <td>
                    <span className="admin-table__link">{s.email}</span>
                    {s.unsubscribed && <span className="admin-badge" style={{ marginLeft: 8 }}>Unsub</span>}
                  </td>
                  <td>{s.name || <span style={{ color: "var(--color-text-faint)" }}>—</span>}</td>
                  <td>
                    <span style={{ color: s.confirmed ? "var(--color-emerald)" : "var(--color-amber)", fontSize: "0.82rem", fontWeight: 600 }}>
                      {s.confirmed ? "✓ Yes" : "Pending"}
                    </span>
                  </td>
                  <td><span className="admin-badge">{s.source || "homepage"}</span></td>
                  <td className="admin-table__date">
                    {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resend integration note */}
      <div className="admin-card" style={{ marginTop: 32 }}>
        <h2 className="admin-card__title">Email integration</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: 12 }}>
          To send welcome emails automatically, set <code>RESEND_API_KEY</code> and <code>RESEND_FROM_EMAIL</code> in your Vercel environment variables. New subscribers will receive a welcome email via the <code>/api/newsletter-welcome</code> edge function.
        </p>
        <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn--ghost" style={{ display: "inline-flex", width: "auto" }}>
          Set up Resend ↗
        </a>
      </div>
    </div>
  );
}
