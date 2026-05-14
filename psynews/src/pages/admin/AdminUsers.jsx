import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ROLES } from "../../lib/auth";
import "./Admin.css";

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(null);

  const load = () => {
    setLoading(true);
    supabase
      .from("user_profiles")
      .select("id, role, display_name, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setUsers(data ?? []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const updateRole = async (id, newRole) => {
    setSaving(id);
    await supabase.from("user_profiles").update({ role: newRole, updated_at: new Date().toISOString() }).eq("id", id);
    setSaving(null);
    load();
  };

  return (
    <div className="admin-users">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-subtitle">{users.length} registered user{users.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Role legend */}
      <div className="admin-role-legend">
        {Object.entries(ROLES).map(([key, def]) => (
          <div key={key} className="admin-role-pill" style={{ "--r-color": def.color }}>
            <span className="admin-role-pill__dot" />
            <strong>{def.label}</strong>
            <span>{def.description}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="admin-table-skeleton">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton admin-row-skeleton" />)}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Member since</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="admin-user-row">
                      <div className="admin-user-avatar">
                        {(u.display_name || u.id)[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>{u.display_name || "—"}</div>
                        <div style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "var(--color-text-faint)" }}>{u.id.slice(0, 8)}…</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="admin-select"
                      disabled={saving === u.id}
                      aria-label={`Role for ${u.display_name}`}
                      style={{ width: "auto", minWidth: 130 }}
                    >
                      {Object.keys(ROLES).map((r) => (
                        <option key={r} value={r}>{ROLES[r].label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="admin-table__date">
                    {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-card" style={{ marginTop: 32 }}>
        <h2 className="admin-card__title">Invite new user</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: 12 }}>
          Invite editors and contributors via Supabase Auth. Go to your Supabase Dashboard → Authentication → Users → Invite user.
          New users are automatically assigned the <strong>contributor</strong> role.
        </p>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-btn admin-btn--ghost"
          style={{ display: "inline-flex", width: "auto" }}
        >
          Open Supabase Auth ↗
        </a>
      </div>
    </div>
  );
}
