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

export function LeaderboardContent() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<LeaderboardPeriod>("alltime");
  const [category, setCategory] = useState<LeaderboardCategory>("overall");
  const { data: entries, loading } = useLeaderboard(period);

  if (loading) return <LeaderboardSkeleton />;

  // Filter entries by category
  const filteredEntries = entries ? [...entries].sort((a, b) => {
    if (category === "top-dealers") return b.dealsSubmitted - a.dealsSubmitted;
    if (category === "top-commenters") return b.totalUpvotes - a.totalUpvotes;
    if (category === "most-verified") return b.dealsSubmitted - a.dealsSubmitted;
    return b.xp - a.xp;
  }).map((entry, i) => ({ ...entry, position: i + 1 })) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2", fontFamily: "Manrope, sans-serif" }}>
      {/* ─── Hero Banner ─── */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "48px 16px 40px",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #0F172A 100%)",
        }}
      >
        {/* Diagonal stripes overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: [
            "repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255,255,255,0.03) 18px, rgba(255,255,255,0.03) 19px)",
            "repeating-linear-gradient(-45deg, transparent, transparent 18px, rgba(255,255,255,0.03) 18px, rgba(255,255,255,0.03) 19px)",
          ].join(", "),
          zIndex: 1,
        }} />

        {/* Radial glow accent */}
        <div style={{
          position: "absolute",
          top: "-30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(14,165,233,0.12) 0%, transparent 70%)",
          zIndex: 1,
        }} />

        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 10 }}>
          {/* Bouncing trophy */}
          <div className="animate-trophy-bounce" style={{ marginBottom: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#F59E0B" }}>emoji_events</span>
          </div>

          <h1 style={{
            fontSize: "clamp(32px, 7vw, 56px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "#fff",
            marginBottom: 10,
            textTransform: "uppercase",
          }}>
            LEADERBOARD
          </h1>
          <p style={{
            fontSize: "clamp(13px, 2.5vw, 16px)",
            fontWeight: 600,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
            Compete &middot; Climb &middot; Conquer
          </p>

          {/* UserRankCard INSIDE hero */}
          {user && (
            <div style={{ marginTop: 28 }}>
              <UserRankCard period={period} />
            </div>
          )}
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px 0" }}>
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
