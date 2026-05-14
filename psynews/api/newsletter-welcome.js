/**
 * Vercel Serverless Function: /api/newsletter-welcome
 *
 * Called by the newsletter signup form.
 * Inserts subscriber into Supabase and sends a welcome email via Resend.
 *
 * Environment variables required:
 *   SUPABASE_URL             — your project URL
 *   SUPABASE_SERVICE_KEY     — service role key (NOT the anon key)
 *   RESEND_API_KEY           — from resend.com
 *   RESEND_FROM_EMAIL        — verified sender, e.g. hello@psynews.com
 *   SITE_URL                 — canonical site URL for links in emails
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, name, source = "homepage" } = req.body ?? {};

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  // ── Insert into Supabase ──────────────────────────────────────────
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY;

  if (supabaseUrl && serviceKey) {
    const insertRes = await fetch(
      `${supabaseUrl}/rest/v1/newsletter_subscribers`,
      {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "apikey":        serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Prefer":        "return=representation,resolution=merge-duplicates",
        },
        body: JSON.stringify({ email, name: name || null, source, confirmed: false }),
      }
    );

    if (!insertRes.ok) {
      const err = await insertRes.json().catch(() => ({}));
      // 23505 = already exists — treat as success
      if (err.code !== "23505") {
        console.error("[newsletter-welcome] insert error:", err);
      }
    }
  }

  // ── Send welcome email via Resend ────────────────────────────────
  const resendKey   = process.env.RESEND_API_KEY;
  const fromEmail   = process.env.RESEND_FROM_EMAIL || "hello@psynews.vercel.app";
  const siteUrl     = process.env.SITE_URL || "https://psynews.vercel.app";

  if (resendKey) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-family:Georgia,serif;font-size:2rem;font-weight:900;background:linear-gradient(90deg,#7C3AED,#EC4899,#F59E0B);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">PsyNews</span>
    </div>
    <div style="background:#12121e;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px;">
      <h1 style="color:#f0eeff;font-size:1.6rem;font-weight:900;margin:0 0 16px;">Welcome to PsyNews</h1>
      <p style="color:#a8a6c0;line-height:1.7;margin:0 0 20px;">
        ${name ? `Hi ${name}, t` : "T"}hank you for subscribing to the Psychedelic Intelligence Network.
        Every Friday you'll receive the week's most important psychedelic science, policy, and culture stories.
      </p>
      <p style="color:#a8a6c0;line-height:1.7;margin:0 0 28px;">
        We cover research breakthroughs, regulatory updates, cultural shifts, and the communities shaping the psychedelic renaissance — rigorously reported, always independent.
      </p>
      <a href="${siteUrl}" style="display:inline-block;background:linear-gradient(90deg,#7C3AED,#EC4899);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:0.9rem;">
        Read the latest stories →
      </a>
    </div>
    <p style="color:#6b6985;font-size:0.75rem;text-align:center;margin-top:24px;">
      You're receiving this because you subscribed at ${siteUrl}.<br>
      <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}" style="color:#7C3AED;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from:    `PsyNews <${fromEmail}>`,
        to:      [email],
        subject: "Welcome to PsyNews — The Psychedelic Intelligence Network",
        html,
      }),
    }).catch((e) => console.error("[newsletter-welcome] resend error:", e));
  }

  return res.status(200).json({ success: true });
}
