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
  Eye,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { MeterBar } from "@/components/ui/MeterBar";
import { DealBadge } from "@/components/ui/DealBadge";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
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
  });
}

// ─── Animation ──────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

// ─── Comment Card ───────────────────────────────────────────────
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

// ─── AI Legitimacy Report ───────────────────────────────────────
function AILegitimacyReport({ aiReview }: { aiReview: NonNullable<Deal["aiReview"]> }) {
  const verdictColor = aiReview.legitimacyScore >= 80
    ? { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46", icon: "#10b981" }
    : aiReview.legitimacyScore >= 60
    ? { bg: "#fffbeb", border: "#fde68a", text: "#92400e", icon: "#f59e0b" }
    : { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: "#ef4444" };

  const VerdictIcon = aiReview.legitimacyScore >= 80 ? CheckCircle2 : aiReview.legitimacyScore >= 60 ? AlertTriangle : XCircle;

  return (
    <section>
      <h2 className="text-sm font-bold text-[var(--text-faint)] uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        AI Legitimacy Report
      </h2>

      <div style={{ borderRadius: "16px", border: `1px solid ${verdictColor.border}`, backgroundColor: verdictColor.bg, padding: "20px" }}>
        {/* Verdict header */}
        <div className="flex items-center gap-3 mb-4">
          <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: verdictColor.icon + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <VerdictIcon style={{ width: 20, height: 20, color: verdictColor.icon }} />
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: verdictColor.text, textTransform: "capitalize" }}>
              {aiReview.verdict}
            </div>
            <div style={{ fontSize: "12px", color: verdictColor.text, opacity: 0.7 }}>
              {aiReview.confidence}% confidence
            </div>
          </div>
          <div className="ml-auto">
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: `conic-gradient(${verdictColor.icon} ${aiReview.legitimacyScore * 3.6}deg, #e5e7eb ${aiReview.legitimacyScore * 3.6}deg)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: "50%", backgroundColor: verdictColor.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", fontWeight: 900, color: verdictColor.text,
              }}>
                {aiReview.legitimacyScore}
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <p style={{ fontSize: "14px", lineHeight: 1.6, color: verdictColor.text, marginBottom: "16px" }}>
          {aiReview.summary}
        </p>

        {/* Reasons */}
        {aiReview.reasons.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            {aiReview.reasons.map((reason, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: verdictColor.text }}>
                <CheckCircle2 style={{ width: 14, height: 14, color: verdictColor.icon, marginTop: 2, flexShrink: 0 }} />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ─── Community Trust Fallback (when no AI review) ───────────────
function CommunityTrustSection({ trustPct, total }: { trustPct: number; total: number }) {
  if (total === 0) return null;
  const color = trustPct >= 80 ? "#10b981" : trustPct >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <section>
      <h2 className="text-sm font-bold text-[var(--text-faint)] uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
        <Shield className="w-4 h-4" />
        Trust Score
      </h2>
      <div style={{ borderRadius: "16px", border: "1px solid var(--border-light)", backgroundColor: "var(--surface)", padding: "20px", textAlign: "center" }}>
        <div style={{ fontSize: "40px", fontWeight: 900, color, lineHeight: 1 }}>{trustPct}%</div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: 4 }}>
          Based on {total} community {total === 1 ? "response" : "responses"}
        </div>
      </div>
    </section>
  );
}

// ─── Main Component ─────────────────────────────────────────────
interface DealDetailContentProps {
  deal: Deal;
}

export default function DealDetailContent({ deal }: DealDetailContentProps) {
  const { user, userProfile } = useAuth();
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
        user: { id: user.uid, username: userProfile?.handle || "Anonymous", avatar: user.photoURL || "", badges: [] },
      });
      setCommentText("");
    } catch (err) { console.error("Failed to post comment:", err); }
    finally { setPosting(false); }
  };

  const netVotes = (deal.upvotes ?? 0) - (deal.downvotes ?? 0) + (vote === "up" ? 1 : vote === "down" ? -1 : 0);
  const workedYes = (deal.workedYes ?? 0) + (reaction === "yes" ? 1 : 0);
  const workedNo = (deal.workedNo ?? 0) + (reaction === "no" ? 1 : 0);
  const total = workedYes + workedNo;
  const trustPct = total > 0 ? Math.round((workedYes / total) * 100) : 0;
  const comments = dealComments ?? [];
  const storeDeals = (storeDealsRaw ?? []).filter((d) => d.id !== deal.id).slice(0, 4);

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
    <article className="max-w-6xl mx-auto px-4 py-6 md:py-10">
      {/* ── BREADCRUMB ── */}
      <motion.nav custom={0} variants={fadeUp} initial="hidden" animate="visible" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 flex-wrap text-[13px] text-[var(--text-muted)] mb-8 list-none p-0 m-0">
          <li>
            <Link href="/" className="hover:text-[var(--brand)] transition-colors">Home</Link>
          </li>
          <li aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" className="text-[var(--text-faint)]"><path d="M4.5 2.5L7.5 6L4.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </li>
          <li>
            <Link href="/deals" className="hover:text-[var(--brand)] transition-colors">Deals</Link>
          </li>
          <li aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" className="text-[var(--text-faint)]"><path d="M4.5 2.5L7.5 6L4.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </li>
          <li>
            <Link href={`/stores/${deal.store.slug}`} className="hover:text-[var(--brand)] transition-colors">{deal.store.name}</Link>
          </li>
          <li aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" className="text-[var(--text-faint)]"><path d="M4.5 2.5L7.5 6L4.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </li>
          <li>
            <span className="text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-none font-medium">{deal.title}</span>
          </li>
        </ol>
      </motion.nav>

      {/* ── TWO-COLUMN LAYOUT ── */}
      <div className="lg:grid lg:gap-10" style={{ gridTemplateColumns: "1fr 340px" }}>

        {/* ═══ MAIN COLUMN ═══ */}
        <div className="min-w-0">

          {/* 1. POST HEADER — Reddit-inspired meta bar */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="flex items-center justify-between flex-wrap gap-3 mb-6"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={`/stores/${deal.store.slug}`}
                className="text-xs font-bold text-[var(--text-faint)] hover:text-[var(--brand)] uppercase tracking-[0.12em] transition-colors flex items-center gap-1"
              >
                {deal.store.name}
                <ArrowUpRight className="w-3 h-3" />
              </Link>
              <span className="text-xs text-[var(--text-muted)]">Posted {timeAgo(deal.createdAt)}</span>
              {deal.source === "ai_discovered" ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md">
                  <Bot className="w-3 h-3" /> AI Found
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                  <UserCircle className="w-3 h-3" /> User
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Inline votes */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setVote((v) => (v === "up" ? null : "up"))}
                  className={`p-1 rounded-md transition-all ${vote === "up" ? "text-[var(--brand)] bg-[var(--brand-muted)]" : "text-[var(--text-faint)] hover:text-[var(--brand)]"}`}
                >
                  <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <span className={`text-xs font-bold tabular-nums min-w-[2ch] text-center ${netVotes > 0 ? "text-[var(--brand)]" : "text-[var(--text-muted)]"}`}>
                  {netVotes}
                </span>
                <button
                  onClick={() => setVote((v) => (v === "down" ? null : "down"))}
                  className={`p-1 rounded-md transition-all ${vote === "down" ? "text-rose-400 bg-rose-50" : "text-[var(--text-faint)] hover:text-rose-400"}`}
                >
                  <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
              {/* Badges */}
              <div className="flex items-center gap-1.5">
                {deal.isVerified && <DealBadge type="verified" />}
                {deal.isTrending && <DealBadge type="trending" />}
                {deal.isCommunityPick && <DealBadge type="community_pick" />}
              </div>
            </div>
          </motion.div>

          {/* 2. DEAL HERO */}
          <motion.section custom={2} variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
            {/* Savings */}
            {deal.savingsAmount && (
              <div className="mb-3">
                <span className="font-editorial italic text-5xl sm:text-6xl md:text-7xl font-black text-savings leading-none tracking-tight">
                  {deal.savingsAmount}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
              {deal.title}
            </h1>

            {/* Description */}
            <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed mb-5 max-w-2xl">
              {deal.description}
            </p>

            {/* Deal image */}
            {deal.imageUrl && (
              <div className="rounded-2xl overflow-hidden mb-5 bg-[#F0F0F0]">
                <img
                  src={deal.imageUrl}
                  alt={deal.title}
                  className="w-full max-h-[400px] object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Inline trust stats */}
            <div className="flex items-center gap-4 flex-wrap text-xs">
              {total > 0 && (
                <span className={`font-bold tabular-nums ${trustPct >= 80 ? "text-emerald-600" : trustPct >= 60 ? "text-amber-600" : "text-rose-500"}`}>
                  {trustPct}% trust score
                </span>
              )}
              {(deal.usedLastHour ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-[var(--brand)] font-medium">
                  <Zap className="w-3 h-3" /> {deal.usedLastHour} used recently
                </span>
              )}
              {deal.expiresAt && (
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  <Clock className="w-3 h-3" /> Expires <CountdownTimer expiresAt={deal.expiresAt} compact />
                </span>
              )}
            </div>
          </motion.section>

          {/* 3. GET DEAL CTA */}
          <motion.section custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mb-10">
            {/* Promo code box */}
            {deal.code && (
              <div className="relative overflow-hidden rounded-2xl mb-4 animate-glow-breathe">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--brand)] via-[var(--brand-light)] to-[var(--brand)] animate-border-travel opacity-[0.12]" />
                <div className="absolute inset-[1px] rounded-[15px] bg-[var(--text-primary)]" />
                <div className="relative p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--brand-light)] animate-pulse-soft" />
                      <span className="text-[11px] font-semibold text-[var(--brand-light)] uppercase tracking-[0.2em]">Promo Code</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-medium">Verified</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <span className="font-mono text-2xl md:text-3xl font-black tracking-[0.25em] text-white select-all code-shimmer">
                      {deal.code}
                    </span>
                    <button
                      onClick={copyCode}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "10px 20px", borderRadius: "12px",
                        fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer",
                        backgroundColor: codeCopied ? "#10b981" : "var(--brand)",
                        color: "#fff",
                      }}
                    >
                      {codeCopied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Code</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Primary CTA + share */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={deal.dealUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "10px", padding: "14px 24px", borderRadius: "14px",
                  backgroundColor: "#0A0A0A", color: "#fff",
                  fontWeight: 800, fontSize: "16px", textDecoration: "none",
                  transition: "all 0.2s",
                }}
                className="hover:opacity-90 active:scale-[0.99]"
              >
                Get Deal at {deal.store.name}
                <ExternalLink className="w-5 h-5 opacity-70" />
              </a>
              <button
                onClick={copyUrl}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "8px", padding: "14px 20px", borderRadius: "14px",
                  fontWeight: 600, fontSize: "14px", cursor: "pointer",
                  backgroundColor: urlCopied ? "#ecfdf5" : "var(--surface)",
                  border: urlCopied ? "1px solid #a7f3d0" : "1px solid var(--border)",
                  color: urlCopied ? "#065f46" : "var(--text-secondary)",
                }}
              >
                {urlCopied ? <><Check className="w-4 h-4" /> Link Copied!</> : <><Share2 className="w-4 h-4" /> Share</>}
              </button>
            </div>

            {/* Expiry countdown bar */}
            {deal.expiresAt && (
              <div className="flex items-center gap-3 px-4 py-3 mt-4 bg-[var(--surface)] rounded-xl border border-amber-200/50">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Expires in</span>
                  <div className="mt-0.5"><CountdownTimer expiresAt={deal.expiresAt} /></div>
                </div>
              </div>
            )}
          </motion.section>

          {/* 4. AI LEGITIMACY REPORT */}
          <motion.section custom={4} variants={fadeUp} initial="hidden" animate="visible" className="mb-10">
            {deal.aiReview ? (
              <AILegitimacyReport aiReview={deal.aiReview} />
            ) : (
              <CommunityTrustSection trustPct={trustPct} total={total} />
            )}
          </motion.section>

          {/* 5. DEAL DETAILS */}
          <motion.section custom={5} variants={fadeUp} initial="hidden" animate="visible" className="mb-10">
            <h2 className="text-sm font-bold text-[var(--text-faint)] uppercase tracking-[0.15em] mb-5">Deal Details</h2>

            {/* Conditions */}
            {deal.conditions && (
              <div style={{ backgroundColor: "var(--surface-sunken)", borderRadius: "12px", padding: "16px", marginBottom: "20px", border: "1px solid var(--border-light)" }}>
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Terms & Conditions</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{deal.conditions}</p>
              </div>
            )}

            {/* Metadata as definition list */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6">
              <div>
                <dt className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Discount Type</dt>
                <dd className="text-sm text-[var(--text-secondary)] font-medium capitalize">{deal.discountType || deal.savingsType}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Category</dt>
                <dd>
                  <Link href={`/categories/${deal.category.slug}`}
                    className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors group"
                  >
                    <span className="text-base">{deal.category.icon}</span>
                    <span className="font-medium group-hover:underline">{deal.category.name}</span>
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Source</dt>
                <dd className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  {deal.source === "ai_discovered" ? (
                    <><Bot className="w-4 h-4 text-blue-500" /><span className="font-medium">AI Discovered</span></>
                  ) : (
                    <><UserCircle className="w-4 h-4 text-[var(--text-muted)]" />
                      <span>User{deal.submittedBy && <span className="font-semibold"> · {deal.submittedBy.username}</span>}</span></>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Posted</dt>
                <dd className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <CalendarDays className="w-4 h-4 text-[var(--text-muted)]" />
                  {formatDate(deal.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Last Verified</dt>
                <dd className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  {formatDate(deal.lastVerifiedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Views</dt>
                <dd className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Eye className="w-4 h-4 text-[var(--text-muted)]" />
                  {(deal.viewCount ?? 0).toLocaleString()}
                </dd>
              </div>
            </dl>

            {/* Tags */}
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

            <div className="border-b border-[var(--border-light)] mt-8" />
          </motion.section>

          {/* 6. COMMUNITY VERDICT */}
          <motion.section custom={6} variants={fadeUp} initial="hidden" animate="visible" className="mb-10">
            <h2 className="text-sm font-bold text-[var(--text-faint)] uppercase tracking-[0.15em] mb-5">Did This Deal Work?</h2>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => setReaction((r) => (r === "yes" ? null : "yes"))}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  padding: "14px", borderRadius: "14px", fontWeight: 700, fontSize: "15px",
                  cursor: "pointer", border: "none", transition: "all 0.2s",
                  backgroundColor: reaction === "yes" ? "#10b981" : "#ecfdf5",
                  color: reaction === "yes" ? "#fff" : "#065f46",
                }}
              >
                {reaction === "yes" && <Check className="w-5 h-5" />}
                <ShieldCheck className="w-5 h-5" />
                Yes, it worked!
              </button>
              <button
                onClick={() => setReaction((r) => (r === "no" ? null : "no"))}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  padding: "14px", borderRadius: "14px", fontWeight: 700, fontSize: "15px",
                  cursor: "pointer", border: "none", transition: "all 0.2s",
                  backgroundColor: reaction === "no" ? "#ef4444" : "#fef2f2",
                  color: reaction === "no" ? "#fff" : "#991b1b",
                }}
              >
                {reaction === "no" && <Check className="w-5 h-5" />}
                No, didn&apos;t work
              </button>
            </div>

            <div style={{ backgroundColor: "var(--surface-sunken)", borderRadius: "14px", padding: "16px", border: "1px solid var(--border-light)" }}>
              <MeterBar yes={workedYes} no={workedNo} size="md" showLabels />
              <div className="flex justify-between mt-3 text-sm">
                <span className="font-bold text-emerald-600">{workedYes.toLocaleString()} confirmed</span>
                <span className="font-bold text-rose-500">{workedNo.toLocaleString()} failed</span>
              </div>
              {total > 0 && (
                <div style={{ textAlign: "center", marginTop: 8, fontSize: "12px", color: "var(--text-muted)" }}>
                  {trustPct}% success rate
                </div>
              )}
            </div>

            <div className="border-b border-[var(--border-light)] mt-8" />
          </motion.section>

          {/* 7. COMMENTS */}
          <motion.section custom={7} variants={fadeUp} initial="hidden" animate="visible" className="mb-10">
            <h2 className="text-sm font-bold text-[var(--text-faint)] uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Community Discussion ({comments.length})
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
                    style={{
                      padding: "8px 18px", borderRadius: "12px", fontSize: "13px", fontWeight: 600,
                      border: "none", cursor: commentText.trim() && !posting ? "pointer" : "not-allowed",
                      backgroundColor: commentText.trim() && !posting ? "var(--brand)" : "var(--surface-sunken)",
                      color: commentText.trim() && !posting ? "#fff" : "var(--text-faint)",
                    }}
                  >
                    {posting ? "Posting..." : user ? "Post Comment" : "Sign In & Post"}
                  </button>
                </div>
              </div>
            </div>

            {/* Comment list */}
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

          {/* Related deals — mobile only (stacks below on small screens) */}
          {storeDeals.length > 0 && (
            <motion.section custom={8} variants={fadeUp} initial="hidden" animate="visible" className="mb-10 lg:hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-[var(--text-faint)] uppercase tracking-[0.15em]">
                  More from {deal.store.name}
                </h2>
                <Link href={`/stores/${deal.store.slug}`}
                  className="text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-dark)] transition-colors flex items-center gap-1"
                >
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-3">
                {storeDeals.map((d) => (
                  <Link key={d.id} href={`/deals/${d.slug}`} className="block p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-light)] hover:border-[var(--border)] transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[var(--text-primary)] truncate">{d.title}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">{d.description}</div>
                      </div>
                      {d.savingsAmount && (
                        <span style={{ fontSize: "14px", fontWeight: 900, color: "var(--brand)", whiteSpace: "nowrap" }}>
                          {d.savingsAmount}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}
        </div>

        {/* ═══ SIDEBAR (desktop only) ═══ */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">

            {/* A. Quick Action Card */}
            <div style={{ borderRadius: "16px", border: "1px solid var(--border-light)", backgroundColor: "var(--surface)", padding: "20px" }}>
              {deal.savingsAmount && (
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <span className="font-editorial italic text-3xl font-black text-savings leading-none">
                    {deal.savingsAmount}
                  </span>
                </div>
              )}
              <a
                href={deal.dealUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "8px", padding: "12px", borderRadius: "12px", width: "100%",
                  backgroundColor: "#0A0A0A", color: "#fff",
                  fontWeight: 800, fontSize: "14px", textDecoration: "none",
                  transition: "all 0.2s",
                }}
                className="hover:opacity-90"
              >
                Get Deal <ExternalLink className="w-4 h-4 opacity-70" />
              </a>
              <button
                onClick={copyUrl}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "6px", padding: "10px", borderRadius: "12px", width: "100%",
                  marginTop: 8, fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  backgroundColor: "transparent", border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                <Share2 className="w-3.5 h-3.5" /> Share Deal
              </button>
            </div>

            {/* B. Store Info Card */}
            <div style={{ borderRadius: "16px", border: "1px solid var(--border-light)", backgroundColor: "var(--surface)", padding: "20px" }}>
              <div className="text-xs font-bold text-[var(--text-faint)] uppercase tracking-wider mb-3">Store</div>
              <div className="flex items-center gap-3 mb-3">
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "var(--brand-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "var(--brand)" }}>
                  {deal.store.name[0]}
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">{deal.store.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{deal.store.domain}</div>
                </div>
              </div>
              {deal.store.activeDeals > 0 && (
                <div className="text-xs text-[var(--text-muted)] mb-3">
                  {deal.store.activeDeals} active deal{deal.store.activeDeals !== 1 ? "s" : ""}
                </div>
              )}
              <Link href={`/stores/${deal.store.slug}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "6px", padding: "10px", borderRadius: "10px", width: "100%",
                  fontSize: "13px", fontWeight: 600, textDecoration: "none",
                  backgroundColor: "var(--brand-muted)", color: "var(--brand)",
                }}
                className="hover:opacity-80 transition-opacity"
              >
                View All Deals <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* C. Deal Stats */}
            <div style={{ borderRadius: "16px", border: "1px solid var(--border-light)", backgroundColor: "var(--surface)", padding: "20px" }}>
              <div className="text-xs font-bold text-[var(--text-faint)] uppercase tracking-wider mb-3">Stats</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <ChevronUp className="w-3.5 h-3.5" /> Net Votes
                  </span>
                  <span className={`text-xs font-bold tabular-nums ${netVotes > 0 ? "text-[var(--brand)]" : "text-[var(--text-muted)]"}`}>{netVotes}</span>
                </div>
                {total > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <ShieldCheck className="w-3.5 h-3.5" /> Trust Score
                    </span>
                    <span className={`text-xs font-bold tabular-nums ${trustPct >= 80 ? "text-emerald-600" : trustPct >= 60 ? "text-amber-600" : "text-rose-500"}`}>{trustPct}%</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <Eye className="w-3.5 h-3.5" /> Views
                  </span>
                  <span className="text-xs font-bold text-[var(--text-secondary)] tabular-nums">{(deal.viewCount ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <MessageSquare className="w-3.5 h-3.5" /> Comments
                  </span>
                  <span className="text-xs font-bold text-[var(--text-secondary)] tabular-nums">{comments.length}</span>
                </div>
              </div>
            </div>

            {/* D. Related Deals */}
            {storeDeals.length > 0 && (
              <div style={{ borderRadius: "16px", border: "1px solid var(--border-light)", backgroundColor: "var(--surface)", padding: "20px" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-[var(--text-faint)] uppercase tracking-wider">Related Deals</div>
                  <Link href={`/stores/${deal.store.slug}`} className="text-[11px] font-semibold text-[var(--brand)] hover:underline">
                    See all
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {storeDeals.map((d) => (
                    <Link key={d.id} href={`/deals/${d.slug}`}
                      className="block p-3 rounded-xl hover:bg-[var(--surface-sunken)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[var(--text-primary)] truncate">{d.title}</div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{d.store.name}</div>
                        </div>
                        {d.savingsAmount && (
                          <span style={{ fontSize: "12px", fontWeight: 900, color: "var(--brand)", whiteSpace: "nowrap" }}>
                            {d.savingsAmount}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
