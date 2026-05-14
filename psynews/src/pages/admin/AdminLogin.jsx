import { useState } from "react";
import { supabase } from "../../lib/supabase";
import "./Admin.css";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [mode, setMode] = useState("password"); // "password" | "magic"

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); }
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    if (err) { setError(err.message); setLoading(false); }
    else { setMagicSent(true); setLoading(false); }
  };

  if (magicSent) {
    return (
      <div className="admin-login">
        <div className="admin-login__card">
          <div className="admin-login__icon">✉</div>
          <h1 className="admin-login__title">Check your email</h1>
          <p className="admin-login__desc">
            A magic link has been sent to <strong>{email}</strong>. Click it to sign in.
          </p>
          <button className="admin-btn admin-btn--ghost" onClick={() => setMagicSent(false)}>
            ← Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__logo">
          <span>◆</span> PsyNews
        </div>
        <h1 className="admin-login__title">Admin sign in</h1>
        <p className="admin-login__desc">
          Sign in to access the PsyNews editorial dashboard.
        </p>

        <div className="admin-login__tabs" role="tablist">
          <button
            role="tab"
            aria-selected={mode === "password"}
            className={`admin-tab ${mode === "password" ? "admin-tab--active" : ""}`}
            onClick={() => setMode("password")}
          >
            Password
          </button>
          <button
            role="tab"
            aria-selected={mode === "magic"}
            className={`admin-tab ${mode === "magic" ? "admin-tab--active" : ""}`}
            onClick={() => setMode("magic")}
          >
            Magic link
          </button>
        </div>

        <form
          onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink}
          className="admin-form"
          aria-label="Sign in form"
        >
          <div className="admin-field">
            <label htmlFor="admin-email" className="admin-label">Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="admin-input"
              placeholder="editor@psynews.com"
              required
              autoComplete="email"
            />
          </div>

          {mode === "password" && (
            <div className="admin-field">
              <label htmlFor="admin-password" className="admin-label">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          )}

          {error && <p className="admin-error" role="alert">{error}</p>}

          <button type="submit" className="admin-btn" disabled={loading}>
            {loading ? "Signing in…" : mode === "password" ? "Sign in" : "Send magic link"}
          </button>
        </form>
      </div>
    </div>
  );
}
