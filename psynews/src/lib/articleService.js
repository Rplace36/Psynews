/**
 * articleService.js
 *
 * All Supabase data-access functions for PsyNews.
 * Falls back to local placeholder data when Supabase is not configured
 * so the app stays functional during development without credentials.
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import {
  articles as localArticles,
  categories as localCategories,
} from "../data/articles";

// ─── Shared column select ────────────────────────────────────────────────────
// Matches the articles_with_author view columns we need in the UI
const ARTICLE_COLS = `
  id,
  title,
  slug,
  excerpt,
  image_url,
  category_id,
  author_id,
  tags,
  featured,
  read_time,
  published_at,
  author_name,
  author_role,
  author_avatar_url,
  category_label,
  category_color
`;

// ─── Shape normalizers ───────────────────────────────────────────────────────
// Converts a DB row from articles_with_author into the shape the UI expects.
function normalizeArticle(row) {
  return {
    id:         row.id,
    title:      row.title,
    slug:       row.slug,
    excerpt:    row.excerpt,
    image:      row.image_url,
    category:   row.category_id,
    author:     row.author_name,
    authorRole: row.author_role,
    authorAvatar: row.author_avatar_url,
    tags:       row.tags ?? [],
    featured:   row.featured,
    readTime:   row.read_time,
    date:       formatDate(row.published_at),
    // Keep raw fields available for detail pages
    _raw: row,
  };
}

function normalizeCategory(row) {
  return {
    id:    row.id,
    label: row.label,
    color: row.color,
  };
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Categories ──────────────────────────────────────────────────────────────

// Fallback sort order when deriving categories from article rows
const CATEGORY_SORT = {
  research: 1, policy: 2, culture: 3, events: 4, books: 5, opinion: 6,
};

export async function fetchCategories() {
  if (!isSupabaseConfigured) {
    return { data: localCategories, error: null };
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, label, color, sort_order")
    .order("sort_order");

  if (error) {
    console.error("[articleService] fetchCategories:", error.message);
    return { data: localCategories, error };
  }

  // If the categories table is empty (seed not applied), derive unique
  // categories from the articles_with_author view which already has the
  // joined label + color on every row.
  if (data.length === 0) {
    const { data: articleRows, error: aErr } = await supabase
      .from("articles_with_author")
      .select("category_id, category_label, category_color");

    if (aErr || !articleRows) return { data: localCategories, error: aErr };

    const seen = new Map();
    for (const row of articleRows) {
      if (!seen.has(row.category_id)) {
        seen.set(row.category_id, {
          id:    row.category_id,
          label: row.category_label,
          color: row.category_color,
        });
      }
    }
    const derived = [...seen.values()].sort(
      (a, b) => (CATEGORY_SORT[a.id] ?? 99) - (CATEGORY_SORT[b.id] ?? 99)
    );
    return { data: derived, error: null };
  }

  return { data: data.map(normalizeCategory), error: null };
}

// ─── Articles ────────────────────────────────────────────────────────────────

export async function fetchAllArticles() {
  if (!isSupabaseConfigured) {
    return { data: localArticles, error: null };
  }

  const { data, error } = await supabase
    .from("articles_with_author")
    .select(ARTICLE_COLS)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[articleService] fetchAllArticles:", error.message);
    return { data: localArticles, error };
  }

  return { data: data.map(normalizeArticle), error: null };
}

export async function fetchFeaturedArticles() {
  if (!isSupabaseConfigured) {
    return { data: localArticles.filter((a) => a.featured), error: null };
  }

  const { data, error } = await supabase
    .from("articles_with_author")
    .select(ARTICLE_COLS)
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("[articleService] fetchFeaturedArticles:", error.message);
    return { data: localArticles.filter((a) => a.featured), error };
  }

  return { data: data.map(normalizeArticle), error: null };
}

export async function fetchLatestArticles(limit = 6) {
  if (!isSupabaseConfigured) {
    return {
      data: localArticles.filter((a) => !a.featured).slice(0, limit),
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("articles_with_author")
    .select(ARTICLE_COLS)
    .eq("featured", false)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[articleService] fetchLatestArticles:", error.message);
    return {
      data: localArticles.filter((a) => !a.featured).slice(0, limit),
      error,
    };
  }

  return { data: data.map(normalizeArticle), error: null };
}

export async function fetchArticlesByCategory(categoryId, limit = 3) {
  if (!isSupabaseConfigured) {
    return {
      data: localArticles.filter((a) => a.category === categoryId).slice(0, limit),
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("articles_with_author")
    .select(ARTICLE_COLS)
    .eq("category_id", categoryId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[articleService] fetchArticlesByCategory:", error.message);
    return {
      data: localArticles.filter((a) => a.category === categoryId).slice(0, limit),
      error,
    };
  }

  return { data: data.map(normalizeArticle), error: null };
}

export async function fetchTrendingArticles(limit = 5) {
  if (!isSupabaseConfigured) {
    return { data: localArticles.slice(0, limit), error: null };
  }

  // "Trending" = most recent published articles (can be extended with a view_count column later)
  const { data, error } = await supabase
    .from("articles_with_author")
    .select(ARTICLE_COLS)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[articleService] fetchTrendingArticles:", error.message);
    return { data: localArticles.slice(0, limit), error };
  }

  return { data: data.map(normalizeArticle), error: null };
}

export async function fetchArticleBySlug(slug) {
  if (!isSupabaseConfigured) {
    const found = localArticles.find((a) => a.slug === slug) ?? null;
    return { data: found, error: null };
  }

  const { data, error } = await supabase
    .from("articles_with_author")
    .select(ARTICLE_COLS + ", body")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("[articleService] fetchArticleBySlug:", error.message);
    return { data: null, error };
  }

  return { data: normalizeArticle(data), error: null };
}

export async function searchArticles(query) {
  if (!isSupabaseConfigured) {
    const q = query.toLowerCase();
    return {
      data: localArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.author.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      ),
      error: null,
    };
  }

  const { data, error } = await supabase.rpc("search_articles", { query });

  if (error) {
    console.error("[articleService] searchArticles:", error.message);
    // Graceful fallback
    const q = query.toLowerCase();
    return {
      data: localArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.author.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      ),
      error,
    };
  }

  return { data: data.map(normalizeArticle), error: null };
}

// ─── Newsletter ──────────────────────────────────────────────────────────────

export async function subscribeToNewsletter(email) {
  if (!isSupabaseConfigured) {
    // Simulate success in local mode
    return { error: null };
  }

  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email });

  if (error) {
    // 23505 = unique_violation (already subscribed)
    if (error.code === "23505") {
      return { error: null, alreadySubscribed: true };
    }
    console.error("[articleService] subscribeToNewsletter:", error.message);
    return { error };
  }

  return { error: null, alreadySubscribed: false };
}
