"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useUserXP } from "@/hooks/useGamification";
import { useUserRank } from "@/hooks/useLeaderboard";
import { RankBadge } from "./RankBadge";
import { XPProgressBar } from "./XPProgressBar";
import type { LeaderboardPeriod } from "@/lib/gamification";

interface UserRankCardProps {
  period: LeaderboardPeriod;
}

export function UserRankCard({ period }: UserRankCardProps) {
  const { user } = useAuth();
  const { data: xpData, loading: xpLoading } = useUserXP(user?.uid);
  const { data: rankData, loading: rankLoading } = useUserRank(user?.uid, period);

  if (!user) return null;

  const loading = xpLoading || rankLoading;

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E4E4E4",
          borderRadius: 16,
          padding: "20px 24px",
          maxWidth: 600,
          margin: "0 auto 24px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F1F5F9" }} className="animate-shimmer" />
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, width: 120, background: "#F1F5F9", borderRadius: 6, marginBottom: 8 }} className="animate-shimmer" />
            <div style={{ height: 12, width: "100%", background: "#F1F5F9", borderRadius: 8 }} className="animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  const xp = xpData?.xp || 0;
  const rank = xpData?.rank;
  const position = rankData?.position || -1;

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E4E4E4",
        borderRadius: 16,
        padding: "20px 24px",
        maxWidth: 600,
        margin: "0 auto 24px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}
    >
      {/* Row 1: Avatar + Name/Badge + Position */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        {/* Avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              referrerPolicy="no-referrer"
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                objectFit: "cover",
                border: `3px solid ${rank?.color || "#94A3B8"}`,
                boxShadow: `0 0 20px ${rank?.color || "#94A3B8"}25`,
              }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${rank?.color || "#94A3B8"}, ${rank?.color || "#94A3B8"}80)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `3px solid ${rank?.color || "#94A3B8"}`,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#fff" }}>person</span>
            </div>
          )}
        </div>

        {/* Name + Badge */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#0A0A0A", letterSpacing: "-0.01em" }}>
              {user.displayName || "You"}
            </span>
            <RankBadge xp={xp} size="sm" />
          </div>
        </div>

        {/* Position pill */}
        {position > 0 && (
          <div
            style={{
              padding: "6px 12px",
              borderRadius: 10,
              backgroundColor: "#F1F5F9",
              border: "1px solid #E2E8F0",
              fontSize: 13,
              fontWeight: 900,
              color: "#334155",
              flexShrink: 0,
            }}
          >
            #{position}
          </div>
        )}
      </div>

      {/* Row 2: Large XP + Progress Bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: rank?.color || "#0A0A0A", letterSpacing: "-0.03em", lineHeight: 1 }}>
            {xp.toLocaleString()}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            XP
          </span>
        </div>
        <XPProgressBar xp={xp} height={12} />
      </div>

      {/* Row 3: Rank progress info */}
      {xpData?.nextRank && (
        <div style={{
          paddingTop: 14,
          borderTop: "1px solid #F1F5F9",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#94A3B8" }}>trending_up</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>
            {xpData.progress.needed} XP to reach <span style={{ fontWeight: 800, color: xpData.nextRank.color }}>{xpData.nextRank.name}</span>
          </span>
        </div>
      )}
    </div>
  );
}
