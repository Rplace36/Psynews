import { useState, useEffect, useCallback } from "react";
import {
  fetchAllArticles,
  fetchFeaturedArticles,
  fetchLatestArticles,
  fetchArticlesByCategory,
  fetchTrendingArticles,
  fetchCategories,
  searchArticles,
} from "../lib/articleService";

// ─── Generic async hook ──────────────────────────────────────────────────────
// data initialises as [] so components can safely call .map() before the
// first fetch resolves — avoids "Cannot read properties of null" in production.
function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({ data: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    asyncFn().then(({ data, error }) => {
      if (!cancelled) {
        setState({ data: data ?? [], loading: false, error: error?.message ?? null });
      }
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

// ─── Public hooks ────────────────────────────────────────────────────────────

export function useCategories() {
  return useAsync(fetchCategories, []);
}

export function useFeaturedArticles() {
  return useAsync(fetchFeaturedArticles, []);
}

export function useLatestArticles(limit = 6) {
  return useAsync(() => fetchLatestArticles(limit), [limit]);
}

export function useArticlesByCategory(categoryId, limit = 3) {
  return useAsync(
    () => fetchArticlesByCategory(categoryId, limit),
    [categoryId, limit]
  );
}

export function useTrendingArticles(limit = 5) {
  return useAsync(() => fetchTrendingArticles(limit), [limit]);
}

export function useAllArticles() {
  return useAsync(fetchAllArticles, []);
}

export function useSearchArticles(query) {
  const [state, setState] = useState({ data: [], loading: false, error: null });

  const run = useCallback(() => {
    if (!query || !query.trim()) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    searchArticles(query.trim()).then(({ data, error }) => {
      setState({ data: data ?? [], loading: false, error: error?.message ?? null });
    });
  }, [query]);

  useEffect(() => { run(); }, [run]);

  return state;
}
