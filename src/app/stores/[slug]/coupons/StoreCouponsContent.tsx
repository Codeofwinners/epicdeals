"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import DynamicDealCard from "@/components/deals/DynamicDealCard";
import { DealGridSkeleton } from "@/components/ui/Skeleton";
import { useStoreDeals } from "@/hooks/useFirestore";
import { getStoreBrandTheme } from "@/lib/brandThemes";
import type { Store } from "@/types/deals";

type SortType = "trending" | "newest" | "popular" | "confirmed" | "savings";

const sortOptions: { value: SortType; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "confirmed", label: "Most Confirmed" },
  { value: "savings", label: "Biggest Savings" },
];

export default function StoreCouponsContent({ store }: { store: Store }) {
  const { data: allDeals, loading } = useStoreDeals(store.slug);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortType>("trending");

  const brandTheme = getStoreBrandTheme(store.id, store.name);

  const toggleComments = (dealId: string) => {
    setOpenComments(prev => {
      const s = new Set(prev);
      if (s.has(dealId)) s.delete(dealId); else s.add(dealId);
      return s;
    });
  };

  // Filter to only coupons (deals with a code)
  const coupons = useMemo(() => {
    let result = (allDeals ?? []).filter(d => !!d.code);
    switch (sort) {
      case "trending": result.sort((a, b) => b.usedLastHour - a.usedLastHour); break;
      case "newest": result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "popular": result.sort((a, b) => b.netVotes - a.netVotes); break;
      case "confirmed": result.sort((a, b) => b.workedYes - a.workedYes); break;
      case "savings": result.sort((a, b) => b.savingsValue - a.savingsValue); break;
    }
    return result;
  }, [allDeals, sort]);

  const now = new Date();
  const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

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

      {/* Hero */}
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
          <div style={{ position: "relative", zIndex: 10, padding: "28px 24px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px", color: brandTheme.textColor }}>key</span>
              <h1 style={{
                fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 900,
                color: brandTheme.textColor, letterSpacing: "-0.03em", lineHeight: 1.1,
              }}>
                {store.name} Coupon Codes
              </h1>
            </div>
            <p style={{
              fontSize: "13px", fontWeight: 600, lineHeight: 1.5,
              color: brandTheme.isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
              marginBottom: "14px",
            }}>
              {coupons.length} verified promo codes for {monthYear}
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <Link
                href={`/stores/${store.slug}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  padding: "6px 14px", borderRadius: "8px",
                  fontSize: "11px", fontWeight: 700, textDecoration: "none",
                  backgroundColor: brandTheme.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
                  color: brandTheme.isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)",
                  border: `1px solid ${brandTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_back</span>
                All {store.name} Deals
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

      {/* Sort Toolbar */}
      <section className="max-w-7xl mx-auto px-4 pb-6">
        <div className="no-scrollbar" style={{
          display: "flex", gap: "6px", overflowX: "auto",
          backgroundColor: "#fff", borderRadius: "14px",
          border: "1px solid #E8E8E8", padding: "12px 14px",
        }}>
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
      </section>

      {/* Coupons Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <DealGridSkeleton count={8} />
        ) : coupons.length > 0 ? (
          <div className="store-masonry">
            {coupons.map((deal) => (
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
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>&#128273;</div>
            <p style={{ color: "#888", fontWeight: 600, fontSize: "14px", marginBottom: "8px" }}>
              No coupon codes available right now.
            </p>
            <Link
              href={`/stores/${store.slug}`}
              style={{ fontSize: "13px", fontWeight: 700, color: "#059669", textDecoration: "underline" }}
            >
              View all {store.name} deals
            </Link>
          </div>
        )}
      </section>

      {/* SEO Footer */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div style={{
          backgroundColor: "#fff", borderRadius: "16px",
          border: "1px solid #E8E8E8", padding: "28px 24px",
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#1A1A1A", marginBottom: "12px" }}>
            {store.name} Promo Codes for {monthYear}
          </h3>
          <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.7 }}>
            Copy and paste verified {store.name} coupon codes at checkout to save instantly.
            All promo codes are tested by our community and verified using AI to ensure
            they work. Check back daily for new {store.name} discount codes and exclusive offers.
          </p>
        </div>
      </section>
    </>
  );
}
