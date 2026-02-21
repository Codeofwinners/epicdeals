"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import DynamicDealCard from "@/components/deals/DynamicDealCard";
import { DealGridSkeleton } from "@/components/ui/Skeleton";
import { useStoreDeals } from "@/hooks/useFirestore";
import { getStoreBrandTheme } from "@/lib/brandThemes";
import type { Store, Deal, DiscountType } from "@/types/deals";

type FilterType = "all" | "code" | "deal" | "sale";
type SortType = "trending" | "newest" | "popular" | "confirmed" | "savings";

const filterOptions: { value: FilterType; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "grid_view" },
  { value: "code", label: "Codes", icon: "key" },
  { value: "deal", label: "Deals", icon: "local_offer" },
  { value: "sale", label: "Sales", icon: "sell" },
];

const sortOptions: { value: SortType; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "confirmed", label: "Most Confirmed" },
  { value: "savings", label: "Biggest Savings" },
];

export default function StorePageContent({ store }: { store: Store }) {
  const { data: allDeals, loading: dealsLoading } = useStoreDeals(store.slug);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("trending");

  const brandTheme = getStoreBrandTheme(store.id, store.name);

  const toggleComments = (dealId: string) => {
    setOpenComments(prev => {
      const s = new Set(prev);
      if (s.has(dealId)) s.delete(dealId); else s.add(dealId);
      return s;
    });
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...(allDeals ?? [])];
    if (filter !== "all") {
      result = result.filter((d) => d.discountType === (filter as DiscountType));
    }
    switch (sort) {
      case "trending": result.sort((a, b) => b.usedLastHour - a.usedLastHour); break;
      case "newest": result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "popular": result.sort((a, b) => b.netVotes - a.netVotes); break;
      case "confirmed": result.sort((a, b) => b.workedYes - a.workedYes); break;
      case "savings": result.sort((a, b) => b.savingsValue - a.savingsValue); break;
    }
    return result;
  }, [allDeals, filter, sort]);

  const now = new Date();
  const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const couponsCount = (allDeals ?? []).filter(d => !!d.code).length;
  const dealsOnlyCount = (allDeals ?? []).filter(d => !d.code).length;

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .store-masonry { column-count: 2; column-gap: 12px; }
        .store-masonry-item { break-inside: avoid; margin-bottom: 12px; }
        @media (min-width: 768px) {
          .store-masonry { column-count: unset; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; align-items: start; }
          .store-masonry-item { margin-bottom: 0; }
        }
        .deal-card { transition: transform 0.2s; }
        .deal-card:hover { transform: translateY(-1px); }
        @keyframes vote-arrow-pop {
          0%   { transform: scale(1) translateY(0); }
          25%  { transform: scale(1.7) translateY(-4px); }
          55%  { transform: scale(0.82) translateY(2px); }
          80%  { transform: scale(1.1) translateY(-1px); }
          100% { transform: scale(1) translateY(0); }
        }
        @keyframes vote-float-up {
          0%   { transform: translateX(-50%) translateY(0);   opacity: 1; }
          100% { transform: translateX(-50%) translateY(-22px); opacity: 0; }
        }
        @keyframes vote-ring {
          0%   { transform: translate(-50%,-50%) scale(0.6); opacity: 0.7; }
          100% { transform: translate(-50%,-50%) scale(2.6); opacity: 0; }
        }
        @keyframes count-pop {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Brand Hero */}
      <section className="max-w-7xl mx-auto px-4 pb-6">
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{
            background: brandTheme.bgGradient,
            border: `1px solid ${brandTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
          }}
        >
          {brandTheme.glowColor && (
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px] pointer-events-none" style={{ backgroundColor: brandTheme.glowColor }} />
          )}
          <div style={{ position: "relative", zIndex: 10, padding: "32px 28px 28px" }}>
            {/* Store name + domain */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <h1 style={{
                fontSize: "clamp(24px, 5vw, 36px)",
                fontWeight: 900,
                color: brandTheme.textColor,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}>
                {store.name}
              </h1>
              {store.isFeatured && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  padding: "3px 10px", borderRadius: "8px",
                  fontSize: "10px", fontWeight: 800,
                  backgroundColor: brandTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
                  color: brandTheme.isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.5)",
                  letterSpacing: "0.04em", textTransform: "uppercase",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>star</span>
                  Featured
                </span>
              )}
            </div>

            <a
              href={`https://${store.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "12px", fontWeight: 600,
                color: brandTheme.isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)",
                textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px",
                marginBottom: "16px",
              }}
            >
              {store.domain}
              <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>open_in_new</span>
            </a>

            {/* SEO heading */}
            <h2 style={{
              fontSize: "14px", fontWeight: 700,
              color: brandTheme.isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
              marginBottom: "16px", lineHeight: 1.4,
            }}>
              {store.name} Coupons & Promo Codes &mdash; {monthYear}
            </h2>

            {/* Stats row */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{
                  fontSize: "24px", fontWeight: 900, letterSpacing: "-0.02em",
                  color: brandTheme.textColor,
                }}>{filteredAndSorted.length}</span>
                <span style={{
                  fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
                  color: brandTheme.isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                }}>Active Deals</span>
              </div>
              {couponsCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "24px", fontWeight: 900, color: brandTheme.textColor }}>{couponsCount}</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: brandTheme.isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>Coupon Codes</span>
                </div>
              )}
            </div>

            {/* Internal nav links */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Link
                href={`/stores/${store.slug}/coupons`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  padding: "6px 14px", borderRadius: "8px",
                  fontSize: "11px", fontWeight: 700, textDecoration: "none",
                  backgroundColor: brandTheme.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
                  color: brandTheme.isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)",
                  border: `1px solid ${brandTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>key</span>
                Coupon Codes
              </Link>
              <Link
                href={`/stores/${store.slug}/deals`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  padding: "6px 14px", borderRadius: "8px",
                  fontSize: "11px", fontWeight: 700, textDecoration: "none",
                  backgroundColor: brandTheme.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
                  color: brandTheme.isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)",
                  border: `1px solid ${brandTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>local_offer</span>
                Deals & Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Filter / Sort Toolbar */}
      <section className="max-w-7xl mx-auto px-4 pb-6">
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          border: "1px solid #E8E8E8",
          padding: "14px 16px",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Filters */}
            <div className="no-scrollbar" style={{ display: "flex", alignItems: "center", gap: "6px", overflowX: "auto" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#999", flexShrink: 0 }}>tune</span>
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    padding: "6px 14px", borderRadius: "20px",
                    fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap",
                    border: "none", cursor: "pointer", outline: "none",
                    backgroundColor: filter === opt.value ? "#0A0A0A" : "#F3F3F3",
                    color: filter === opt.value ? "#fff" : "#666",
                    transition: "all 0.15s",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Sorts */}
            <div className="no-scrollbar" style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  style={{
                    padding: "6px 14px", borderRadius: "20px",
                    fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap",
                    border: "none", cursor: "pointer", outline: "none",
                    backgroundColor: sort === opt.value ? "#059669" : "#F3F3F3",
                    color: sort === opt.value ? "#fff" : "#666",
                    transition: "all 0.15s",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Deal Grid — Masonry with DynamicDealCard */}
      <section className="max-w-7xl mx-auto px-4 pb-8">
        {dealsLoading ? (
          <DealGridSkeleton count={8} />
        ) : filteredAndSorted.length > 0 ? (
          <div className="store-masonry">
            {filteredAndSorted.map((deal) => (
              <div key={deal.id} className="store-masonry-item">
                <DynamicDealCard
                  deal={deal}
                  isOpen={openComments.has(deal.id)}
                  toggleComments={() => toggleComments(deal.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>&#128269;</div>
            <p style={{ color: "#888", fontWeight: 600, fontSize: "14px" }}>No deals match your current filters.</p>
            <button
              onClick={() => { setFilter("all"); setSort("trending"); }}
              style={{
                marginTop: "12px", fontSize: "13px", fontWeight: 700,
                color: "#059669", background: "none", border: "none",
                cursor: "pointer", textDecoration: "underline",
              }}
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>

      {/* SEO Content Footer */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          border: "1px solid #E8E8E8",
          padding: "28px 24px",
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#1A1A1A", marginBottom: "12px", letterSpacing: "-0.02em" }}>
            About {store.name} Discounts
          </h3>
          <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.7, marginBottom: "16px" }}>
            Find the best {store.name} coupons, promo codes, and deals for {monthYear}. Our community
            verifies every {store.name} discount code to ensure it works before you checkout. Save money with
            {" "}{filteredAndSorted.length} active {store.name} offers including exclusive coupon codes, sitewide
            sales, and free shipping deals.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link
              href={`/stores/${store.slug}/coupons`}
              style={{
                fontSize: "12px", fontWeight: 700, color: "#059669",
                textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px",
              }}
            >
              {store.name} Coupon Codes
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_forward</span>
            </Link>
            <Link
              href={`/stores/${store.slug}/deals`}
              style={{
                fontSize: "12px", fontWeight: 700, color: "#059669",
                textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px",
              }}
            >
              {store.name} Deals & Sales
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
