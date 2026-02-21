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
import {
  getWeeklyChallenges,
  getDaysLeftInWeek,
  type LeaderboardPeriod,
  type LeaderboardCategory,
  type WeeklyChallenge,
} from "@/lib/gamification";

/* ── Weekly Challenge Card ──────────────────────────────────────────────── */
function ChallengeCard({ challenge }: { challenge: WeeklyChallenge }) {
  const categoryColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    deals: { bg: "#FFF7ED", border: "#FDBA74", text: "#C2410C", icon: "#F97316" },
    social: { bg: "#EFF6FF", border: "#93C5FD", text: "#1D4ED8", icon: "#3B82F6" },
    community: { bg: "#F0FDF4", border: "#86EFAC", text: "#15803D", icon: "#22C55E" },
  };
  const colors = categoryColors[challenge.category] || categoryColors.deals;

  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 220,
        backgroundColor: colors.bg,
        border: `1.5px solid ${colors.border}`,
        borderRadius: 14,
        padding: "18px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: `${colors.icon}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: colors.icon }}>
            {challenge.icon}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: colors.text, lineHeight: 1.2 }}>
            {challenge.title}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: `${colors.text}90`, lineHeight: 1.3 }}>
            {challenge.description}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: colors.icon,
            backgroundColor: `${colors.icon}12`,
            padding: "3px 8px",
            borderRadius: 6,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          +{challenge.xpReward} XP
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: `${colors.text}70` }}>
          Target: {challenge.target}
        </span>
      </div>
    </div>
  );
}

/* ── Main LeaderboardContent ────────────────────────────────────────────── */
export function LeaderboardContent() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<LeaderboardPeriod>("alltime");
  const [category, setCategory] = useState<LeaderboardCategory>("overall");
  const { data: entries, loading } = useLeaderboard(period);

  if (loading) return <LeaderboardSkeleton />;

  // Filter entries by category
  const filteredEntries = entries
    ? [...entries]
        .sort((a, b) => {
          if (category === "top-dealers") return b.dealsSubmitted - a.dealsSubmitted;
          if (category === "top-commenters") return b.totalUpvotes - a.totalUpvotes;
          if (category === "most-verified") return b.dealsSubmitted - a.dealsSubmitted;
          if (category === "rising-stars") return (b.streak || 0) - (a.streak || 0) || b.xp - a.xp;
          return b.xp - a.xp;
        })
        .map((entry, i) => ({ ...entry, position: i + 1 }))
    : [];

  // Weekly challenges
  const challenges = getWeeklyChallenges();
  const daysLeft = getDaysLeftInWeek();

  // Quick stats from entries
  const totalPlayers = entries?.length || 0;
  const totalXP = entries?.reduce((sum, e) => sum + e.xp, 0) || 0;
  const totalDeals = entries?.reduce((sum, e) => sum + e.dealsSubmitted, 0) || 0;

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
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: [
              "repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255,255,255,0.03) 18px, rgba(255,255,255,0.03) 19px)",
              "repeating-linear-gradient(-45deg, transparent, transparent 18px, rgba(255,255,255,0.03) 18px, rgba(255,255,255,0.03) 19px)",
            ].join(", "),
            zIndex: 1,
          }}
        />

        {/* Radial glow accent */}
        <div
          style={{
            position: "absolute",
            top: "-30%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "400px",
            background: "radial-gradient(ellipse, rgba(14,165,233,0.12) 0%, transparent 70%)",
            zIndex: 1,
          }}
        />

        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 10 }}>
          {/* Bouncing trophy */}
          <div className="animate-trophy-bounce" style={{ marginBottom: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#F59E0B" }}>
              emoji_events
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 7vw, 56px)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "#fff",
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            LEADERBOARD
          </h1>
          <p
            style={{
              fontSize: "clamp(13px, 2.5vw, 16px)",
              fontWeight: 600,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
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
        {/* ── Quick Stats Row ── */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          {[
            { icon: "group", label: "Players", value: totalPlayers.toLocaleString(), color: "#0EA5E9" },
            { icon: "bolt", label: "Total XP", value: totalXP.toLocaleString(), color: "#F59E0B" },
            { icon: "local_offer", label: "Deals Shared", value: totalDeals.toLocaleString(), color: "#22C55E" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: "1 1 0",
                minWidth: 100,
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E4E4",
                borderRadius: 12,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: `${stat.color}10`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: stat.color }}>
                  {stat.icon}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Weekly Challenges ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#F59E0B" }}>
                local_fire_department
              </span>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em", margin: 0 }}>
                Weekly Challenges
              </h2>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#94A3B8",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
              {daysLeft === 0 ? "Resets today" : `${daysLeft}d left`}
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {challenges.map((c) => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        </div>

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
