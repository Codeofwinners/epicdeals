"use client";

import { getUserRank, getNextRank, getProgressToNextRank } from "@/lib/gamification";

interface XPProgressBarProps {
  xp: number;
  showLabel?: boolean;
  height?: number;
}

export function XPProgressBar({ xp, showLabel = true, height = 8 }: XPProgressBarProps) {
  const rank = getUserRank(xp);
  const nextRank = getNextRank(xp);
  const progress = getProgressToNextRank(xp);

  return (
    <div style={{ width: "100%" }}>
      {/* Progress bar track */}
      <div
        style={{
          width: "100%",
          height,
          borderRadius: height,
          background: "rgba(255,255,255,0.1)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress.percent}%`,
            borderRadius: height,
            background: `linear-gradient(90deg, ${rank.color}, ${nextRank?.color || rank.color})`,
            transition: "width 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
            boxShadow: `0 0 12px ${rank.color}40`,
          }}
        />
      </div>

      {/* Label */}
      {showLabel && nextRank && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 6,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.5)" }}>
            {progress.needed} XP to {nextRank.name}
          </span>
          <span style={{ color: rank.color, fontWeight: 800 }}>
            {progress.percent}%
          </span>
        </div>
      )}
      {showLabel && !nextRank && (
        <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: "#F59E0B", textAlign: "center" }}>
          MAX RANK ACHIEVED
        </div>
      )}
    </div>
  );
}
