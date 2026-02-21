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
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: "20px 24px",
          margin: "-40px auto 32px",
          maxWidth: 600,
          position: "relative",
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} className="animate-shimmer" />
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, width: 120, background: "rgba(255,255,255,0.1)", borderRadius: 6, marginBottom: 8 }} className="animate-shimmer" />
            <div style={{ height: 8, width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 8 }} className="animate-shimmer" />
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
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: "20px 24px",
        margin: "-40px auto 32px",
        maxWidth: 600,
        position: "relative",
        zIndex: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              referrerPolicy="no-referrer"
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${rank?.color || "#94A3B8"}`,
                boxShadow: `0 0 16px ${rank?.color || "#94A3B8"}30`,
              }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${rank?.color || "#94A3B8"}, ${rank?.color || "#94A3B8"}80)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid rgba(255,255,255,0.2)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#fff" }}>person</span>
            </div>
          )}
          {position > 0 && (
            <div
              style={{
                position: "absolute",
                bottom: -4,
                right: -4,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#111",
                border: "2px solid rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 900,
                color: "#fff",
              }}
            >
              #{position}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
              {user.displayName || "You"}
            </span>
            <RankBadge xp={xp} size="sm" />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: rank?.color || "#fff", letterSpacing: "-0.02em" }}>
              {xp.toLocaleString()}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              XP
            </span>
          </div>

          <XPProgressBar xp={xp} height={6} />
        </div>
      </div>
    </div>
  );
}
