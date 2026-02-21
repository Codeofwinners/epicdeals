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

  const periods: { key: LeaderboardPeriod; label: string; emoji: string }[] = [
    { key: "alltime", label: "All-Time", emoji: "🏆" },
    { key: monthKey, label: "Monthly", emoji: "📅" },
    { key: weekKey, label: "Weekly", emoji: "⚡" },
  ];

  const categories: { key: LeaderboardCategory; label: string }[] = [
    { key: "overall", label: "Overall" },
    { key: "top-dealers", label: "Top Dealers" },
    { key: "top-commenters", label: "Commenters" },
    { key: "most-verified", label: "Verified" },
    { key: "rising-stars", label: "Rising" },
  ];

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Period tabs */}
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
                borderBottom: active ? "2px solid #0f172a" : "2px solid transparent",
                marginBottom: -2,
                fontSize: 12,
                fontWeight: active ? 800 : 600,
                fontFamily: "Manrope, sans-serif",
                cursor: "pointer",
                background: "transparent",
                color: active ? "#0f172a" : "#94A3B8",
                letterSpacing: "0.02em",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: 13 }}>{p.emoji}</span>
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Category pills */}
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
                padding: "7px 14px",
                borderRadius: 999,
                border: "none",
                fontSize: 12,
                fontWeight: active ? 800 : 600,
                fontFamily: "Manrope, sans-serif",
                cursor: "pointer",
                backgroundColor: active ? "#0f172a" : "#F1F5F9",
                color: active ? "#FFFFFF" : "#64748B",
                transition: "all 0.2s ease",
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
