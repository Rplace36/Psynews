import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Link, NavLink, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import AdminEditor from "./admin/AdminEditor";
import AdminNewsletter from "./admin/AdminNewsletter";
import AdminUsers from "./admin/AdminUsers";
import AdminComments from "./admin/AdminComments";
import "./AdminPage.css";

export default function AdminPage() {
  const { session, loading, isAdmin, isEditor, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/admin");
  }, [navigate, signOut]);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading__spinner" aria-label="Loading" />
      </div>
    );
  }

  const navLinks = [
    { to: "/admin",          label: "Dashboard",    exact: true },
    { to: "/admin/new",      label: "+ New Article", cta: true },
    ...(isEditor ? [{ to: "/admin/newsletter", label: "Newsletter" }] : []),
    ...(isEditor ? [{ to: "/admin/comments",   label: "Comments" }] : []),
    ...(isAdmin  ? [{ to: "/admin/users",      label: "Users" }] : []),
  ];

  return (
    <div className="admin-shell">
      {session && (
        <aside className="admin-sidebar" aria-label="Admin navigation">
          <div className="admin-sidebar__logo">
            <Link to="/" className="admin-sidebar__home" aria-label="Back to site">← Site</Link>
            <span className="admin-sidebar__title">PsyNews Admin</span>
            {role && (
              <span className="admin-sidebar__role" data-role={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            )}
          </div>
          <nav aria-label="Admin menu">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className={({ isActive }) =>
                  `admin-nav-link ${link.cta ? "admin-nav-link--cta" : ""} ${isActive ? "admin-nav-link--active" : ""}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="admin-sidebar__footer">
            <span className="admin-sidebar__user">{session.user.email}</span>
            <button className="admin-signout" onClick={handleSignOut}>Sign out</button>
          </div>
        </aside>
      )}

      <div className={`admin-main ${session ? "admin-main--with-sidebar" : ""}`}>
        <Routes>
          <Route path="/"           element={session ? <AdminDashboard /> : <AdminLogin />} />
          <Route path="/new"        element={session ? <AdminEditor />    : <Navigate to="/admin" replace />} />
          <Route path="/edit/:id"   element={session ? <AdminEditor />    : <Navigate to="/admin" replace />} />
          <Route path="/newsletter" element={session && isEditor ? <AdminNewsletter /> : <Navigate to="/admin" replace />} />
          <Route path="/users"      element={session && isAdmin  ? <AdminUsers />     : <Navigate to="/admin" replace />} />
          <Route path="/comments"   element={session && isEditor ? <AdminComments />  : <Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
}
