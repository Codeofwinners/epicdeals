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
function ChallengeCard({ challenge, index }: { challenge: WeeklyChallenge; index: number }) {
  const emojis: Record<string, string> = {
    devices: "💻", checkroom: "👗", verified: "✅", chat: "💬",
    share: "📤", add_circle: "➕", thumb_up: "👍", local_fire_department: "🔥",
  };
  const emoji = emojis[challenge.icon] || "🎯";

  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 200,
        background: index === 0
          ? "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)"
          : "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
        borderRadius: 16,
        padding: "20px 18px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle corner glow */}
      <div style={{
        position: "absolute",
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: index === 0
          ? "radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 18 }}>{emoji}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.01em" }}>
              {challenge.title}
            </span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.45)", lineHeight: 1.4, paddingLeft: 1 }}>
            {challenge.description}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <span style={{
          fontSize: 11,
          fontWeight: 800,
          color: index === 0 ? "#38BDF8" : "#FBBF24",
          letterSpacing: "0.02em",
        }}>
          +{challenge.xpReward} XP
        </span>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.04em",
        }}>
          {challenge.target} to complete
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
  const totalMembers = entries?.length || 0;
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
            <span style={{ fontSize: 40 }}>🏆</span>
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
            gap: 0,
            marginBottom: 32,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {[
            { emoji: "👥", label: "Members", value: totalMembers.toLocaleString() },
            { emoji: "⚡", label: "Total XP", value: totalXP.toLocaleString() },
            { emoji: "🏷️", label: "Deals Shared", value: totalDeals.toLocaleString() },
          ].map((stat, i, arr) => (
            <div
              key={stat.label}
              style={{
                flex: "1 1 0",
                padding: "18px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                borderRight: i < arr.length - 1 ? "1px solid #F1F5F9" : "none",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1, marginBottom: 4 }}>{stat.emoji}</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {stat.value}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Weekly Challenges ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🔥</span>
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
              ⏳ {daysLeft === 0 ? "Resets today" : `${daysLeft}d left`}
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {challenges.map((c, i) => (
              <ChallengeCard key={c.id} challenge={c} index={i} />
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
