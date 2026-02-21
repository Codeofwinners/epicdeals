"use client";

import type { LeaderboardEntry } from "@/lib/gamification";
import { RankBadge } from "./RankBadge";
import { getUserRank } from "@/lib/gamification";

interface PodiumSectionProps {
  entries: LeaderboardEntry[];
}

const PODIUM_CONFIG: Record<
  number,
  {
    borderColor: string;
    icon: string;
    positionLabel: string;
    avatarSize: number;
    xpSize: number;
    paddingTop: number;
    glowShadow: string;
  }
> = {
  1: {
    borderColor: "#F59E0B",
    icon: "\u{1F451}",
    positionLabel: "1st Place",
    avatarSize: 80,
    xpSize: 28,
    paddingTop: 0,
    glowShadow: "0 8px 32px rgba(245,158,11,0.18), 0 0 0 1px rgba(245,158,11,0.08)",
  },
  2: {
    borderColor: "#A8A9AD",
    icon: "\u{1F948}",
    positionLabel: "2nd Place",
    avatarSize: 64,
    xpSize: 22,
    paddingTop: 40,
    glowShadow: "0 4px 16px rgba(0,0,0,0.06)",
  },
  3: {
    borderColor: "#CD7F32",
    icon: "\u{1F949}",
    positionLabel: "3rd Place",
    avatarSize: 64,
    xpSize: 22,
    paddingTop: 60,
    glowShadow: "0 4px 16px rgba(0,0,0,0.06)",
  },
};

function PodiumCard({
  entry,
  place,
}: {
  entry: LeaderboardEntry;
  place: 1 | 2 | 3;
}) {
  const rank = getUserRank(entry.xp);
  const config = PODIUM_CONFIG[place];
  const isFirst = place === 1;

  return (
    <div
      className="animate-podium-rise"
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: isFirst ? "28px 20px 24px" : "20px 16px 18px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        border: `2px solid ${config.borderColor}`,
        boxShadow: config.glowShadow,
        flex: isFirst ? "1.2" : "1",
        maxWidth: isFirst ? 240 : 200,
        animationDelay:
          place === 1 ? "0.1s" : place === 2 ? "0s" : "0.2s",
      }}
    >
      {/* Medal / Crown emoji floating above */}
      <div
        className={isFirst ? "animate-crown-float" : ""}
        style={{
          position: "absolute",
          top: -16,
          fontSize: isFirst ? 28 : 22,
          lineHeight: 1,
        }}
      >
        {config.icon}
      </div>

      {/* Position label */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 900,
          color: config.borderColor,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          marginBottom: 14,
          marginTop: 8,
        }}
      >
        {config.positionLabel}
      </span>

      {/* Avatar */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        {entry.photoURL ? (
          <img
            src={entry.photoURL}
            alt={entry.handle || entry.displayName}
            referrerPolicy="no-referrer"
            style={{
              width: config.avatarSize,
              height: config.avatarSize,
              borderRadius: "50%",
              objectFit: "cover" as const,
              border: `3px solid ${config.borderColor}`,
              boxShadow: isFirst
                ? `0 0 24px rgba(245,158,11,0.3)`
                : `0 0 12px ${config.borderColor}20`,
            }}
          />
        ) : (
          <div
            style={{
              width: config.avatarSize,
              height: config.avatarSize,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${rank.color}, ${rank.color}80)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `3px solid ${config.borderColor}`,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: isFirst ? 36 : 28,
                color: "#fff",
              }}
            >
              person
            </span>
          </div>
        )}
      </div>

      {/* Display name */}
      <span
        style={{
          fontSize: isFirst ? 15 : 13,
          fontWeight: 800,
          color: "#0A0A0A",
          marginBottom: 6,
          textAlign: "center" as const,
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap" as const,
        }}
      >
        @{entry.handle || entry.displayName}
      </span>

      {/* Rank badge */}
      <div style={{ marginBottom: 10 }}>
        <RankBadge xp={entry.xp} size="sm" />
      </div>

      {/* XP value */}
      <span
        style={{
          fontSize: config.xpSize,
          fontWeight: 900,
          color: config.borderColor,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {entry.xp.toLocaleString()}
      </span>
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: "#94A3B8",
          textTransform: "uppercase" as const,
          letterSpacing: "0.08em",
          marginBottom: 10,
          marginTop: 2,
        }}
      >
        XP
      </span>

      {/* Mini stats: deals + upvotes */}
      <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 13, color: "#CBD5E1" }}
          >
            local_offer
          </span>
          <span
            style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}
          >
            {entry.dealsSubmitted}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 13, color: "#CBD5E1" }}
          >
            arrow_upward
          </span>
          <span
            style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}
          >
            {entry.totalUpvotes}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PodiumSection({ entries }: PodiumSectionProps) {
  if (entries.length === 0) {
    return (
      <div
        style={{
          textAlign: "center" as const,
          padding: "40px 20px",
          color: "#94A3B8",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 48,
            color: "#CBD5E1",
            marginBottom: 12,
            display: "block",
          }}
        >
          leaderboard
        </span>
        <p style={{ fontSize: 14, fontWeight: 600 }}>
          No rankings yet. Start submitting deals to climb the leaderboard!
        </p>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);

  return (
    <div style={{ marginBottom: 40 }}>
      {/* Desktop: true podium layout  2nd | 1st | 3rd  with flex-end alignment */}
      <div
        className="hidden md:flex"
        style={{
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 16,
          paddingTop: 20,
        }}
      >
        {top3[1] && (
          <div style={{ paddingTop: PODIUM_CONFIG[2].paddingTop }}>
            <PodiumCard entry={top3[1]} place={2} />
          </div>
        )}
        {top3[0] && (
          <div style={{ paddingTop: PODIUM_CONFIG[1].paddingTop }}>
            <PodiumCard entry={top3[0]} place={1} />
          </div>
        )}
        {top3[2] && (
          <div style={{ paddingTop: PODIUM_CONFIG[3].paddingTop }}>
            <PodiumCard entry={top3[2]} place={3} />
          </div>
        )}
      </div>

      {/* Mobile: 1st full-width on top, then 2nd + 3rd side by side */}
      <div
        className="md:hidden"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "center",
        }}
      >
        {top3[0] && (
          <div
            style={{
              width: "100%",
              maxWidth: 280,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <PodiumCard entry={top3[0]} place={1} />
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 10,
            width: "100%",
            justifyContent: "center",
          }}
        >
          {top3[1] && <PodiumCard entry={top3[1]} place={2} />}
          {top3[2] && <PodiumCard entry={top3[2]} place={3} />}
        </div>
      </div>
    </div>
  );
}
