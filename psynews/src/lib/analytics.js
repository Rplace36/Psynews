/**
 * analytics.js
 *
 * Thin wrapper around analytics providers.
 * Supports: Vercel Analytics (auto via @vercel/analytics),
 *           Plausible (script inject), and custom event tracking.
 *
 * All calls are no-ops when analytics is unavailable (dev/blocked).
 */

// ── Plausible ─────────────────────────────────────────────────────
export function initPlausible(domain) {
  if (typeof window === "undefined" || !domain) return;
  if (document.querySelector('script[data-plausible]')) return;

  const s = document.createElement("script");
  s.defer = true;
  s.dataset.domain  = domain;
  s.dataset.plausible = "true";
  s.src = "https://plausible.io/js/script.tagged-events.js";
  document.head.appendChild(s);
}

// ── Generic event tracker ─────────────────────────────────────────
export function track(eventName, props = {}) {
  try {
    // Plausible
    if (typeof window !== "undefined" && window.plausible) {
      window.plausible(eventName, { props });
    }
    // PostHog
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture(eventName, props);
    }
  } catch { /* never throw */ }
}

// ── Article view tracking ─────────────────────────────────────────
import { supabase } from "./supabase";

/**
 * Record an article view in Supabase + fire analytics event.
 * Generates a privacy-safe fingerprint (no PII stored).
 */
export async function trackArticleView(articleId, slug) {
  if (!articleId) return;

  try {
    // Build a session-scoped fingerprint (not stored as PII)
    const fpRaw = [
      navigator.language,
      screen.width,
      screen.colorDepth,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ].join("|");

    const encoder  = new TextEncoder();
    const data     = encoder.encode(fpRaw);
    const hashBuf  = await crypto.subtle.digest("SHA-256", data);
    const hashArr  = Array.from(new Uint8Array(hashBuf));
    const fingerprint = hashArr.slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");

    const referrer = document.referrer
      ? new URL(document.referrer).hostname
      : "direct";

    await supabase.rpc("record_article_view", {
      p_article_id:  articleId,
      p_fingerprint: fingerprint,
      p_referrer:    referrer,
    });

    // Fire named event for Plausible/PostHog
    track("Article View", {
      slug,
      referrer,
    });
  } catch { /* silent — never break page load */ }
}
