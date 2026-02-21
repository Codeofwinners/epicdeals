"use client";

import { useState, useEffect } from "react";
import { getLeaderboard, getUserRankPosition } from "@/lib/firestore";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/lib/gamification";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useLeaderboard(period: LeaderboardPeriod = "alltime") {
  const [state, setState] = useState<AsyncState<LeaderboardEntry[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    getLeaderboard(period)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error });
      });
    return () => { cancelled = true; };
  }, [period]);

  return state;
}

export function useUserRank(userId: string | undefined, period: LeaderboardPeriod = "alltime") {
  const [state, setState] = useState<AsyncState<{ position: number; entry: LeaderboardEntry | null }>>({
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
    getUserRankPosition(userId, period)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error });
      });
    return () => { cancelled = true; };
  }, [userId, period]);

  return state;
}
