"use client";

import { getUserRank, getNextRank, getProgressToNextRank } from "@/lib/gamification";

interface XPProgressBarProps {
  xp: number;
  showLabel?: boolean;
  height?: number;
}

export function XPProgressBar({ xp, showLabel = true, height = 12 }: XPProgressBarProps) {
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
          backgroundColor: "#F1F5F9",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          className="animate-progress-fill"
          style={{
            height: "100%",
            width: `${progress.percent}%`,
            borderRadius: height,
            background: `linear-gradient(90deg, ${rank.color}, ${nextRank?.color || rank.color})`,
            boxShadow: `0 0 14px ${rank.color}50`,
            position: "relative",
            overflow: "hidden",
            // @ts-expect-error CSS custom property
            "--progress-width": `${progress.percent}%`,
          }}
        >
          {/* Shimmer sweep */}
          <div
            className="animate-gold-shimmer"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "50%",
              height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
            }}
          />
        </div>
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
          <span style={{ color: "#64748B" }}>
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
