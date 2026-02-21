"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { RankBadge } from "./RankBadge";
import { getUserRank } from "@/lib/gamification";
import type { LeaderboardEntry } from "@/lib/gamification";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

function getPositionStyle(position: number): { color: string; weight: number } {
  if (position <= 6) return { color: "#F59E0B", weight: 900 };
  if (position <= 10) return { color: "#0EA5E9", weight: 800 };
  return { color: "#94A3B8", weight: 700 };
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const { user } = useAuth();
  const rows = entries.slice(3); // Positions 4+

  if (rows.length === 0) return null;

  // Find user's position for "nearby competitors" logic
  const userIndex = user ? rows.findIndex(e => e.userId === user.uid) : -1;

  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em", margin: 0 }}>
          Rankings
        </h2>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8" }}>
          {rows.length} players
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((entry, index) => {
          const position = index + 4;
          const isCurrentUser = user?.uid === entry.userId;
          const rank = getUserRank(entry.xp);
          const posStyle = getPositionStyle(position);

          // Highlight nearby competitors
          const isNearby = userIndex >= 0 && Math.abs(index - userIndex) <= 2 && !isCurrentUser;

          return (
            <div
              key={entry.userId}
              className="animate-row-slide-in"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderRadius: 14,
                backgroundColor: isCurrentUser ? "#EFF9FF" : isNearby ? "#FEFCE8" : "#FFFFFF",
                border: isCurrentUser ? "1.5px solid #0EA5E9" : isNearby ? "1px solid #FDE68A" : "1px solid #E4E4E4",
                boxShadow: isCurrentUser ? "0 4px 16px rgba(14,165,233,0.12)" : "0 2px 8px rgba(0,0,0,0.03)",
                transition: "all 0.2s ease",
                animationDelay: `${Math.min(index * 0.04, 0.5)}s`,
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = isCurrentUser ? "0 4px 16px rgba(14,165,233,0.12)" : "0 2px 8px rgba(0,0,0,0.03)";
              }}
            >
              {/* Position */}
              <span style={{
                width: 32,
                textAlign: "center",
                fontSize: 14,
                fontWeight: posStyle.weight,
                color: isCurrentUser ? "#0891b2" : posStyle.color,
                flexShrink: 0,
              }}>
                {position}
              </span>

              {/* Avatar */}
              {entry.photoURL ? (
                <img
                  src={entry.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: `2px solid ${rank.color}30`,
                  }}
                />
              ) : (
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: `${rank.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: `2px solid ${rank.color}30`,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: rank.color }}>person</span>
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
                    @{entry.handle || entry.displayName}
                  </span>
                  {isCurrentUser && (
                    <span style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: "#0891b2",
                      backgroundColor: "#E0F2FE",
                      padding: "2px 6px",
                      borderRadius: 4,
                      border: "1px solid #BAE6FD",
                    }}>
                      You
                    </span>
                  )}
                  {isNearby && (
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#D97706",
                      backgroundColor: "#FEF3C7",
                      padding: "2px 5px",
                      borderRadius: 4,
                    }}>
                      Rival
                    </span>
                  )}
                  <RankBadge xp={entry.xp} size="sm" />
                </div>
              </div>

              {/* Mini stats (desktop) */}
              <div className="hidden md:flex" style={{ alignItems: "center", gap: 14, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13, color: "#CBD5E1" }}>local_offer</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{entry.dealsSubmitted}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13, color: "#CBD5E1" }}>arrow_upward</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{entry.totalUpvotes}</span>
                </div>
              </div>

              {/* XP */}
              <span style={{
                fontSize: 15,
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

      {/* Motivational nudge for logged-in user if not in top ranks */}
      {user && userIndex === -1 && (
        <div style={{
          marginTop: 16,
          padding: "14px 18px",
          borderRadius: 12,
          background: "linear-gradient(135deg, #EFF9FF, #F0F9FF)",
          border: "1px solid #BAE6FD",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#0EA5E9" }}>rocket_launch</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0369A1" }}>
            Submit deals and earn XP to climb the rankings!
          </span>
        </div>
      )}
    </div>
  );
}
