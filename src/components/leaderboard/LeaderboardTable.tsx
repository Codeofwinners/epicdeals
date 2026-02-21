"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { RankBadge } from "./RankBadge";
import type { LeaderboardEntry } from "@/lib/gamification";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const { user } = useAuth();
  const rows = entries.slice(3); // Positions 4+

  if (rows.length === 0) return null;

  return (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 16, letterSpacing: "-0.01em" }}>
        Rankings
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((entry, index) => {
          const position = index + 4;
          const isCurrentUser = user?.uid === entry.userId;

          return (
            <div
              key={entry.userId}
              className="stagger-1"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 12,
                background: isCurrentUser ? "rgba(14,165,233,0.04)" : position % 2 === 0 ? "#fafbfc" : "#fff",
                border: isCurrentUser ? "1px solid rgba(14,165,233,0.2)" : "1px solid #f1f5f9",
                borderLeft: isCurrentUser ? "3px solid #0891b2" : "1px solid #f1f5f9",
                transition: "all 0.2s ease",
                animationDelay: `${Math.min(index * 0.03, 0.5)}s`,
              }}
            >
              {/* Position */}
              <span style={{
                width: 32,
                textAlign: "center",
                fontSize: 13,
                fontWeight: 800,
                color: isCurrentUser ? "#0891b2" : "#94a3b8",
                flexShrink: 0,
              }}>
                #{position}
              </span>

              {/* Avatar */}
              {entry.photoURL ? (
                <img
                  src={entry.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: `${entry.rankColor}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: entry.rankColor }}>person</span>
                </div>
              )}

              {/* Name + Rank */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: isCurrentUser ? "#0891b2" : "#0f172a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {entry.displayName}
                    {isCurrentUser && <span style={{ marginLeft: 4, fontSize: 9, color: "#0891b2", fontWeight: 800 }}>(You)</span>}
                  </span>
                  <RankBadge xp={entry.xp} size="sm" />
                </div>
              </div>

              {/* Mini stats */}
              <div className="hidden md:flex" style={{ alignItems: "center", gap: 14, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13, color: "#cbd5e1" }}>local_offer</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{entry.dealsSubmitted}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13, color: "#cbd5e1" }}>arrow_upward</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{entry.totalUpvotes}</span>
                </div>
              </div>

              {/* XP */}
              <span style={{
                fontSize: 14,
                fontWeight: 900,
                color: isCurrentUser ? "#0891b2" : "#334155",
                flexShrink: 0,
                letterSpacing: "-0.02em",
              }}>
                {entry.xp.toLocaleString()}
                <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", marginLeft: 2 }}>XP</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
