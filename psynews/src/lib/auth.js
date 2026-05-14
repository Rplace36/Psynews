/**
 * auth.js — Role-based auth helpers
 */
import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "./supabase";

// ── Auth context ──────────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider() {
  const [session,  setSession]  = useState(undefined);
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile(data.session.user.id);
      else setLoading(false);
    });

    // Auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) loadProfile(s.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
    setLoading(false);
  }

  const role = profile?.role ?? null;

  return {
    session,
    profile,
    role,
    loading,
    isAdmin:       role === "admin",
    isEditor:      role === "editor" || role === "admin",
    isContributor: !!role,
    signOut:       () => supabase.auth.signOut(),
    refreshProfile: () => session && loadProfile(session.user.id),
  };
}

// ── Role helpers ──────────────────────────────────────────────────
export const ROLES = {
  admin:       { label: "Admin",       color: "#7C3AED", description: "Full access — publish, delete, manage users" },
  editor:      { label: "Editor",      color: "#0EA5E9", description: "Can publish, edit, and manage all content" },
  contributor: { label: "Contributor", color: "#10B981", description: "Can create and edit own drafts only" },
};

export function canPublish(role)  { return ["admin", "editor"].includes(role); }
export function canDelete(role)   { return role === "admin"; }
export function canManageUsers(role) { return role === "admin"; }
