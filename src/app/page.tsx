"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { getFilteredDeals, getNewDeals, type TimeRange, type SortCategory } from "@/lib/firestore";
import DynamicDealCard from "@/components/deals/DynamicDealCard";
import { FilterBar } from "@/components/deals/FilterBar";
import type { Deal } from "@/types/deals";

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
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#f59e0b" }}>auto_awesome</span>
                <h2 style={{ fontSize: "15px", fontWeight: 900, color: "#1A1A1A", letterSpacing: "-0.02em" }}>Just Added</h2>
              </div>
              <div className="no-scrollbar" style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "4px" }}>
                {justAdded.map((deal) => (
                  <Link
                    key={deal.id}
                    href={deal.dealUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      minWidth: "220px",
                      maxWidth: "260px",
                      padding: "14px 16px",
                      backgroundColor: "#fff",
                      border: "1px solid #E4E4E4",
                      borderRadius: "14px",
                      textDecoration: "none",
                      color: "inherit",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      transition: "transform 0.15s",
                    }}
                    className="hover:scale-[1.02]"
                  >
                    <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#BBBBBB" }}>{deal.store.name}</span>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#0A0A0A", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{deal.title}</span>
                    {(deal.discount || deal.savingsAmount) && (
                      <span style={{
                        display: "inline-flex",
                        alignSelf: "flex-start",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "10px",
                        fontWeight: 800,
                        letterSpacing: "0.02em",
                        backgroundColor: "#ecfdf5",
                        color: "#059669",
                        border: "1px solid #a7f3d0",
                      }}>
                        {deal.discount || deal.savingsAmount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard CTA Banner — Desktop */}
          <Link
            href="/leaderboard"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              marginBottom: "20px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #111111 0%, #1a1a2e 100%)",
              border: "1px solid rgba(245,158,11,0.2)",
              textDecoration: "none",
              color: "inherit",
              transition: "all 0.2s ease",
              overflow: "hidden",
              position: "relative",
            }}
            className="hover:border-amber-400/40 hover:shadow-lg group"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", zIndex: 1 }}>
              <div style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "#fff" }}>emoji_events</span>
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                  Leaderboard &amp; Ranks
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
                  Earn XP by submitting deals, getting upvotes &amp; helping the community
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", zIndex: 1 }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#F59E0B" }}>View Rankings</span>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#F59E0B" }}>arrow_forward</span>
            </div>
          </Link>

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
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#f59e0b" }}>auto_awesome</span>
                <h2 style={{ fontSize: "13px", fontWeight: 900, color: "#1A1A1A", letterSpacing: "-0.02em" }}>Just Added</h2>
              </div>
              <div className="no-scrollbar" style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>
                {justAdded.map((deal) => (
                  <Link
                    key={deal.id}
                    href={deal.dealUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      minWidth: "180px",
                      maxWidth: "220px",
                      padding: "12px 14px",
                      backgroundColor: "#fff",
                      border: "1px solid #E4E4E4",
                      borderRadius: "12px",
                      textDecoration: "none",
                      color: "inherit",
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                    }}
                  >
                    <span style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#BBBBBB" }}>{deal.store.name}</span>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#0A0A0A", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{deal.title}</span>
                    {(deal.discount || deal.savingsAmount) && (
                      <span style={{
                        display: "inline-flex",
                        alignSelf: "flex-start",
                        padding: "2px 6px",
                        borderRadius: "5px",
                        fontSize: "9px",
                        fontWeight: 800,
                        backgroundColor: "#ecfdf5",
                        color: "#059669",
                        border: "1px solid #a7f3d0",
                      }}>
                        {deal.discount || deal.savingsAmount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard CTA Banner — Mobile */}
          <Link
            href="/leaderboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 14px",
              marginBottom: "12px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #111111 0%, #1a1a2e 100%)",
              border: "1px solid rgba(245,158,11,0.2)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#fff" }}>emoji_events</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                Leaderboard &amp; Ranks
              </div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginTop: "1px" }}>
                Earn XP by submitting deals &amp; helping the community
              </div>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#F59E0B", flexShrink: 0 }}>arrow_forward</span>
          </Link>

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
