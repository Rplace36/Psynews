/**
 * Vercel Serverless Function: /api/ai
 *
 * Proxies AI requests to OpenAI so the API key stays server-side.
 * Set OPENAI_API_KEY in Vercel environment variables.
 *
 * When OPENAI_API_KEY is not set, returns graceful mock responses
 * so the editor still works without an API key configured.
 */

const PROMPTS = {
  excerpt: ({ title, body }) =>
    `Write a compelling 1-2 sentence news article excerpt (max 200 chars) for this article titled "${title}". Body snippet: ${body?.slice(0, 500)}. Return only the excerpt text, no quotes.`,

  tags: ({ title, body, category }) =>
    `Suggest 4-6 relevant tags for a psychedelic news article. Title: "${title}". Category: ${category}. Body snippet: ${body?.slice(0, 400)}. Return only a comma-separated list of tags, no other text.`,

  seo_title: ({ title, category }) =>
    `Rewrite this article title for SEO (max 60 chars, include key terms). Original: "${title}". Category: ${category}. Return only the title, no quotes.`,

  seo_description: ({ title, excerpt, category }) =>
    `Write an SEO meta description (max 155 chars) for an article titled "${title}" in the ${category} category. Excerpt: ${excerpt}. Return only the description, no quotes.`,

  headlines: ({ title, excerpt }) =>
    `Suggest 3 alternative compelling headlines for this psychedelic news article. Original: "${title}". Excerpt: ${excerpt}. Return as a numbered list, one per line.`,

  summary: ({ body }) =>
    `Write a 3-bullet-point key takeaways summary for this article. Body: ${body?.slice(0, 1500)}. Format as a bullet list starting each line with "•".`,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, ...payload } = req.body ?? {};

  if (!action || !PROMPTS[action]) {
    return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // Graceful mock when no API key is configured
  if (!apiKey) {
    const mocks = {
      excerpt:          "This article explores a key development in psychedelic science and its implications for mental health treatment.",
      tags:             "Psilocybin, Research, Clinical Trials, Mental Health, FDA",
      seo_title:        payload.title?.slice(0, 60) || "PsyNews Article",
      seo_description:  payload.excerpt?.slice(0, 155) || "Read the latest psychedelic research and policy coverage on PsyNews.",
      headlines:        "1. Alternative headline one\n2. Alternative headline two\n3. Alternative headline three",
      summary:          "• Key finding one from this article\n• Key finding two with supporting context\n• Key implication for the field going forward",
    };
    return res.status(200).json({ result: mocks[action] });
  }

  try {
    const prompt = PROMPTS[action](payload);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       "gpt-4o-mini",
        max_tokens:  300,
        temperature: 0.7,
        messages: [
          {
            role:    "system",
            content: "You are an editorial assistant for PsyNews, a professional psychedelic science and policy publication. Responses should be concise, accurate, and editorially appropriate.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(502).json({ error: err.error?.message || "OpenAI error" });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() ?? "";
    return res.status(200).json({ result });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
