"use client";

import type { LeaderboardEntry } from "@/lib/gamification";
import { RankBadge } from "./RankBadge";
import { getUserRank } from "@/lib/gamification";

interface PodiumSectionProps {
  entries: LeaderboardEntry[];
}

function PodiumCard({ entry, place }: { entry: LeaderboardEntry; place: 1 | 2 | 3 }) {
  const rank = getUserRank(entry.xp);
  const isFirst = place === 1;

  const medals: Record<number, { icon: string; color: string; bg: string; label: string }> = {
    1: { icon: "emoji_events", color: "#F59E0B", bg: "linear-gradient(135deg, #78350f, #92400e, #b45309)", label: "1st" },
    2: { icon: "emoji_events", color: "#A8A9AD", bg: "linear-gradient(135deg, #374151, #4b5563, #6b7280)", label: "2nd" },
    3: { icon: "emoji_events", color: "#CD7F32", bg: "linear-gradient(135deg, #7c2d12, #9a3412, #b45309)", label: "3rd" },
  };

  const medal = medals[place];

  return (
    <div
      className={isFirst ? "animate-podium-glow" : ""}
      style={{
        background: medal.bg,
        borderRadius: 18,
        padding: isFirst ? "28px 20px 24px" : "20px 16px 18px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        border: `1px solid ${medal.color}25`,
        flex: isFirst ? "1.2" : "1",
        maxWidth: isFirst ? 240 : 200,
        order: place === 2 ? 0 : place === 1 ? 1 : 2,
      }}
    >
      {/* Medal icon */}
      <div
        className={isFirst ? "animate-crown-float" : ""}
        style={{
          position: "absolute",
          top: -14,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "#111",
          border: `2px solid ${medal.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 16px ${medal.color}40`,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: medal.color }}>
          {medal.icon}
        </span>
      </div>

      {/* Position label */}
      <span style={{ fontSize: 10, fontWeight: 900, color: medal.color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, marginTop: 4 }}>
        {medal.label} PLACE
      </span>

      {/* Avatar */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        {entry.photoURL ? (
          <img
            src={entry.photoURL}
            alt=""
            referrerPolicy="no-referrer"
            style={{
              width: isFirst ? 64 : 52,
              height: isFirst ? 64 : 52,
              borderRadius: "50%",
              objectFit: "cover",
              border: `3px solid ${medal.color}`,
              boxShadow: `0 0 20px ${medal.color}30`,
            }}
          />
        ) : (
          <div
            style={{
              width: isFirst ? 64 : 52,
              height: isFirst ? 64 : 52,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${rank.color}, ${rank.color}80)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `3px solid ${medal.color}`,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: isFirst ? 28 : 24, color: "#fff" }}>person</span>
          </div>
        )}
      </div>

      {/* Name */}
      <span style={{
        fontSize: isFirst ? 14 : 12,
        fontWeight: 800,
        color: "#fff",
        marginBottom: 6,
        textAlign: "center",
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {entry.displayName}
      </span>

      {/* Rank badge */}
      <div style={{ marginBottom: 10 }}>
        <RankBadge xp={entry.xp} size="sm" />
      </div>

      {/* XP */}
      <span
        className="animate-xp-pulse"
        style={{ fontSize: isFirst ? 22 : 18, fontWeight: 900, color: medal.color, letterSpacing: "-0.02em" }}
      >
        {entry.xp.toLocaleString()}
      </span>
      <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
        XP
      </span>

      {/* Mini stats */}
      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>local_offer</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>{entry.dealsSubmitted}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>arrow_upward</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>{entry.totalUpvotes}</span>
        </div>
      </div>
    </div>
  );
}

export function PodiumSection({ entries }: PodiumSectionProps) {
  if (entries.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#cbd5e1", marginBottom: 12, display: "block" }}>leaderboard</span>
        <p style={{ fontSize: 14, fontWeight: 600 }}>No rankings yet. Start submitting deals to climb the leaderboard!</p>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);

  return (
    <div style={{ marginBottom: 40 }}>
      {/* Desktop: side-by-side podium */}
      <div className="hidden md:flex" style={{ justifyContent: "center", alignItems: "flex-end", gap: 16, paddingTop: 20 }}>
        {top3[1] && <PodiumCard entry={top3[1]} place={2} />}
        {top3[0] && <PodiumCard entry={top3[0]} place={1} />}
        {top3[2] && <PodiumCard entry={top3[2]} place={3} />}
      </div>

      {/* Mobile: #1 full-width, #2/#3 side-by-side */}
      <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        {top3[0] && (
          <div style={{ width: "100%", maxWidth: 280, display: "flex", justifyContent: "center" }}>
            <PodiumCard entry={top3[0]} place={1} />
          </div>
        )}
        <div style={{ display: "flex", gap: 10, width: "100%", justifyContent: "center" }}>
          {top3[1] && <PodiumCard entry={top3[1]} place={2} />}
          {top3[2] && <PodiumCard entry={top3[2]} place={3} />}
        </div>
      </div>
    </div>
  );
}
