"use client";

import type { LeaderboardPeriod, LeaderboardCategory } from "@/lib/gamification";

interface LeaderboardFilterBarProps {
  period: LeaderboardPeriod;
  category: LeaderboardCategory;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  onCategoryChange: (category: LeaderboardCategory) => void;
}

export function LeaderboardFilterBar({ period, category, onPeriodChange, onCategoryChange }: LeaderboardFilterBarProps) {
  const now = new Date();
  const monthKey = `monthly-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}` as LeaderboardPeriod;
  const weekNum = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
  const weekKey = `weekly-${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}` as LeaderboardPeriod;

  const periods: { key: LeaderboardPeriod; label: string; icon: string }[] = [
    { key: "alltime", label: "ALL-TIME", icon: "emoji_events" },
    { key: monthKey, label: "MONTHLY", icon: "calendar_month" },
    { key: weekKey, label: "WEEKLY", icon: "date_range" },
  ];

  const categories: { key: LeaderboardCategory; label: string; icon: string }[] = [
    { key: "overall", label: "Overall", icon: "leaderboard" },
    { key: "top-dealers", label: "Top Dealers", icon: "local_offer" },
    { key: "top-commenters", label: "Commenters", icon: "chat" },
    { key: "most-verified", label: "Verified", icon: "verified" },
    { key: "rising-stars", label: "Rising", icon: "trending_up" },
  ];

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Period: underline tab bar */}
      <div style={{
        display: "flex",
        gap: 0,
        marginBottom: 16,
        borderBottom: "2px solid #F1F5F9",
      }}>
        {periods.map((p) => {
          const active = period === p.key;
          return (
            <button
              key={p.key}
              onClick={() => onPeriodChange(p.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "10px 20px",
                border: "none",
                borderBottom: active ? "2px solid #0EA5E9" : "2px solid transparent",
                marginBottom: -2,
                fontSize: 11,
                fontWeight: 800,
                fontFamily: "Manrope, sans-serif",
                cursor: "pointer",
                background: "transparent",
                color: active ? "#0EA5E9" : "#94A3B8",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                transition: "all 0.2s ease",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{p.icon}</span>
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Category: chip buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {categories.map((c) => {
          const active = category === c.key;
          return (
            <button
              key={c.key}
              onClick={() => onCategoryChange(c.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "8px 14px",
                borderRadius: 10,
                border: active ? "1.5px solid #0EA5E9" : "1px solid #E2E8F0",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "Manrope, sans-serif",
                cursor: "pointer",
                backgroundColor: active ? "#F0F9FF" : "#FFFFFF",
                color: active ? "#0891b2" : "#64748B",
                transition: "all 0.2s ease",
                boxShadow: active ? "0 2px 8px rgba(14,165,233,0.15)" : "none",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: active ? "#0891b2" : "#94A3B8" }}>{c.icon}</span>
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
