import type { Deal } from "@/types/deals";
import { slugify } from "./slugify";

/**
 * Returns "coupons" if the deal has a promo code, "deals" otherwise.
 */
export function getDealTypeSegment(deal: Pick<Deal, "code">): "coupons" | "deals" {
  return deal.code ? "coupons" : "deals";
}

/**
 * Strips the store suffix from an existing slug to get the title-only slug.
 * e.g. "save-40-on-electronics-amazon" with storeSlug "amazon" → "save-40-on-electronics"
 */
export function getTitleSlug(deal: Pick<Deal, "slug" | "title" | "store">): string {
  const storeSlug = deal.store.slug;
  const fullSlug = deal.slug;

  // If the slug ends with "-{storeSlug}", strip it
  if (fullSlug.endsWith(`-${storeSlug}`)) {
    return fullSlug.slice(0, -(storeSlug.length + 1));
  }

  // Fallback: generate from title only
  return slugify(deal.title);
}

/**
 * Returns the full path for a deal under the new URL structure.
 * e.g. /stores/amazon/coupons/save-40-on-electronics
 */
export function getDealPath(deal: Pick<Deal, "slug" | "title" | "store" | "code">): string {
  const storeSlug = deal.store.slug;
  const segment = getDealTypeSegment(deal);
  const titleSlug = getTitleSlug(deal as Pick<Deal, "slug" | "title" | "store">);
  return `/stores/${storeSlug}/${segment}/${titleSlug}`;
}
