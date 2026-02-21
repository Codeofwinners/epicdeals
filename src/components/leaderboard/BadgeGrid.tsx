"use client";

import { BADGES, RARITY_COLORS, type Badge, type BadgeRarity } from "@/lib/gamification";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserBadges } from "@/hooks/useGamification";

function BadgeCard({ badge, earned }: { badge: Badge; earned: boolean }) {
  const rarityLabel = badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1);

  if (earned) {
    return (
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "16px 10px 14px",
          borderRadius: 14,
          backgroundColor: "#FFFFFF",
          border: `1.5px solid ${badge.color}40`,
          boxShadow: `0 2px 12px ${badge.color}12`,
          transition: "all 0.3s ease",
          cursor: "default",
        }}
        title={`${badge.name} — ${badge.description}`}
      >
        {/* Badge icon with glow */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: `${badge.color}12`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
            boxShadow: `0 0 20px ${badge.color}20`,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 24, color: badge.color }}
          >
            {badge.icon}
          </span>
        </div>

        {/* Badge name */}
        <span style={{
          fontSize: 11,
          fontWeight: 800,
          color: "#0f172a",
          textAlign: "center",
          lineHeight: 1.2,
          marginBottom: 4,
        }}>
          {badge.name}
        </span>

        {/* Rarity pill */}
        <span style={{
          fontSize: 8,
          fontWeight: 800,
          color: RARITY_COLORS[badge.rarity],
          backgroundColor: `${RARITY_COLORS[badge.rarity]}12`,
          padding: "2px 6px",
          borderRadius: 4,
          border: `1px solid ${RARITY_COLORS[badge.rarity]}25`,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 4,
        }}>
          {rarityLabel}
        </span>

        {/* Description */}
        <span style={{
          fontSize: 9,
          color: "#64748b",
          textAlign: "center",
          lineHeight: 1.3,
        }}>
          {badge.description}
        </span>
      </div>
    );
  }

  // Locked badge — NO grayscale, light slate bg, dashed border, 70% opacity, hint of real color
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 10px 14px",
        borderRadius: 14,
        backgroundColor: "#F8FAFC",
        border: `1.5px dashed #CBD5E1`,
        opacity: 0.7,
        transition: "all 0.3s ease",
        cursor: "default",
      }}
      title={`Locked: ${badge.description}`}
    >
      {/* Lock icon */}
      <div style={{
        position: "absolute",
        top: 8,
        right: 8,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 11, color: "#94a3b8" }}>lock</span>
      </div>

      {/* Badge icon — hint of real color, not grayscale */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: "#F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 24, color: `${badge.color}50` }}
        >
          {badge.icon}
        </span>
      </div>

      {/* Badge name */}
      <span style={{
        fontSize: 11,
        fontWeight: 800,
        color: "#94a3b8",
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
        color: "#CBD5E1",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: 4,
      }}>
        {rarityLabel}
      </span>

      {/* Description */}
      <span style={{
        fontSize: 9,
        color: "#94a3b8",
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
      {/* Section header: Trophy Case */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#F59E0B" }}>emoji_events</span>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em", margin: 0 }}>
          Trophy Case
        </h2>
        {!loading && badgeData && (
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#0891b2",
            backgroundColor: "#F0F9FF",
            padding: "3px 8px",
            borderRadius: 6,
            border: "1px solid #BAE6FD",
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
            {/* Rarity tier header with colored left border */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
              paddingLeft: 10,
              borderLeft: `3px solid ${RARITY_COLORS[rarity]}`,
            }}>
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
