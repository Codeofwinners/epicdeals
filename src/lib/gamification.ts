// ─── Gamification Engine ─────────────────────────────────────────────────────
// Points system, rank tiers, achievement badges, weekly challenges, and utilities.
// Designed for an addictive, encouraging dopamine loop.

// ─── XP Point Values ─────────────────────────────────────────────────────────
export const XP_VALUES = {
  DEAL_SUBMITTED: 50,        // Submit a new valid coupon
  DEAL_VERIFIED: 20,         // Verify/use an existing coupon with feedback
  DEAL_COMMUNITY_PICK: 25,   // Deal becomes a community pick
  DEAL_UPVOTE_RECEIVED: 5,   // Someone upvotes your deal
  COMMENT_POSTED: 15,        // Write a helpful review/comment
  COMMENT_UPVOTE_RECEIVED: 2, // Comment gets upvoted
  DEAL_WORKED_VOTE: 2,       // Someone confirms your deal works
  DAILY_LOGIN: 10,           // Daily login bonus
  SOCIAL_SHARE: 30,          // Share a deal on social media
  REFERRAL: 100,             // Refer a friend who signs up
  WEEKLY_CHALLENGE: 200,     // Complete a weekly challenge
} as const;

export type XPActionType = keyof typeof XP_VALUES;

// ─── Point Multipliers ──────────────────────────────────────────────────────
export const STREAK_MULTIPLIERS = [
  { minDays: 3, multiplier: 1.25, label: "3-Day Streak x1.25" },
  { minDays: 7, multiplier: 1.5, label: "Week Warrior x1.5" },
  { minDays: 14, multiplier: 1.75, label: "Fortnight Force x1.75" },
  { minDays: 30, multiplier: 2.0, label: "Monthly Machine x2" },
];

export function getStreakMultiplier(streakDays: number): { multiplier: number; label: string } {
  for (let i = STREAK_MULTIPLIERS.length - 1; i >= 0; i--) {
    if (streakDays >= STREAK_MULTIPLIERS[i].minDays) return STREAK_MULTIPLIERS[i];
  }
  return { multiplier: 1.0, label: "No streak" };
}

// ─── Rank Tiers ──────────────────────────────────────────────────────────────
export interface RankTier {
  name: string;
  minXP: number;
  color: string;
  icon: string;
  gradient?: string;
  perk: string;
  emoji: string;
}

export const RANK_TIERS: RankTier[] = [
  {
    name: "Bronze",
    minXP: 0,
    color: "#CD7F32",
    icon: "shield",
    perk: "Basic access & motivational tips",
    emoji: "🥉",
  },
  {
    name: "Silver",
    minXP: 500,
    color: "#A8A9AD",
    icon: "verified_user",
    perk: "Exclusive coupons & 10% extra off select deals",
    emoji: "🥈",
  },
  {
    name: "Gold",
    minXP: 2000,
    color: "#F59E0B",
    icon: "workspace_premium",
    gradient: "linear-gradient(135deg, #F59E0B, #FBBF24)",
    perk: "Priority deal alerts & custom profile flair",
    emoji: "🥇",
  },
  {
    name: "Platinum",
    minXP: 10000,
    color: "#06B6D4",
    icon: "diamond",
    gradient: "linear-gradient(135deg, #06B6D4, #22D3EE)",
    perk: "Real rewards, gift cards & featured on homepage",
    emoji: "💎",
  },
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
  // New fields
  dailyLogins?: number;
  socialShares?: number;
  referrals?: number;
  weeklyChallengesCompleted?: number;
}

export function calculateUserXP(stats: UserStats): number {
  return (
    stats.dealsSubmitted * XP_VALUES.DEAL_SUBMITTED +
    stats.dealsVerified * XP_VALUES.DEAL_VERIFIED +
    stats.dealsCommunityPick * XP_VALUES.DEAL_COMMUNITY_PICK +
    stats.totalDealUpvotesReceived * XP_VALUES.DEAL_UPVOTE_RECEIVED +
    stats.commentsPosted * XP_VALUES.COMMENT_POSTED +
    stats.totalCommentUpvotesReceived * XP_VALUES.COMMENT_UPVOTE_RECEIVED +
    stats.totalWorkedYes * XP_VALUES.DEAL_WORKED_VOTE +
    (stats.dailyLogins || 0) * XP_VALUES.DAILY_LOGIN +
    (stats.socialShares || 0) * XP_VALUES.SOCIAL_SHARE +
    (stats.referrals || 0) * XP_VALUES.REFERRAL +
    (stats.weeklyChallengesCompleted || 0) * XP_VALUES.WEEKLY_CHALLENGE
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
  // ── Common: Quick wins for new users
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
    id: "seal_of_approval",
    name: "Seal of Approval",
    description: "Verify your first coupon",
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
  {
    id: "crowd_favorite",
    name: "Crowd Favorite",
    description: "Receive 50 upvotes on your deals",
    icon: "favorite",
    color: "#F43F5E",
    rarity: "common",
    condition: (s) => s.totalDealUpvotesReceived >= 50,
  },

  // ── Uncommon: Building habits
  {
    id: "coupon_hunter",
    name: "Coupon Hunter",
    description: "Submit 10 valid deals",
    icon: "search",
    color: "#22C55E",
    rarity: "uncommon",
    condition: (s) => s.dealsSubmitted >= 10,
  },
  {
    id: "commentator",
    name: "Commentator",
    description: "Post 25 helpful comments",
    icon: "forum",
    color: "#14B8A6",
    rarity: "uncommon",
    condition: (s) => s.commentsPosted >= 25,
  },
  {
    id: "streak_starter",
    name: "Streak Starter",
    description: "7-day activity streak",
    icon: "local_fire_department",
    color: "#F97316",
    rarity: "uncommon",
    condition: () => false, // Checked via streak tracking
  },
  {
    id: "social_saver",
    name: "Social Saver",
    description: "Share 5 deals on social media",
    icon: "share",
    color: "#3B82F6",
    rarity: "uncommon",
    condition: (s) => (s.socialShares || 0) >= 5,
  },

  // ── Rare: Committed contributors
  {
    id: "deal_detective",
    name: "Deal Detective",
    description: "Verify 50 coupons",
    icon: "policy",
    color: "#3B82F6",
    rarity: "rare",
    condition: (s) => s.dealsVerified >= 50,
  },
  {
    id: "deal_mogul",
    name: "Deal Mogul",
    description: "Submit 50 deals",
    icon: "diamond",
    color: "#0EA5E9",
    rarity: "rare",
    condition: (s) => s.dealsSubmitted >= 50,
  },
  {
    id: "community_hero",
    name: "Community Hero",
    description: "Receive 500 upvotes",
    icon: "volunteer_activism",
    color: "#EC4899",
    rarity: "rare",
    condition: (s) => s.totalDealUpvotesReceived >= 500,
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

  // ── Epic: Elite status
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
    id: "streak_master",
    name: "Streak Master",
    description: "30-day activity streak",
    icon: "whatshot",
    color: "#EF4444",
    rarity: "epic",
    condition: () => false, // Checked via streak tracking
  },
  {
    id: "monthly_legend",
    name: "Monthly Legend",
    description: "Finish in the top 10 monthly",
    icon: "leaderboard",
    color: "#D946EF",
    rarity: "epic",
    condition: () => false, // Checked via leaderboard snapshot
  },

  // ── Legendary: Hall of fame
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
  {
    id: "platinum_legend",
    name: "Platinum Legend",
    description: "Reach Platinum rank",
    icon: "auto_awesome",
    color: "#06B6D4",
    rarity: "legendary",
    condition: (s) => {
      const xp = calculateUserXP(s);
      return xp >= 10000;
    },
  },
];

export function getEarnedBadges(stats: UserStats & { joinedAt?: string; currentStreak?: number; longestStreak?: number; isMonthlyTop10?: boolean }): Badge[] {
  return BADGES.filter((badge) => {
    if (badge.id === "streak_starter") return (stats.longestStreak || 0) >= 7;
    if (badge.id === "streak_master") return (stats.longestStreak || 0) >= 30;
    if (badge.id === "monthly_legend") return stats.isMonthlyTop10 || false;
    return badge.condition(stats);
  });
}

export function getLockedBadges(stats: UserStats & { joinedAt?: string; currentStreak?: number; longestStreak?: number; isMonthlyTop10?: boolean }): Badge[] {
  const earned = new Set(getEarnedBadges(stats).map((b) => b.id));
  return BADGES.filter((b) => !earned.has(b.id));
}

// ─── Weekly Challenges ──────────────────────────────────────────────────────

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  xpReward: number;
  category: "deals" | "social" | "community";
}

const CHALLENGE_POOL: WeeklyChallenge[] = [
  { id: "find_tech", title: "Tech Hunter", description: "Submit 3 tech deals", icon: "devices", target: 3, xpReward: 200, category: "deals" },
  { id: "find_fashion", title: "Fashion Find", description: "Submit 3 fashion deals", icon: "checkroom", target: 3, xpReward: 200, category: "deals" },
  { id: "verify_5", title: "Quality Check", description: "Verify 5 coupons", icon: "verified", target: 5, xpReward: 200, category: "community" },
  { id: "comment_5", title: "Community Voice", description: "Post 5 helpful comments", icon: "chat", target: 5, xpReward: 200, category: "community" },
  { id: "share_3", title: "Deal Spreader", description: "Share 3 deals on social media", icon: "share", target: 3, xpReward: 200, category: "social" },
  { id: "submit_5", title: "Deal Machine", description: "Submit 5 new deals", icon: "add_circle", target: 5, xpReward: 250, category: "deals" },
  { id: "upvote_10", title: "Community Judge", description: "Vote on 10 deals", icon: "thumb_up", target: 10, xpReward: 150, category: "community" },
  { id: "streak_7", title: "Streak Builder", description: "Maintain a 7-day streak", icon: "local_fire_department", target: 7, xpReward: 300, category: "community" },
];

/** Get deterministic weekly challenges based on the current week */
export function getWeeklyChallenges(): WeeklyChallenge[] {
  const now = new Date();
  const weekNum = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
  const seed = now.getFullYear() * 100 + weekNum;
  // Pick 2 challenges deterministically
  const idx1 = seed % CHALLENGE_POOL.length;
  const idx2 = (seed * 7 + 3) % CHALLENGE_POOL.length;
  const picks = [CHALLENGE_POOL[idx1]];
  if (idx2 !== idx1) picks.push(CHALLENGE_POOL[idx2]);
  else picks.push(CHALLENGE_POOL[(idx2 + 1) % CHALLENGE_POOL.length]);
  return picks;
}

/** Days remaining in current week (resets Sunday midnight) */
export function getDaysLeftInWeek(): number {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  return dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
}

// ─── Leaderboard Types ───────────────────────────────────────────────────────

export interface LeaderboardEntry {
  userId: string;
  handle: string;
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
  streak?: number;
}

export type LeaderboardPeriod = "alltime" | `monthly-${string}` | `weekly-${string}`;
export type LeaderboardCategory = "overall" | "top-dealers" | "top-commenters" | "most-verified" | "rising-stars";
