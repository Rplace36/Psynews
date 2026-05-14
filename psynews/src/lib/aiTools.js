/**
 * aiTools.js
 *
 * AI-assisted drafting tools for the admin editor.
 * Routes through a lightweight Vercel serverless function (/api/ai)
 * so the OpenAI API key never touches the browser.
 *
 * All functions return { result, error }.
 * All AI suggestions require manual approval — nothing is auto-applied.
 */

const AI_ENDPOINT = "/api/ai";

async function callAI(action, payload) {
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { result: null, error: err.error || `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { result: data.result, error: null };
  } catch (e) {
    return { result: null, error: e.message };
  }
}

export function generateExcerpt(title, body) {
  return callAI("excerpt", { title, body });
}

export function suggestTags(title, body, category) {
  return callAI("tags", { title, body, category });
}

export function generateSeoTitle(title, category) {
  return callAI("seo_title", { title, category });
}

export function generateSeoDescription(title, excerpt, category) {
  return callAI("seo_description", { title, excerpt, category });
}

export function suggestHeadlines(title, excerpt) {
  return callAI("headlines", { title, excerpt });
}

export function generateSummary(body) {
  return callAI("summary", { body });
}
