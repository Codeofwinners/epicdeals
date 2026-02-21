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

/* ── Skeleton shimmer shown while data loads ─────────────────────────────── */
function SkeletonCard() {
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
      {/* Row 1 skeleton */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <div
          className="animate-shimmer"
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#F1F5F9",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="animate-shimmer"
            style={{ height: 14, width: 130, background: "#F1F5F9", borderRadius: 6, marginBottom: 8 }}
          />
          <div
            className="animate-shimmer"
            style={{ height: 10, width: 80, background: "#F1F5F9", borderRadius: 6 }}
          />
        </div>
        <div
          className="animate-shimmer"
          style={{ width: 44, height: 30, borderRadius: 10, background: "#F1F5F9", flexShrink: 0 }}
        />
      </div>

      {/* Row 2 skeleton */}
      <div style={{ marginBottom: 18 }}>
        <div
          className="animate-shimmer"
          style={{ height: 28, width: 100, background: "#F1F5F9", borderRadius: 8, marginBottom: 12 }}
        />
        <div
          className="animate-shimmer"
          style={{ height: 12, width: "100%", background: "#F1F5F9", borderRadius: 8 }}
        />
      </div>

      {/* Row 3 skeleton */}
      <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
        <div
          className="animate-shimmer"
          style={{ height: 10, width: 200, background: "#F1F5F9", borderRadius: 6 }}
        />
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export function UserRankCard({ period }: UserRankCardProps) {
  const { user, userProfile } = useAuth();
  const { data: xpData, loading: xpLoading } = useUserXP(user?.uid);
  const { data: rankData, loading: rankLoading } = useUserRank(user?.uid, period);

  if (!user) return null;

  const loading = xpLoading || rankLoading;

  if (loading) return <SkeletonCard />;

  const xp = xpData?.xp || 0;
  const rank = xpData?.rank;
  const nextRank = xpData?.nextRank ?? null;
  const progress = xpData?.progress;
  const position = rankData?.position || -1;
  const rankColor = rank?.color || "#94A3B8";

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
      {/* ── Row 1: Avatar + Name / RankBadge + Position pill ─────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        {/* Avatar with rank-colored border + glow */}
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
                border: `3px solid ${rankColor}`,
                boxShadow: `0 0 18px ${rankColor}30`,
              }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${rankColor}, ${rankColor}80)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `3px solid ${rankColor}`,
                boxShadow: `0 0 18px ${rankColor}30`,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 28, color: "#fff" }}
              >
                person
              </span>
            </div>
          )}
        </div>

        {/* Name + RankBadge */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#0A0A0A",
                letterSpacing: "-0.01em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              @{userProfile?.handle || "user"}
            </span>
            <RankBadge xp={xp} size="sm" />
          </div>
        </div>

        {/* Position pill */}
        {position > 0 && (
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 10,
              backgroundColor: "#F1F5F9",
              border: "1px solid #E2E8F0",
              fontSize: 13,
              fontWeight: 900,
              color: "#334155",
              flexShrink: 0,
              letterSpacing: "-0.01em",
            }}
          >
            #{position}
          </div>
        )}
      </div>

      {/* ── Row 2: Large XP number + chunky progress bar ────────────────── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
          <span
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: rankColor,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {xp.toLocaleString()}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            XP
          </span>
        </div>
        <XPProgressBar xp={xp} height={12} showLabel={false} />
      </div>

      {/* ── Row 3: Current rank perk ────────────────────────────────────── */}
      {rank?.perk && (
        <div
          style={{
            borderTop: "1px solid #F1F5F9",
            paddingTop: 14,
            marginBottom: nextRank ? 12 : 0,
            display: "flex",
            alignItems: "flex-start",
            gap: 6,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 14, color: rankColor, marginTop: 1, flexShrink: 0 }}
          >
            star
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B", lineHeight: 1.4 }}>
            <span style={{ fontWeight: 800, color: rankColor }}>{rank.name}</span>{" "}
            perk: {rank.perk}
          </span>
        </div>
      )}

      {/* ── Row 4: Next rank callout (if not at max) ────────────────────── */}
      {nextRank && progress && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            ...(rank?.perk ? {} : { borderTop: "1px solid #F1F5F9", paddingTop: 14 }),
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 14, color: "#94A3B8", flexShrink: 0 }}
          >
            trending_up
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>
            {progress.needed.toLocaleString()} XP to reach{" "}
            <span style={{ fontWeight: 800, color: nextRank.color }}>{nextRank.name}</span>
          </span>
        </div>
      )}
    </div>
  );
}
