"use client";

import { useState, useEffect } from "react";
import { getUserProfile } from "@/lib/firestore";
import {
  getUserRank,
  getNextRank,
  getProgressToNextRank,
  getEarnedBadges,
  getLockedBadges,
  type RankTier,
  type Badge,
} from "@/lib/gamification";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UserXPData {
  xp: number;
  rank: RankTier;
  nextRank: RankTier | null;
  progress: { current: number; needed: number; percent: number };
}

export function useUserXP(userId: string | undefined) {
  const [state, setState] = useState<AsyncState<UserXPData>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    getUserProfile(userId)
      .then((profile) => {
        if (cancelled) return;
        if (!profile) {
          setState({ data: null, loading: false, error: null });
          return;
        }
        const xp = (profile as any).xp || profile.reputation || 0;
        setState({
          data: {
            xp,
            rank: getUserRank(xp),
            nextRank: getNextRank(xp),
            progress: getProgressToNextRank(xp),
          },
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error });
      });

    return () => { cancelled = true; };
  }, [userId]);

  return state;
}

export function useUserBadges(userId: string | undefined) {
  const [state, setState] = useState<AsyncState<{ earned: Badge[]; locked: Badge[] }>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    getUserProfile(userId)
      .then((profile) => {
        if (cancelled) return;
        if (!profile) {
          setState({ data: { earned: [], locked: [] }, loading: false, error: null });
          return;
        }
        const p = profile as any;
        const stats = {
          dealsSubmitted: p.dealsSubmitted || 0,
          dealsVerified: p.dealsVerified || 0,
          dealsCommunityPick: p.dealsCommunityPick || 0,
          totalDealUpvotesReceived: p.totalDealUpvotesReceived || p.totalUpvotes || 0,
          commentsPosted: p.commentsPosted || 0,
          totalCommentUpvotesReceived: p.totalCommentUpvotesReceived || 0,
          totalWorkedYes: p.totalWorkedYes || 0,
          joinedAt: p.createdAt,
          currentStreak: p.currentStreak || 0,
          longestStreak: p.longestStreak || 0,
        };
        setState({
          data: { earned: getEarnedBadges(stats), locked: getLockedBadges(stats) },
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error });
      });

    return () => { cancelled = true; };
  }, [userId]);

  return state;
}
