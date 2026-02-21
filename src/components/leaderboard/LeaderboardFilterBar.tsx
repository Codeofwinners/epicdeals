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

  const periods: { key: LeaderboardPeriod; label: string }[] = [
    { key: "alltime", label: "All-Time" },
    { key: monthKey, label: "This Month" },
    { key: weekKey, label: "This Week" },
  ];

  const categories: { key: LeaderboardCategory; label: string; icon: string }[] = [
    { key: "overall", label: "Overall", icon: "leaderboard" },
    { key: "top-dealers", label: "Top Dealers", icon: "local_offer" },
    { key: "top-commenters", label: "Top Commenters", icon: "chat" },
    { key: "most-verified", label: "Most Verified", icon: "verified" },
  ];

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Period pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {periods.map((p) => {
          const active = period === p.key;
          return (
            <button
              key={p.key}
              onClick={() => onPeriodChange(p.key)}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "Manrope, sans-serif",
                cursor: "pointer",
                background: active ? "linear-gradient(135deg, #0EA5E9, #06B6D4)" : "#f1f5f9",
                color: active ? "#fff" : "#64748b",
                boxShadow: active ? "0 2px 10px rgba(14,165,233,0.3)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Category pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {categories.map((c) => {
          const active = category === c.key;
          return (
            <button
              key={c.key}
              onClick={() => onCategoryChange(c.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "7px 12px",
                borderRadius: 8,
                border: active ? "1px solid rgba(14,165,233,0.3)" : "1px solid #e2e8f0",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "Manrope, sans-serif",
                cursor: "pointer",
                background: active ? "rgba(14,165,233,0.08)" : "#fff",
                color: active ? "#0891b2" : "#94a3b8",
                transition: "all 0.2s ease",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{c.icon}</span>
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
