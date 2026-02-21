"use client";

import { BADGES, RARITY_COLORS, type Badge, type BadgeRarity } from "@/lib/gamification";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserBadges } from "@/hooks/useGamification";

function BadgeCard({ badge, earned }: { badge: Badge; earned: boolean }) {
  const rarityLabel = badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 10px 14px",
        borderRadius: 14,
        background: earned ? "#fff" : "#f8fafc",
        border: earned ? `1px solid ${badge.color}25` : "1px solid #e2e8f0",
        opacity: earned ? 1 : 0.5,
        filter: earned ? "none" : "grayscale(100%)",
        transition: "all 0.3s ease",
        cursor: "default",
      }}
      title={earned ? `${badge.name} — ${badge.description}` : `Locked: ${badge.description}`}
    >
      {/* Lock overlay for unearned */}
      {!earned && (
        <div style={{
          position: "absolute",
          top: 8,
          right: 8,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 12, color: "#94a3b8" }}>lock</span>
        </div>
      )}

      {/* Badge icon */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: earned ? `${badge.color}15` : "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
          boxShadow: earned ? `0 0 16px ${badge.color}20` : "none",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 22, color: earned ? badge.color : "#cbd5e1" }}
        >
          {badge.icon}
        </span>
      </div>

      {/* Badge name */}
      <span style={{
        fontSize: 11,
        fontWeight: 800,
        color: earned ? "#0f172a" : "#94a3b8",
        textAlign: "center",
        lineHeight: 1.2,
        marginBottom: 4,
      }}>
        {badge.name}
      </span>

      {/* Rarity */}
      <span style={{
        fontSize: 8,
        fontWeight: 800,
        color: earned ? RARITY_COLORS[badge.rarity] : "#cbd5e1",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: 4,
      }}>
        {rarityLabel}
      </span>

      {/* Description */}
      <span style={{
        fontSize: 9,
        color: earned ? "#64748b" : "#94a3b8",
        textAlign: "center",
        lineHeight: 1.3,
      }}>
        {badge.description}
      </span>
    </div>
  );
}

export function BadgeGrid() {
  const { user } = useAuth();
  const { data: badgeData, loading } = useUserBadges(user?.uid);

  const earnedIds = new Set((badgeData?.earned || []).map((b) => b.id));

  // Group badges by rarity
  const rarityOrder: BadgeRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#F59E0B" }}>emoji_events</span>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em", margin: 0 }}>
          Achievements
        </h2>
        {!loading && badgeData && (
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#94a3b8",
            background: "#f1f5f9",
            padding: "3px 8px",
            borderRadius: 6,
          }}>
            {badgeData.earned.length}/{BADGES.length}
          </span>
        )}
      </div>

      {rarityOrder.map((rarity) => {
        const badgesInRarity = BADGES.filter((b) => b.rarity === rarity);
        if (badgesInRarity.length === 0) return null;

        return (
          <div key={rarity} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: RARITY_COLORS[rarity] }} />
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                color: RARITY_COLORS[rarity],
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}>
                {rarity}
              </span>
            </div>

            {/* Desktop: 5 cols, Mobile: 3 cols */}
            <div
              className="grid grid-cols-3 md:grid-cols-5"
              style={{ gap: 8 }}
            >
              {badgesInRarity.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  earned={earnedIds.has(badge.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
