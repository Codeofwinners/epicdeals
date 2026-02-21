// ─── Gamification Engine ─────────────────────────────────────────────────────
// XP scoring, rank tiers, achievement badges, and utility functions.

// ─── XP Point Values ─────────────────────────────────────────────────────────
export const XP_VALUES = {
  DEAL_SUBMITTED: 50,
  DEAL_VERIFIED: 30,
  DEAL_COMMUNITY_PICK: 25,
  DEAL_UPVOTE_RECEIVED: 5,
  COMMENT_POSTED: 3,
  COMMENT_UPVOTE_RECEIVED: 2,
  DEAL_WORKED_VOTE: 2,
} as const;

export type XPActionType = keyof typeof XP_VALUES;

// ─── Rank Tiers ──────────────────────────────────────────────────────────────
export interface RankTier {
  name: string;
  minXP: number;
  color: string;
  icon: string;
  gradient?: string;
}

export const RANK_TIERS: RankTier[] = [
  { name: "Newcomer", minXP: 0, color: "#94A3B8", icon: "person" },
  { name: "Bronze Hunter", minXP: 50, color: "#CD7F32", icon: "shield" },
  { name: "Silver Scout", minXP: 200, color: "#A8A9AD", icon: "verified_user" },
  { name: "Gold Finder", minXP: 500, color: "#F59E0B", icon: "workspace_premium" },
  { name: "Platinum Pro", minXP: 1200, color: "#06B6D4", icon: "diamond" },
  { name: "Diamond Elite", minXP: 3000, color: "#8B5CF6", icon: "auto_awesome" },
  { name: "Legendary", minXP: 7500, color: "#EF4444", icon: "local_fire_department" },
  { name: "Mythic", minXP: 20000, color: "#F59E0B", icon: "military_tech", gradient: "linear-gradient(135deg, #F59E0B, #FBBF24)" },
];

// ─── Rank Utility Functions ──────────────────────────────────────────────────

export function getUserRank(xp: number): RankTier {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (xp >= RANK_TIERS[i].minXP) return RANK_TIERS[i];
  }
  return RANK_TIERS[0];
}

export function getNextRank(xp: number): RankTier | null {
  const currentIndex = RANK_TIERS.findIndex((t, i) => {
    const next = RANK_TIERS[i + 1];
    return xp >= t.minXP && (!next || xp < next.minXP);
  });
  if (currentIndex < RANK_TIERS.length - 1) return RANK_TIERS[currentIndex + 1];
  return null; // Already at max rank
}

export function getProgressToNextRank(xp: number): { current: number; needed: number; percent: number } {
  const rank = getUserRank(xp);
  const next = getNextRank(xp);
  if (!next) return { current: xp - rank.minXP, needed: 0, percent: 100 };

  const rangeSize = next.minXP - rank.minXP;
  const progress = xp - rank.minXP;
  return {
    current: progress,
    needed: next.minXP - xp,
    percent: Math.min(100, Math.round((progress / rangeSize) * 100)),
  };
}

export interface UserStats {
  dealsSubmitted: number;
  dealsVerified: number;
  dealsCommunityPick: number;
  totalDealUpvotesReceived: number;
  commentsPosted: number;
  totalCommentUpvotesReceived: number;
  totalWorkedYes: number;
}

export function calculateUserXP(stats: UserStats): number {
  return (
    stats.dealsSubmitted * XP_VALUES.DEAL_SUBMITTED +
    stats.dealsVerified * XP_VALUES.DEAL_VERIFIED +
    stats.dealsCommunityPick * XP_VALUES.DEAL_COMMUNITY_PICK +
    stats.totalDealUpvotesReceived * XP_VALUES.DEAL_UPVOTE_RECEIVED +
    stats.commentsPosted * XP_VALUES.COMMENT_POSTED +
    stats.totalCommentUpvotesReceived * XP_VALUES.COMMENT_UPVOTE_RECEIVED +
    stats.totalWorkedYes * XP_VALUES.DEAL_WORKED_VOTE
  );
}

// ─── Achievement Badges ──────────────────────────────────────────────────────

export type BadgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: "#94A3B8",
  uncommon: "#22C55E",
  rare: "#3B82F6",
  epic: "#8B5CF6",
  legendary: "#F59E0B",
};

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: BadgeRarity;
  condition: (stats: UserStats & { joinedAt?: string }) => boolean;
}

export const BADGES: Badge[] = [
  // Common
  {
    id: "first_blood",
    name: "First Blood",
    description: "Submit your first deal",
    icon: "flag",
    color: "#94A3B8",
    rarity: "common",
    condition: (s) => s.dealsSubmitted >= 1,
  },
  {
    id: "crowd_favorite",
    name: "Crowd Favorite",
    description: "Receive 50 upvotes on your deals",
    icon: "favorite",
    color: "#F43F5E",
    rarity: "common",
    condition: (s) => s.totalDealUpvotesReceived >= 50,
  },
  {
    id: "seal_of_approval",
    name: "Seal of Approval",
    description: "Get a deal verified",
    icon: "verified",
    color: "#10B981",
    rarity: "common",
    condition: (s) => s.dealsVerified >= 1,
  },
  {
    id: "voice_of_people",
    name: "Voice of the People",
    description: "Post your first comment",
    icon: "campaign",
    color: "#6366F1",
    rarity: "common",
    condition: (s) => s.commentsPosted >= 1,
  },

  // Uncommon
  {
    id: "deal_machine",
    name: "Deal Machine",
    description: "Submit 10 deals",
    icon: "precision_manufacturing",
    color: "#22C55E",
    rarity: "uncommon",
    condition: (s) => s.dealsSubmitted >= 10,
  },
  {
    id: "commentator",
    name: "Commentator",
    description: "Post 50 comments",
    icon: "forum",
    color: "#14B8A6",
    rarity: "uncommon",
    condition: (s) => s.commentsPosted >= 50,
  },
  {
    id: "streak_master",
    name: "Streak Master",
    description: "7-day activity streak",
    icon: "local_fire_department",
    color: "#F97316",
    rarity: "uncommon",
    condition: () => false, // Checked separately via streak tracking
  },

  // Rare
  {
    id: "deal_mogul",
    name: "Deal Mogul",
    description: "Submit 50 deals",
    icon: "diamond",
    color: "#3B82F6",
    rarity: "rare",
    condition: (s) => s.dealsSubmitted >= 50,
  },
  {
    id: "community_hero",
    name: "Community Hero",
    description: "Receive 500 upvotes on your deals",
    icon: "volunteer_activism",
    color: "#EC4899",
    rarity: "rare",
    condition: (s) => s.totalDealUpvotesReceived >= 500,
  },
  {
    id: "trusted_source",
    name: "Trusted Source",
    description: "Get 10 deals verified",
    icon: "workspace_premium",
    color: "#0EA5E9",
    rarity: "rare",
    condition: (s) => s.dealsVerified >= 10,
  },
  {
    id: "peoples_champion",
    name: "People's Champion",
    description: "Have a deal become a community pick",
    icon: "emoji_events",
    color: "#F59E0B",
    rarity: "rare",
    condition: (s) => s.dealsCommunityPick >= 1,
  },

  // Epic
  {
    id: "century_club",
    name: "Century Club",
    description: "Submit 100 deals",
    icon: "military_tech",
    color: "#8B5CF6",
    rarity: "epic",
    condition: (s) => s.dealsSubmitted >= 100,
  },
  {
    id: "dedicated",
    name: "Dedicated",
    description: "30-day activity streak",
    icon: "whatshot",
    color: "#EF4444",
    rarity: "epic",
    condition: () => false, // Checked separately via streak tracking
  },
  {
    id: "monthly_legend",
    name: "Monthly Legend",
    description: "Finish in the top 10 monthly",
    icon: "leaderboard",
    color: "#D946EF",
    rarity: "epic",
    condition: () => false, // Checked separately via leaderboard snapshot
  },

  // Legendary
  {
    id: "early_adopter",
    name: "Early Adopter",
    description: "Joined before March 2026",
    icon: "rocket_launch",
    color: "#F59E0B",
    rarity: "legendary",
    condition: (s) => {
      if (!s.joinedAt) return false;
      return new Date(s.joinedAt) < new Date("2026-03-01");
    },
  },
];

export function getEarnedBadges(stats: UserStats & { joinedAt?: string; currentStreak?: number; longestStreak?: number; isMonthlyTop10?: boolean }): Badge[] {
  return BADGES.filter((badge) => {
    // Special streak badges
    if (badge.id === "streak_master") return (stats.longestStreak || 0) >= 7;
    if (badge.id === "dedicated") return (stats.longestStreak || 0) >= 30;
    if (badge.id === "monthly_legend") return stats.isMonthlyTop10 || false;
    return badge.condition(stats);
  });
}

export function getLockedBadges(stats: UserStats & { joinedAt?: string; currentStreak?: number; longestStreak?: number; isMonthlyTop10?: boolean }): Badge[] {
  const earned = new Set(getEarnedBadges(stats).map((b) => b.id));
  return BADGES.filter((b) => !earned.has(b.id));
}

// ─── Leaderboard Types ───────────────────────────────────────────────────────

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL: string | null;
  xp: number;
  rank: string;
  rankColor: string;
  rankIcon: string;
  dealsSubmitted: number;
  totalUpvotes: number;
  badges: string[];
  position?: number;
}

export type LeaderboardPeriod = "alltime" | `monthly-${string}` | `weekly-${string}`;
export type LeaderboardCategory = "overall" | "top-dealers" | "top-commenters" | "most-verified";
