"use client";

import { getUserRank, type RankTier } from "@/lib/gamification";

interface RankBadgeProps {
  xp: number;
  size?: "sm" | "md" | "lg";
  rank?: RankTier;
}

export function RankBadge({ xp, size = "sm", rank: rankOverride }: RankBadgeProps) {
  const rank = rankOverride || getUserRank(xp);

  const sizes = {
    sm: { fontSize: 9, iconSize: 11, padding: "2px 6px", gap: 3, borderRadius: 6 },
    md: { fontSize: 11, iconSize: 14, padding: "4px 10px", gap: 5, borderRadius: 8 },
    lg: { fontSize: 13, iconSize: 18, padding: "5px 14px", gap: 6, borderRadius: 10 },
  };

  const s = sizes[size];
  const isMythic = rank.name === "Mythic";

  return (
    <span
      className={isMythic ? "animate-mythic-shimmer" : ""}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        padding: s.padding,
        borderRadius: s.borderRadius,
        fontSize: s.fontSize,
        fontWeight: 800,
        letterSpacing: "-0.01em",
        color: isMythic ? "#F59E0B" : rank.color,
        background: isMythic
          ? "linear-gradient(135deg, #1a1a1a, #000)"
          : `${rank.color}15`,
        border: `1px solid ${isMythic ? "#F59E0B33" : rank.color + "25"}`,
        boxShadow: isMythic ? "0 2px 8px rgba(245,158,11,0.2)" : "0 1px 3px rgba(0,0,0,0.04)",
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: s.iconSize, color: rank.color, lineHeight: 1 }}
      >
        {rank.icon}
      </span>
      {rank.name}
    </span>
  );
}
