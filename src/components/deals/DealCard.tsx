"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { signInWithGoogle } from "@/lib/auth";
import {
  addComment,
  onDealComments,
  getLatestComment,
  upvoteDeal,
  downvoteDeal,
  getVoteStatus,
  trackDealView
} from "@/lib/firestore";
import type { VoteStatus } from "@/lib/firestore";
import type { Deal, Comment } from "@/types/deals";
import { useBestComment } from "@/hooks/useFirestore";

function timeAgo(dateStr: string) {
  const sec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (sec < 60) return "now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}
// Robust Image Component with Fallback
function DealImage({ src, alt, deal }: { src: string; alt: string; deal?: Deal }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const getFallbackImage = () => {
    if (!deal) {
      return "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&auto=format&fit=crop";
    }
    if (deal.category?.slug === 'electronics' || deal.title.toLowerCase().includes('headphone')) {
      return "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=800&auto=format&fit=crop";
    }
    if (deal.category?.slug === 'fashion' || deal.store?.name.includes('Navy')) {
      return "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=800&auto=format&fit=crop";
    }
    if (deal.category?.slug === 'food') {
      return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop";
    }
    const fallbacks = [
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1607082349566-187342175e2f?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop"
    ];
    return fallbacks[deal.title.length % fallbacks.length];
  };

  const hasValidImage = (url: string | undefined | null) => {
    if (!url) return false;
    const t = url.trim();
    if (t === "" || t === "null" || t === "undefined" || t.length < 5) return false;
    return true;
  };

  const displayImage = error || !hasValidImage(src) ? getFallbackImage() : src;

  return (
    <div className="absolute inset-0 w-full h-full bg-gray-50">
      <img
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'} group-hover:scale-110`}
        src={displayImage}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          if (!error) setError(true);
          const fallback = getFallbackImage();
          if (e.currentTarget.src !== fallback) {
            e.currentTarget.src = fallback;
          }
        }}
      />
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
    </div>
  );
}

interface DealCardProps {
  deal: Deal;
  variant?: "featured" | "side" | "grid" | "compact" | "default";
}

export function DealCard({ deal, variant = "featured" }: DealCardProps) {
  if (variant === "side") return <SideCard deal={deal} />;
  if (variant === "grid") return <GridCard deal={deal} />;
  if (variant === "compact") return <CompactCard deal={deal} />;

  // FEATURED CARD - Matching home.html (8 cols)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="col-span-12 lg:col-span-8 group relative overflow-hidden rounded-[1.5rem] bg-surface-light dark:bg-surface-dark shadow-soft hover:shadow-hover transition-all duration-300 h-[450px] border border-gray-100 dark:border-white/5"
    >
      <div className="relative w-full h-full">
        <DealImage
          alt={deal.title}
          src={deal.imageUrl || ""}
          deal={deal}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10"></div>
      </div>

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-between p-8">
        {/* Top Badges */}
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md text-white font-semibold text-xs uppercase tracking-wider rounded-lg border border-white/20 flex items-center gap-1.5">
              <span className="material-icons-outlined text-sm">local_fire_department</span> Hot
            </span>
            {deal.isVerified && (
              <span className="px-3 py-1.5 bg-ai-accent/90 text-white font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 backdrop-blur-md border border-white/20">
                <span className="material-icons-outlined text-sm">smart_toy</span> AI Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10">
              <span className="material-icons-outlined text-sm">share</span>
            </button>
            <button className="w-9 h-9 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10">
              <span className="material-icons-outlined text-sm">bookmark_border</span>
            </button>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="flex items-end justify-between w-full">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              {deal.store && (
                <div className="w-10 h-10 rounded-full bg-white p-1 shadow-sm flex items-center justify-center">
                  <span className="text-lg font-bold text-background-dark">
                    {deal.store.name[0]}
                  </span>
                </div>
              )}
              <span className="text-white/90 font-medium text-lg">{deal.store.name}</span>
            </div>
            <h2 className="text-5xl font-display font-bold text-white mb-6 leading-[1.1] tracking-tight">
              {deal.title}
              <br />
              <span className="text-primary">{deal.savingsAmount}</span>
            </h2>
            <div className="flex items-center gap-4 mb-2">
              <button className="px-8 py-3.5 bg-white text-background-dark font-bold rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg text-sm">
                Get Code
                <span className="material-icons-outlined text-sm">content_copy</span>
              </button>
              <div className="h-8 w-px bg-white/20"></div>
              <div className="flex flex-col">
                <span className="text-white text-xs font-bold">{deal.workedYes + deal.workedNo} Verified</span>
                <span className="text-white/60 text-[10px] uppercase tracking-wide">Community Voted</span>
              </div>
            </div>
          </div>

          {/* Dynamic Top Comment / Helpful Insight */}
          {deal.commentCount > 0 && (
            <TopComment dealId={deal.id} variant="featured" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// SIDE CARD - Right column (4 cols)
function SideCard({ deal }: { deal: Deal }) {
  const { user } = useAuth();
  const [voteStatus, setVoteStatus] = useState<VoteStatus | null>(null);
  const [voting, setVoting] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      getVoteStatus(user.uid, deal.id).then(setVoteStatus);
    }
  }, [user?.uid, deal.id]);

  const handleVote = async (type: "up" | "down") => {
    if (!user) {
      setShowSignIn(true);
      return;
    }

    setVoting(true);
    try {
      if (type === "up") {
        await upvoteDeal(user.uid, deal.id);
      } else {
        await downvoteDeal(user.uid, deal.id);
      }
      // Refresh vote status
      const newStatus = await getVoteStatus(user.uid, deal.id);
      setVoteStatus(newStatus);
    } catch (error) {
      console.error("Voting error:", error);
    } finally {
      setVoting(false);
    }
  };

  const workedYes = deal.workedYes + (voteStatus?.voteType === "upvote" ? 1 : 0);
  const workedNo = deal.workedNo + (voteStatus?.voteType === "downvote" ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-[1.5rem] bg-surface-light dark:bg-surface-dark shadow-soft hover:shadow-hover transition-all duration-300 flex flex-col relative overflow-hidden group border border-gray-100 dark:border-white/5"
    >
      <div className="p-5 flex flex-col h-full">
        {/* Header with Logo & Badge */}
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-center p-2">
            <span className="text-2xl font-bold !text-black dark:!text-white">
              {deal.store.name[0]}
            </span>
          </div>
          <div className="flex gap-2">
            {deal.isVerified && (
              <span className="text-ai-accent text-[10px] font-bold bg-ai-accent/5 px-2 py-1 rounded-full border border-ai-accent/10 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">smart_toy</span> AI Found
              </span>
            )}
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <span className="material-icons-outlined text-lg">more_horiz</span>
            </button>
          </div>
        </div>

        {/* Title & Comments */}
        <div className="flex-1">
          <h3 className="text-xl font-bold !text-black dark:!text-white mb-2 leading-tight">
            {deal.title}
          </h3>
          {deal.commentCount > 0 && <HelpfulComment dealId={deal.id} />}
        </div>

        {/* Vote & Action */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 rounded-lg px-2 py-1.5 border border-gray-100 dark:border-white/5">
            <button
              onClick={() => handleVote("up")}
              disabled={voting}
              title={user ? "Upvote" : "Sign in to vote"}
              className={`material-icons-outlined text-sm transition-colors ${voteStatus?.voteType === "upvote"
                ? "text-green-500"
                : "text-gray-400 hover:text-green-500"
                } ${voting ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{ outline: "none" }}
            >
              keyboard_arrow_up
            </button>
            <span className="text-xs font-bold w-6 text-center !text-black dark:!text-white">{workedYes}</span>
            <button
              onClick={() => handleVote("down")}
              disabled={voting}
              title={user ? "Downvote" : "Sign in to vote"}
              className={`material-icons-outlined text-sm transition-colors ${voteStatus?.voteType === "downvote"
                ? "text-red-500"
                : "text-gray-400 hover:text-red-500"
                } ${voting ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{ outline: "none" }}
            >
              keyboard_arrow_down
            </button>
          </div>
          <Link href={`/deals/${deal.slug}`} className="flex-1">
            <button className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              View Offer <span className="material-icons-outlined text-sm">arrow_forward</span>
            </button>
          </Link>
        </div>

        {/* Sign In Prompt */}
        {showSignIn && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
            <p className="text-xs text-blue-900 dark:text-blue-200 mb-2">Sign in to vote</p>
            <button
              onClick={() => signInWithGoogle()}
              className="w-full py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors"
            >
              Sign In with Google
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// GRID CARD - 2x2 grid (4 cols each)
function GridCard({ deal }: { deal: Deal }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="col-span-1 bg-surface-light dark:bg-surface-dark rounded-[1.5rem] shadow-soft flex flex-col justify-between hover:-translate-y-1 transition-transform cursor-pointer h-full relative border border-gray-100 dark:border-white/5 group overflow-hidden"
    >
      <div className="p-6 flex flex-col h-full">
        {/* Logo & Badge */}
        <div className="flex justify-between items-start mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center p-3 shrink-0">
            <span className="text-3xl font-bold !text-black dark:!text-white">
              {deal.store.name[0]}
            </span>
          </div>
          <div className="flex flex-col items-end gap-2">
            {deal.isVerified && (
              <span className="text-[10px] font-bold text-ai-accent bg-ai-accent/5 px-2 py-0.5 rounded-full border border-ai-accent/10">
                AI Verified
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <span className="text-xs font-bold text-primary uppercase tracking-wide">
            {deal.category?.name}
          </span>
          <h4 className="text-lg font-bold !text-black dark:!text-white leading-tight mt-1 group-hover:text-primary transition-colors">
            {deal.title}
          </h4>
        </div>

        {/* Comment & Vote */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex flex-col gap-3">
          {deal.commentCount > 0 && <CompactComment dealId={deal.id} />}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="material-icons-outlined text-xs text-gray-400">thumb_up</span>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {deal.workedYes}k
              </span>
            </div>
            <Link href={`/deals/${deal.slug}`}>
              <button className="text-xs font-bold !text-black dark:!text-white hover:underline">
                Details
              </button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// COMPACT CARD - Minimal version
function CompactCard({ deal }: { deal: Deal }) {
  return (
    <Link href={`/deals/${deal.slug}`} className="block">
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-surface-light dark:bg-surface-dark rounded-lg p-4 shadow-soft border border-gray-100 dark:border-white/5 hover:shadow-hover transition-all"
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold !text-black dark:!text-white line-clamp-2 flex-1">
            {deal.title}
          </h3>
          <span className="text-primary font-bold text-sm ml-2 flex-shrink-0">
            {deal.savingsAmount}
          </span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {deal.store.name}
        </div>
      </motion.div>
    </Link>
  );
}
// Helper components for dynamic comments within cards
function TopComment({ dealId, variant }: { dealId: string; variant: "featured" | "side" }) {
  const { data: comment, loading } = useBestComment(dealId);
  if (loading || !comment) return null;

  if (variant === "featured") {
    return (
      <div className="hidden md:block p-3 max-w-xs text-white">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
              {comment.user.username[0].toUpperCase()}
            </div>
            <span className="text-xs text-gray-200 font-medium">{comment.user.username}</span>
          </div>
          <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-white/90 leading-relaxed line-clamp-2">
          "{comment.content}"
        </p>
      </div>
    );
  }
  return null;
}

function HelpfulComment({ dealId }: { dealId: string }) {
  const { data: comment, loading } = useBestComment(dealId);
  if (loading || !comment) return null;

  return (
    <div className="border-t border-gray-100 dark:border-white/5 pt-3 mt-3">
      <div className="flex items-start gap-2.5">
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 shrink-0 flex items-center justify-center text-[10px] text-white font-bold border-none shadow-sm">
          {comment.user.username[0].toUpperCase()}
        </div>
        <div>
          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium line-clamp-2">
            "{comment.content}"
          </p>
        </div>
      </div>
    </div>
  );
}

function CompactComment({ dealId }: { dealId: string }) {
  const { data: comment, loading } = useBestComment(dealId);
  if (loading || !comment) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        <div className="w-5 h-5 rounded-full border-2 border-white dark:border-surface-dark bg-gradient-to-br from-blue-400 to-purple-500"></div>
        <div className="w-5 h-5 rounded-full border-2 border-white dark:border-surface-dark bg-gradient-to-br from-green-400 to-blue-500"></div>
      </div>
      <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1">
        "{comment.content}"
      </span>
    </div>
  );
}
