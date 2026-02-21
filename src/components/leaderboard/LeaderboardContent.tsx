"use client";

import { useState } from "react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useAuth } from "@/components/auth/AuthProvider";
import { PodiumSection } from "./PodiumSection";
import { LeaderboardTable } from "./LeaderboardTable";
import { LeaderboardFilterBar } from "./LeaderboardFilterBar";
import { UserRankCard } from "./UserRankCard";
import { BadgeGrid } from "./BadgeGrid";
import { LeaderboardSkeleton } from "./LeaderboardSkeleton";
import type { LeaderboardPeriod, LeaderboardCategory } from "@/lib/gamification";

const HEADER_STYLE = {
  backgroundColor: "#111111",
  backgroundImage: [
    "repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255,255,255,0.03) 18px, rgba(255,255,255,0.03) 19px)",
    "repeating-linear-gradient(-45deg, transparent, transparent 18px, rgba(255,255,255,0.03) 18px, rgba(255,255,255,0.03) 19px)",
  ].join(", "),
};

export function LeaderboardContent() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<LeaderboardPeriod>("alltime");
  const [category, setCategory] = useState<LeaderboardCategory>("overall");
  const { data: entries, loading } = useLeaderboard(period);

  if (loading) return <LeaderboardSkeleton />;

  // Filter entries by category
  const filteredEntries = entries ? [...entries].sort((a, b) => {
    if (category === "top-dealers") return b.dealsSubmitted - a.dealsSubmitted;
    if (category === "top-commenters") return b.totalUpvotes - a.totalUpvotes; // Proxy for activity
    if (category === "most-verified") return b.dealsSubmitted - a.dealsSubmitted; // Proxy
    return b.xp - a.xp;
  }).map((entry, i) => ({ ...entry, position: i + 1 })) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2", fontFamily: "Manrope, sans-serif" }}>
      {/* ─── Hero Banner ─── */}
      <div style={{ ...HEADER_STYLE, padding: "48px 16px 56px", position: "relative", overflow: "hidden" }}>
        {/* Sparkle accents */}
        <div style={{ position: "absolute", top: 20, right: "15%", opacity: 0.15 }}>
          <span className="material-symbols-outlined animate-sparkle" style={{ fontSize: 32, color: "#F59E0B" }}>auto_awesome</span>
        </div>
        <div style={{ position: "absolute", bottom: 30, left: "10%", opacity: 0.1 }}>
          <span className="material-symbols-outlined animate-sparkle" style={{ fontSize: 24, color: "#0EA5E9", animationDelay: "0.5s" }}>auto_awesome</span>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 10 }}>
          <h1 style={{
            fontSize: "clamp(28px, 6vw, 48px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "#fff",
            marginBottom: 12,
          }}>
            LEADERBOARD
          </h1>
          <p style={{
            fontSize: "clamp(13px, 2.5vw, 16px)",
            fontWeight: 500,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "-0.01em",
          }}>
            Who's finding the best deals?
          </p>
        </div>
      </div>

      {/* ─── Your Rank Card (auth'd users only) ─── */}
      {user && <UserRankCard period={period} />}

      {/* ─── Main Content ─── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>
        {/* Filter Bar */}
        <LeaderboardFilterBar
          period={period}
          category={category}
          onPeriodChange={setPeriod}
          onCategoryChange={setCategory}
        />

        {/* Podium */}
        <PodiumSection entries={filteredEntries} />

        {/* Table */}
        <LeaderboardTable entries={filteredEntries} />

        {/* Badge Grid */}
        <BadgeGrid />
      </div>
    </div>
  );
}
