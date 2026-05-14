import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import AdminEditor from "./admin/AdminEditor";
import "./AdminPage.css";

export default function AdminPage() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  }, [navigate]);

  // Still checking auth
  if (session === undefined) {
    return (
      <div className="admin-loading">
        <div className="admin-loading__spinner" aria-label="Loading admin" />
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {session && (
        <aside className="admin-sidebar" aria-label="Admin navigation">
          <div className="admin-sidebar__logo">
            <Link to="/" className="admin-sidebar__home" aria-label="Back to site">
              ← Site
            </Link>
            <span className="admin-sidebar__title">PsyNews Admin</span>
          </div>
          <nav aria-label="Admin menu">
            <Link to="/admin" className="admin-nav-link">Dashboard</Link>
            <Link to="/admin/new" className="admin-nav-link admin-nav-link--cta">+ New Article</Link>
          </nav>
          <div className="admin-sidebar__footer">
            <span className="admin-sidebar__user">{session.user.email}</span>
            <button className="admin-signout" onClick={handleSignOut}>Sign out</button>
          </div>
        </aside>
      )}

      <div className={`admin-main ${session ? "admin-main--with-sidebar" : ""}`}>
        <Routes>
          <Route
            path="/"
            element={session ? <AdminDashboard session={session} /> : <AdminLogin />}
          />
          <Route
            path="/new"
            element={session ? <AdminEditor session={session} /> : <Navigate to="/admin" replace />}
          />
          <Route
            path="/edit/:id"
            element={session ? <AdminEditor session={session} /> : <Navigate to="/admin" replace />}
          />
        </Routes>
      </div>
    </div>
  );
}
