"use client";

import { useState, useEffect } from "react";
import type { Deal, Store, Category, Comment } from "@/types/deals";
import {
  getHotDeals,
  getPopularDeals,
  getNewDeals,
  getExpiringSoon,
  getDealsByCategory,
  getMostConfirmed,
  getStoreDeals,
  getStoreCoupons,
  getStoreDealsOnly,
  getDealById,
  getStoreBySlug,
  getCategoryBySlug,
  getAllStores,
  getAllCategories,
  getBestComment,
  onDealComments,
} from "@/lib/firestore";

// ─── Generic async hook ─────────────────────────────────────────
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

// ─── Deal hooks ─────────────────────────────────────────────────

export function useHotDeals(limit = 6) {
  return useAsync<Deal[]>(() => getHotDeals(limit), [limit]);
}

export function usePopularDeals(limit = 12) {
  return useAsync<Deal[]>(() => getPopularDeals(limit), [limit]);
}

export function useNewDeals(limit = 10) {
  return useAsync<Deal[]>(() => getNewDeals(limit), [limit]);
}

export function useExpiringSoon(limit = 6) {
  return useAsync<Deal[]>(() => getExpiringSoon(limit), [limit]);
}

export function useDealsByCategory(categoryId: string, limit = 8) {
  return useAsync<Deal[]>(
    () => getDealsByCategory(categoryId, limit),
    [categoryId, limit]
  );
}

export function useMostConfirmed(limit = 8) {
  return useAsync<Deal[]>(() => getMostConfirmed(limit), [limit]);
}

export function useStoreDeals(storeSlug: string) {
  return useAsync<Deal[]>(() => getStoreDeals(storeSlug), [storeSlug]);
}

export function useDeal(id: string) {
  return useAsync<Deal | null>(() => getDealById(id), [id]);
}

// ─── Store hooks ────────────────────────────────────────────────

export function useStore(slug: string) {
  return useAsync<Store | null>(() => getStoreBySlug(slug), [slug]);
}

export function useAllStores() {
  return useAsync<Store[]>(() => getAllStores(), []);
}

// ─── Category hooks ─────────────────────────────────────────────

export function useCategory(slug: string) {
  return useAsync<Category | null>(() => getCategoryBySlug(slug), [slug]);
}

export function useAllCategories() {
  return useAsync<Category[]>(() => getAllCategories(), []);
}

// ─── Comment hooks ──────────────────────────────────────────────

export function useDealComments(dealId: string) {
  const [state, setState] = useState<AsyncState<Comment[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!dealId) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const unsubscribe = onDealComments(dealId, (comments) => {
      setState({ data: comments, loading: false, error: null });
    });
    return unsubscribe;
  }, [dealId]);

  return state;
}

export function useBestComment(dealId: string) {
  return useAsync<Comment | null>(() => getBestComment(dealId), [dealId]);
}
