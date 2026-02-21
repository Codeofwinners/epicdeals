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
    sm: { fontSize: 10, emojiSize: 12, padding: "2px 8px", gap: 3, borderRadius: 999 },
    md: { fontSize: 12, emojiSize: 15, padding: "4px 12px", gap: 5, borderRadius: 999 },
    lg: { fontSize: 14, emojiSize: 19, padding: "6px 16px", gap: 6, borderRadius: 999 },
  };

  const s = sizes[size];
  const isPlatinum = rank.name === "Platinum";

  return (
    <span
      className={isPlatinum ? "animate-mythic-shimmer" : ""}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        padding: s.padding,
        borderRadius: s.borderRadius,
        fontSize: s.fontSize,
        fontWeight: 800,
        letterSpacing: "-0.01em",
        color: rank.color,
        background: `${rank.color}15`,
        border: `1px solid ${rank.color}25`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      <span style={{ fontSize: s.emojiSize, lineHeight: 1 }}>
        {rank.emoji}
      </span>
      {rank.name}
    </span>
  );
}
