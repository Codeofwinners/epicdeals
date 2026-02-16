"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Clock,
  ShieldCheck,
  Tag,
  CalendarDays,
  MessageSquare,
  ThumbsUp,
  Bot,
  UserCircle,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { MeterBar } from "@/components/ui/MeterBar";
import { DealBadge } from "@/components/ui/DealBadge";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { DealCard } from "@/components/deals/DealCard";
import { useDealComments, useStoreDeals } from "@/hooks/useFirestore";
import { useAuth } from "@/components/auth/AuthProvider";
import { signInWithGoogle } from "@/lib/auth";
import { addComment } from "@/lib/firestore";
import type { Deal, Comment } from "@/types/deals";

// ─── Helpers ────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Animation ──────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

// ─── Comment ────────────────────────────────────────────────────
function CommentCard({
  comment,
  isReply = false,
}: {
  comment: Comment;
  isReply?: boolean;
}) {
  const [upvoted, setUpvoted] = useState(false);
  const voteCount = comment.upvotes + (upvoted ? 1 : 0);

  return (
    <div className={`${isReply ? "ml-8 border-l-2 border-[var(--border-light)] pl-4" : ""}`}>
      <div className="py-4">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <span className="text-xs font-bold text-amber-700">
              {comment.user.username[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {comment.user.username}
              </span>
              {comment.user.badges.length > 0 && (
                <span className="text-[10px] font-bold text-[var(--brand)] bg-[var(--brand-muted)] px-1.5 py-0.5 rounded-md">
                  {comment.user.badges[0]}
                </span>
              )}
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              {timeAgo(comment.createdAt)}
            </span>
          </div>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2.5 pl-[42px]">
          {comment.content}
        </p>
        <div className="pl-[42px]">
          <button
            onClick={() => setUpvoted((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-medium transition-all duration-200 ${
              upvoted
                ? "text-[var(--brand)]"
                : "text-[var(--text-muted)] hover:text-[var(--brand)]"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="tabular-nums">{voteCount}</span>
          </button>
        </div>
      </div>
      {comment.replies?.map((reply) => (
        <CommentCard key={reply.id} comment={reply} isReply />
      ))}
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────
interface DealDetailContentProps {
  deal: Deal;
}

export default function DealDetailContent({ deal }: DealDetailContentProps) {
  const { user } = useAuth();
  const { data: dealComments } = useDealComments(deal.id);
  const { data: storeDealsRaw } = useStoreDeals(deal.store?.slug ?? "");

  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [reaction, setReaction] = useState<"yes" | "no" | null>(null);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    if (!user) { await signInWithGoogle(); return; }
    setPosting(true);
    try {
      await addComment({
        dealId: deal.id,
        content: commentText.trim(),
        user: { id: user.uid, username: user.displayName || "Anonymous", avatar: user.photoURL || "", badges: [] },
      });
      setCommentText("");
    } catch (err) { console.error("Failed to post comment:", err); }
    finally { setPosting(false); }
  };

  const netVotes = deal.upvotes - deal.downvotes + (vote === "up" ? 1 : vote === "down" ? -1 : 0);
  const workedYes = deal.workedYes + (reaction === "yes" ? 1 : 0);
  const workedNo = deal.workedNo + (reaction === "no" ? 1 : 0);
  const total = workedYes + workedNo;
  const trustPct = total > 0 ? Math.round((workedYes / total) * 100) : 0;
  const comments = dealComments ?? [];
  const storeDeals = (storeDealsRaw ?? []).filter((d) => d.id !== deal.id);

  const copyCode = () => {
    if (deal.code) {
      navigator.clipboard.writeText(deal.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* BREADCRUMB */}
      <motion.nav custom={0} variants={fadeUp} initial="hidden" animate="visible"
        className="text-[13px] text-[var(--text-muted)] mb-10 flex items-center gap-1.5 flex-wrap"
      >
        <Link href="/" className="hover:text-[var(--brand)] transition-colors">Home</Link>
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-[var(--text-faint)]"><path d="M4.5 2.5L7.5 6L4.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <Link href="/deals" className="hover:text-[var(--brand)] transition-colors">Deals</Link>
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-[var(--text-faint)]"><path d="M4.5 2.5L7.5 6L4.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <Link href={`/stores/${deal.store.slug}`} className="hover:text-[var(--brand)] transition-colors">{deal.store.name}</Link>
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-[var(--text-faint)]"><path d="M4.5 2.5L7.5 6L4.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span className="text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-none font-medium">{deal.title}</span>
      </motion.nav>

      {/* HERO — open layout, no card wrapper */}
      <motion.section custom={1} variants={fadeUp} initial="hidden" animate="visible" className="mb-10">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {deal.isVerified && <DealBadge type="verified" />}
          {deal.isTrending && <DealBadge type="trending" />}
          {deal.isCommunityPick && <DealBadge type="community_pick" />}
          {deal.source === "ai_discovered" && <DealBadge type="ai_found" />}
          {deal.source === "user_submitted" && <DealBadge type="user_submitted" />}
        </div>

        {/* Store */}
        <Link
          href={`/stores/${deal.store.slug}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-[var(--text-faint)] hover:text-[var(--brand)] uppercase tracking-[0.15em] transition-colors mb-3"
        >
          {deal.store.name}
          <ArrowUpRight className="w-3 h-3" />
        </Link>

        {/* Savings — massive editorial serif */}
        <div className="mb-4">
          <span className="font-editorial italic text-6xl sm:text-7xl md:text-8xl font-black text-savings leading-none tracking-tight">
            {deal.savingsAmount}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-3 tracking-tight max-w-2xl">
          {deal.title}
        </h1>

        {/* Description */}
        <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed max-w-2xl mb-6">
          {deal.description}
        </p>

        {/* Inline stats */}
        <div className="flex items-center gap-4 flex-wrap text-xs mb-8">
          {total > 0 && (
            <span className={`font-bold tabular-nums ${trustPct >= 80 ? "text-emerald-600" : trustPct >= 60 ? "text-amber-600" : "text-rose-500"}`}>
              {trustPct}% trust score
            </span>
          )}
          {deal.usedLastHour > 0 && (
            <span className="flex items-center gap-1 text-[var(--brand)] font-medium">
              <Zap className="w-3 h-3" /> {deal.usedLastHour} used recently
            </span>
          )}
          {deal.expiresAt && (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <Clock className="w-3 h-3" /> Expires <CountdownTimer expiresAt={deal.expiresAt} compact />
            </span>
          )}

          {/* Vote inline */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setVote((v) => (v === "up" ? null : "up"))}
              className={`p-1.5 rounded-lg transition-all ${vote === "up" ? "text-[var(--brand)] bg-[var(--brand-muted)]" : "text-[var(--text-faint)] hover:text-[var(--brand)] hover:bg-[var(--brand-muted)]"}`}
            >
              <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <span className={`text-xs font-bold tabular-nums min-w-[2ch] text-center ${netVotes > 0 ? "text-[var(--brand)]" : "text-[var(--text-muted)]"}`}>
              {netVotes}
            </span>
            <button
              onClick={() => setVote((v) => (v === "down" ? null : "down"))}
              className={`p-1.5 rounded-lg transition-all ${vote === "down" ? "text-rose-400 bg-rose-50" : "text-[var(--text-faint)] hover:text-rose-400 hover:bg-rose-50"}`}
            >
              <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </motion.section>

      {/* PROMO CODE BOX */}
      {deal.code && (
        <motion.section custom={2} variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
          <div className="relative overflow-hidden rounded-2xl animate-glow-breathe">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--brand)] via-[var(--brand-light)] to-[var(--brand)] animate-border-travel opacity-[0.12]" />
            <div className="absolute inset-[1px] rounded-[15px] bg-[var(--text-primary)]" />

            <div className="relative p-6 md:p-8">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--brand-light)] animate-pulse-soft" />
                  <span className="text-[11px] font-semibold text-[var(--brand-light)] uppercase tracking-[0.2em]">Promo Code</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium">Verified</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="flex-1 flex items-center justify-center sm:justify-start">
                  <span className="font-mono text-3xl md:text-4xl font-black tracking-[0.25em] text-white select-all code-shimmer">
                    {deal.code}
                  </span>
                </div>
                <button
                  onClick={copyCode}
                  className={`relative flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 shrink-0 ${
                    codeCopied
                      ? "bg-emerald-500 text-white shadow-[0_0_30px_rgba(22,163,74,0.3)]"
                      : "bg-[var(--brand)] text-white hover:bg-[var(--brand-light)] hover:shadow-[0_0_40px_rgba(27,115,64,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  {codeCopied ? (
                    <><Check className="w-5 h-5 animate-check-pop" /> Copied!</>
                  ) : (
                    <><Copy className="w-5 h-5" /> Copy Code</>
                  )}
                </button>
              </div>
              <p className="mt-4 text-[11px] text-stone-500 text-center sm:text-left">Click to copy, then paste at checkout</p>
            </div>
          </div>
        </motion.section>
      )}

      {/* ACTION BUTTONS */}
      <motion.section custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mb-10">
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={deal.dealUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white rounded-xl font-bold text-lg transition-all duration-200 shadow-lg shadow-[var(--brand)]/15 hover:shadow-xl hover:shadow-[var(--brand)]/20 hover:scale-[1.01] active:scale-[0.99]"
          >
            Shop at {deal.store.name}
            <ExternalLink className="w-5 h-5 opacity-80" />
          </a>
          <button
            onClick={copyUrl}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
              urlCopied
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--text-faint)] text-[var(--text-secondary)]"
            }`}
          >
            {urlCopied ? <><Check className="w-5 h-5 animate-check-pop" /> Link Copied!</> : <><Share2 className="w-5 h-5" /> Share</>}
          </button>
        </div>

        {deal.expiresAt && (
          <div className="flex items-center gap-3 px-5 py-3.5 mt-4 bg-[var(--surface)] rounded-xl border border-amber-200/50">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Expires in</span>
              <div className="mt-0.5"><CountdownTimer expiresAt={deal.expiresAt} /></div>
            </div>
          </div>
        )}
      </motion.section>

      {/* DEAL DETAILS — flat layout, no nested card */}
      <motion.section custom={4} variants={fadeUp} initial="hidden" animate="visible" className="mb-10">
        <h2 className="text-sm font-bold text-[var(--text-faint)] uppercase tracking-[0.15em] mb-5">Deal Details</h2>

        <div className="space-y-6">
          {deal.conditions && (
            <div>
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Conditions</div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{deal.conditions}</p>
            </div>
          )}

          {deal.tags.length > 0 && (
            <div>
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {deal.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-sunken)] text-[var(--text-secondary)] rounded-full text-xs font-medium border border-[var(--border-light)]">
                    <Tag className="w-3 h-3 text-[var(--text-muted)]" />{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
            <div>
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Source</div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                {deal.source === "ai_discovered" ? (
                  <><Bot className="w-4 h-4 text-blue-500" /><span className="font-medium">AI Discovered</span></>
                ) : (
                  <><UserCircle className="w-4 h-4 text-[var(--text-muted)]" />
                    <span>User{deal.submittedBy && <span className="font-semibold"> · {deal.submittedBy.username}</span>}</span></>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Added</div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <CalendarDays className="w-4 h-4 text-[var(--text-muted)]" />
                {formatDate(deal.createdAt)}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Verified</div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {formatDate(deal.lastVerifiedAt)}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Category</div>
            <Link
              href={`/categories/${deal.category.slug}`}
              className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors group"
            >
              <span className="text-base">{deal.category.icon}</span>
              <span className="font-medium group-hover:underline">{deal.category.name}</span>
            </Link>
          </div>
        </div>

        <div className="border-b border-[var(--border-light)] mt-8" />
      </motion.section>

      {/* DID IT WORK? */}
      <motion.section custom={5} variants={fadeUp} initial="hidden" animate="visible" className="mb-10">
        <h2 className="text-sm font-bold text-[var(--text-faint)] uppercase tracking-[0.15em] mb-5">Did this deal work?</h2>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => setReaction((r) => (r === "yes" ? null : "yes"))}
            className={`flex items-center justify-center gap-2.5 px-4 py-4 rounded-xl font-bold text-base transition-all duration-200 ${
              reaction === "yes"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
            }`}
          >
            {reaction === "yes" && <Check className="w-5 h-5" />}
            <ShieldCheck className={`w-5 h-5 ${reaction === "yes" ? "" : "text-emerald-500"}`} />
            Yes, it worked!
          </button>
          <button
            onClick={() => setReaction((r) => (r === "no" ? null : "no"))}
            className={`flex items-center justify-center gap-2.5 px-4 py-4 rounded-xl font-bold text-base transition-all duration-200 ${
              reaction === "no"
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                : "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60"
            }`}
          >
            {reaction === "no" && <Check className="w-5 h-5" />}
            No, didn&apos;t work
          </button>
        </div>

        <div className="bg-[var(--surface-sunken)] rounded-xl p-4 border border-[var(--border-light)]">
          <MeterBar yes={workedYes} no={workedNo} size="md" showLabels />
          <div className="flex justify-between mt-3 text-sm">
            <span className="font-bold text-emerald-600">{workedYes.toLocaleString()} confirmed</span>
            <span className="font-bold text-rose-500">{workedNo.toLocaleString()} failed</span>
          </div>
        </div>

        <div className="border-b border-[var(--border-light)] mt-8" />
      </motion.section>

      {/* COMMENTS */}
      <motion.section custom={6} variants={fadeUp} initial="hidden" animate="visible" className="mb-10">
        <h2 className="text-sm font-bold text-[var(--text-faint)] uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Comments ({comments.length})
        </h2>

        {/* Input */}
        <div className="mb-6">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={user ? "Share your experience with this deal..." : "Sign in to comment..."}
            rows={3}
            className="w-full bg-[var(--surface)] rounded-xl p-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] border border-[var(--border)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--brand-muted)] focus:outline-none resize-none transition-all"
          />
          <div className="flex items-center justify-between mt-3">
            {!user && <span className="text-xs text-[var(--text-muted)]">You&apos;ll be asked to sign in when posting</span>}
            <div className="ml-auto">
              <button
                onClick={handlePostComment}
                disabled={!commentText.trim() || posting}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  commentText.trim() && !posting
                    ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] shadow-sm"
                    : "bg-[var(--surface-sunken)] text-[var(--text-faint)] cursor-not-allowed"
                }`}
              >
                {posting ? "Posting..." : user ? "Post Comment" : "Sign In & Post"}
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        {comments.length > 0 ? (
          <div className="divide-y divide-[var(--border-light)]">
            {comments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <MessageSquare className="w-6 h-6 text-[var(--text-faint)] mx-auto mb-2" />
            <p className="text-[var(--text-muted)] text-sm">No comments yet. Be the first to share your experience!</p>
          </div>
        )}
      </motion.section>

      {/* RELATED DEALS */}
      {storeDeals.length > 0 && (
        <motion.section custom={7} variants={fadeUp} initial="hidden" animate="visible" className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-[var(--text-faint)] uppercase tracking-[0.15em]">
              More from {deal.store.name}
            </h2>
            <Link
              href={`/stores/${deal.store.slug}`}
              className="text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-dark)] transition-colors flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory no-scrollbar">
            {storeDeals.slice(0, 6).map((d) => (
              <div key={d.id} className="snap-start shrink-0 w-[280px]">
                <DealCard deal={d} />
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
