"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { getFilteredDeals, getNewDeals, type TimeRange, type SortCategory } from "@/lib/firestore";
import DynamicDealCard from "@/components/deals/DynamicDealCard";
import { FilterBar } from "@/components/deals/FilterBar";
import type { Deal } from "@/types/deals";

function getCategoryEmoji(deal: Deal): string {
  const name = (deal.store?.name || "").toLowerCase();
  // Store-specific emojis
  if (name.includes("amazon")) return "📦";
  if (name.includes("nike")) return "👟";
  if (name.includes("adidas")) return "👟";
  if (name.includes("apple")) return "🍎";
  if (name.includes("best buy")) return "🖥️";
  if (name.includes("walmart")) return "🛒";
  if (name.includes("target")) return "🎯";
  if (name.includes("costco")) return "🏪";
  if (name.includes("starbucks")) return "☕";
  if (name.includes("uber") || name.includes("doordash") || name.includes("grubhub")) return "🍔";
  if (name.includes("airbnb") || name.includes("booking") || name.includes("expedia")) return "✈️";
  if (name.includes("sephora") || name.includes("ulta")) return "💄";
  if (name.includes("home depot") || name.includes("lowe")) return "🔨";
  // Category-based fallback
  const cat = (typeof deal.category === "string" ? deal.category : deal.category?.slug || "").toLowerCase();
  if (cat.includes("electronics") || cat.includes("software")) return "💻";
  if (cat.includes("fashion")) return "👗";
  if (cat.includes("food")) return "🍔";
  if (cat.includes("travel")) return "✈️";
  if (cat.includes("health") || cat.includes("beauty")) return "💄";
  if (cat.includes("home")) return "🏠";
  if (cat.includes("entertainment")) return "🎬";
  if (cat.includes("sports")) return "⚽";
  if (cat.includes("automotive")) return "🚗";
  return "🏷️";
}

export default function Home() {
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [deals, setDeals] = useState<Deal[]>([]);
  const [justAdded, setJustAdded] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("last-7d");
  const [sortBy, setSortBy] = useState<SortCategory>("most-voted");

  const toggleComments = (dealId: string) => {
    setOpenComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) newSet.delete(dealId);
      else newSet.add(dealId);
      return newSet;
    });
  };

  useEffect(() => {
    fetchDeals();
    getNewDeals(4).then(setJustAdded).catch(console.error);
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [timeRange, sortBy]);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const results = await getFilteredDeals({ timeRange, sortBy, limit: 12 });
      setDeals(results);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body {
          min-height: 100vh;
          background-color: #FAF7F2;
          background-image:
            repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(0,0,0,0.03) 18px, rgba(0,0,0,0.03) 19px),
            repeating-linear-gradient(-45deg, transparent, transparent 18px, rgba(0,0,0,0.03) 18px, rgba(0,0,0,0.03) 19px);
        }
        .masonry-grid { column-count: 2; column-gap: 12px; }
        .masonry-item { break-inside: avoid; margin-bottom: 12px; }
        @media (min-width: 768px) {
          .masonry-grid { column-count: unset; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; align-items: start; }
          .masonry-item { margin-bottom: 0; }
        }
        .deal-card { transition: transform 0.2s; }
        .deal-card:hover { transform: translateY(-1px); }
        .just-added-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.12) !important; }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .verified-strip { background: linear-gradient(90deg, #059669, #10b981, #34d399, #10b981, #059669); background-size: 300% auto; animation: shimmer 4s linear infinite; }

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

      {/* DESKTOP */}
      <div className="hidden md:block bg-transparent text-black font-display min-h-screen antialiased">
        <main className="px-6 py-6 max-w-7xl mx-auto">
          {/* Just Added row */}
          {justAdded.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#10B981", boxShadow: "0 0 8px #10B981" }} className="animate-live-pulse" />
                <h2 style={{ fontSize: "12px", fontWeight: 800, color: "#64748B", letterSpacing: "0.1em", textTransform: "uppercase" }}>Just Added</h2>
              </div>
              <div className="no-scrollbar" style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
                {justAdded.map((deal) => (
                  <Link
                    key={deal.id}
                    href={deal.dealUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="just-added-card"
                    style={{
                      minWidth: "250px",
                      maxWidth: "290px",
                      padding: "0",
                      background: "linear-gradient(145deg, #0A0A0A 0%, #141414 100%)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "16px",
                      textDecoration: "none",
                      color: "inherit",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      transition: "all 0.25s cubic-bezier(0.25,0.46,0.45,0.94)",
                      position: "relative",
                    }}
                  >
                    {/* Top: Discount hero strip */}
                    <div style={{
                      padding: "14px 18px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}>
                      {(deal.discount || deal.savingsAmount) ? (
                        <span style={{
                          fontSize: "20px",
                          fontWeight: 900,
                          letterSpacing: "-0.03em",
                          background: "linear-gradient(135deg, #34D399, #10B981)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          lineHeight: 1,
                        }}>
                          {deal.discount || deal.savingsAmount}
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Deal</span>
                      )}
                      <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "rgba(255,255,255,0.15)" }}>north_east</span>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "14px 18px 16px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                      <span style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#FFFFFF",
                        lineHeight: 1.35,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        letterSpacing: "-0.01em",
                      }}>{deal.title}</span>

                      {/* Store + category */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "auto" }}>
                        <span style={{ fontSize: "13px", lineHeight: 1 }}>{getCategoryEmoji(deal)}</span>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{deal.store.name}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <FilterBar timeRange={timeRange} setTimeRange={setTimeRange} sortBy={sortBy} setSortBy={setSortBy} />
          {loading ? (
            <div className="flex items-center justify-center p-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : (
            <div className="masonry-grid">
              {deals.map((deal) => (
                <div key={deal.id} className="masonry-item">
                  <DynamicDealCard deal={deal} isOpen={openComments.has(deal.id)} toggleComments={() => toggleComments(deal.id)} />
                </div>
              ))}
            </div>
          )}
        </main>

      </div>

      {/* MOBILE */}
      <div className="md:hidden bg-transparent text-black font-display min-h-screen antialiased">
        <main className="px-3 pt-2 pb-8">
          {/* Just Added row — mobile */}
          {justAdded.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#10B981", boxShadow: "0 0 6px #10B981" }} className="animate-live-pulse" />
                <h2 style={{ fontSize: "10px", fontWeight: 800, color: "#64748B", letterSpacing: "0.1em", textTransform: "uppercase" }}>Just Added</h2>
              </div>
              <div className="no-scrollbar" style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                {justAdded.map((deal) => (
                  <Link
                    key={deal.id}
                    href={deal.dealUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="just-added-card"
                    style={{
                      minWidth: "200px",
                      maxWidth: "240px",
                      padding: "0",
                      background: "linear-gradient(145deg, #0A0A0A 0%, #141414 100%)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "14px",
                      textDecoration: "none",
                      color: "inherit",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {/* Top: Discount hero strip */}
                    <div style={{
                      padding: "12px 14px 10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}>
                      {(deal.discount || deal.savingsAmount) ? (
                        <span style={{
                          fontSize: "17px",
                          fontWeight: 900,
                          letterSpacing: "-0.03em",
                          background: "linear-gradient(135deg, #34D399, #10B981)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          lineHeight: 1,
                        }}>
                          {deal.discount || deal.savingsAmount}
                        </span>
                      ) : (
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Deal</span>
                      )}
                      <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "rgba(255,255,255,0.15)" }}>north_east</span>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "10px 14px 14px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#FFFFFF",
                        lineHeight: 1.35,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        letterSpacing: "-0.01em",
                      }}>{deal.title}</span>

                      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "auto" }}>
                        <span style={{ fontSize: "12px", lineHeight: 1 }}>{getCategoryEmoji(deal)}</span>
                        <span style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{deal.store.name}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <FilterBar timeRange={timeRange} setTimeRange={setTimeRange} sortBy={sortBy} setSortBy={setSortBy} />
          <h2 className="text-base font-black tracking-tight mb-3 text-[#1A1A1A]">
            {timeRange === "last-24h" ? "Daily Hits" : timeRange === "last-7d" ? "Weekly Legends" : timeRange === "last-30d" ? "Monthly Best" : "All-Time Best"}
          </h2>
          {loading ? (
            <div className="flex items-center justify-center p-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          ) : (
            <div className="masonry-grid">
              {deals.map((deal) => (
                <div key={deal.id} className="masonry-item">
                  <DynamicDealCard deal={deal} isOpen={openComments.has(deal.id)} toggleComments={() => toggleComments(deal.id)} />
                </div>
              ))}
            </div>
          )}
        </main>

      </div>
      {/* Floating "Add Deal" FAB — mobile-only, always visible */}
      <Link
        href="/submit"
        className="md:hidden fixed bottom-6 right-4 z-50 flex items-center gap-2 no-underline active:scale-95 transition-transform"
        style={{
          padding: "12px 20px",
          background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
          borderRadius: "50px",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 800,
          letterSpacing: "-0.01em",
          textDecoration: "none",
          boxShadow: "0 4px 24px rgba(14,165,233,0.4), 0 2px 8px rgba(0,0,0,0.15)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <span style={{ fontSize: "18px", fontWeight: 900, lineHeight: 1 }}>+</span>
        Add Deal
      </Link>
    </>
  );
}
