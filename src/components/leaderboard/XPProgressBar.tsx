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

  const fillColor = rank.color;
  const targetColor = nextRank?.color || rank.color;

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
        {/* Filled portion */}
        <div
          className="animate-progress-fill"
          style={{
            height: "100%",
            width: `${progress.percent}%`,
            borderRadius: height,
            background: `linear-gradient(90deg, ${fillColor}, ${targetColor})`,
            boxShadow: `0 0 14px ${fillColor}50`,
            position: "relative",
            overflow: "hidden",
            transition: "width 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
            // @ts-expect-error CSS custom property for animation
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
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
            }}
          />
        </div>
      </div>

      {/* Labels */}
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
          <span style={{ color: "#334155" }}>
            {progress.needed} XP to {nextRank.name}
          </span>
          <span style={{ color: "#334155", fontWeight: 800 }}>
            {progress.percent}%
          </span>
        </div>
      )}
      {showLabel && !nextRank && (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            fontWeight: 700,
            color: "#334155",
            textAlign: "center",
          }}
        >
          MAX RANK ACHIEVED
        </div>
      )}
    </div>
  );
}
