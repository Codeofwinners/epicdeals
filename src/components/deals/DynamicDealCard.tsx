"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { upvoteDeal, downvoteDeal, getVoteStatus, getCommentCount } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { CommentsSection } from "@/components/deals/CommentsSection";
import { useBestComment } from "@/hooks/useFirestore";
import type { Deal } from "@/types/deals";
import { getStoreBrandTheme, getCardUITheme, THEME_DEFAULT, type CardUITheme } from "@/lib/brandThemes";

// ─── Shared helpers ───────────────────────────────────────────────────────────

export function fmtCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export const ACTIVE_GRADIENT = "linear-gradient(135deg, #006039 0%, #16a34a 50%, #84cc16 100%)";
export const gradientText = { background: ACTIVE_GRADIENT, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" as const };

// ─── Vote Buttons ─────────────────────────────────────────────────────────────

export function VoteButtons({ dealId, upvotes, downvotes, commentCount, theme, onCommentClick }: { dealId: string; upvotes: number; downvotes: number; commentCount?: number; theme: CardUITheme; onCommentClick?: () => void }) {
  const { user } = useAuth();
  const [voteStatus, setVoteStatus] = useState<any>(null);
  const [voting, setVoting] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [justVoted, setJustVoted] = useState(false);

  useEffect(() => {
    if (!db || !user?.uid) return;
    getVoteStatus(user.uid, dealId).then(setVoteStatus).catch(console.error);
  }, [user?.uid, dealId]);

  const handleVote = async (type: "up" | "down") => {
    if (!user) { alert("Sign in to vote"); return; }
    if (!db) return;

    if (type === "up" && voteStatus?.voteType !== "upvote") {
      setAnimKey(k => k + 1);
      setJustVoted(true);
      setTimeout(() => setJustVoted(false), 700);
    }

    setVoting(true);
    try {
      if (type === "up") await upvoteDeal(user.uid, dealId);
      else await downvoteDeal(user.uid, dealId);
      setVoteStatus(await getVoteStatus(user.uid, dealId));
    } catch (e: any) {
      console.error("Vote error:", e);
      alert("Vote failed");
    } finally {
      setVoting(false);
    }
  };

  const netDisplay = upvotes + (voteStatus?.voteType === "upvote" ? 1 : 0) + (voteStatus?.voteType === "downvote" ? -1 : 0);
  const isUpvoted = voteStatus?.voteType === "upvote";

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "10px", borderTop: `1px solid ${theme.divider}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>

        {/* Upvote button with animations */}
        <button
          onClick={() => handleVote("up")}
          disabled={voting}
          style={{ position: "relative", display: "flex", alignItems: "center", gap: "3px", background: "none", border: "none", padding: "4px 2px", cursor: voting ? "wait" : "pointer", outline: "none" }}
        >
          {justVoted && (
            <span key={`float-${animKey}`} style={{
              position: "absolute", top: "-2px", left: "50%",
              fontSize: "10px", fontWeight: 800, pointerEvents: "none",
              animation: "vote-float-up 0.65s ease-out forwards",
              ...theme.floatStyle,
            }}>+1</span>
          )}
          {justVoted && (
            <span key={`ring-${animKey}`} style={{
              position: "absolute", top: "50%", left: "8px",
              width: "14px", height: "14px",
              borderRadius: "50%", border: `1.5px solid ${theme.ringColor}`,
              pointerEvents: "none",
              animation: "vote-ring 0.55s ease-out forwards",
            }} />
          )}
          <span className="material-symbols-outlined" key={`arrow-${animKey}`} style={{
            fontSize: "12px", lineHeight: 1, fontVariationSettings: "'FILL' 1",
            display: "inline-block",
            animation: justVoted ? "vote-arrow-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
            ...(isUpvoted ? theme.upvoteActive : { color: theme.upvoteInactive }),
          }}>arrow_upward</span>
          <span key={`count-${animKey}`} style={{
            fontSize: "12px", fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1,
            display: "inline-block",
            animation: justVoted ? "count-pop 0.45s ease-out forwards" : "none",
            ...(isUpvoted ? theme.upvoteActive : { color: theme.countText }),
          }}>{fmtCount(netDisplay)}</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => onCommentClick?.()}
          style={{ display: "flex", alignItems: "center", gap: "3px", background: "none", border: "none", padding: 0, cursor: "pointer", outline: "none" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px", color: theme.icon, lineHeight: 1 }}>chat_bubble</span>
          {commentCount !== undefined && commentCount > 0 && (
            <span style={{ fontSize: "12px", fontWeight: 700, color: theme.countText, letterSpacing: "-0.01em", lineHeight: 1 }}>{fmtCount(commentCount)}</span>
          )}
        </button>
      </div>

      {/* Save */}
      <button style={{ display: "flex", alignItems: "center", background: "none", border: "none", padding: 0, cursor: "pointer", outline: "none" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "14px", color: theme.icon, lineHeight: 1 }}>bookmark</span>
      </button>
    </div>
  );
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function TopComment({ dealId, customBg, customBorder, textStyle }: { dealId: string; customBg?: string; customBorder?: string; textStyle?: string }) {
  const { data: comment, loading } = useBestComment(dealId);
  if (loading || !comment) return null;

  const isDark = !!textStyle;
  const borderColor = isDark ? "rgba(255,255,255,0.15)" : "#F0F0F0";

  return (
    <div style={{ marginBottom: "14px", paddingBottom: "14px", borderBottom: `1px solid ${borderColor}`, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold shadow-sm">
          {comment.user.username[0].toUpperCase()}
        </div>
        <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: isDark ? "#fff" : "#1A1A1A" }}>{comment.user.username}</span>
      </div>
      <div style={{ marginBottom: "8px", paddingLeft: "27px" }}>
        <span style={{ fontSize: "9px", fontWeight: 600, color: isDark ? "rgba(255,255,255,0.5)" : "#AAAAAA", letterSpacing: "0.06em", textTransform: "uppercase" }}>Insight</span>
      </div>
      <p style={{ fontSize: "13px", lineHeight: 1.5, fontWeight: 500, color: isDark ? "rgba(255,255,255,0.9)" : "#555555" }}>"{comment.content}"</p>
    </div>
  );
}

export function DarkComment({ dealId }: { dealId: string }) {
  const { data: comment, loading } = useBestComment(dealId);
  if (loading || !comment) return null;

  return (
    <div style={{ marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid rgba(255,255,255,0.15)", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-white text-[8px] font-black shadow-sm">
          {comment.user.username[0].toUpperCase()}
        </div>
        <span style={{ fontSize: "10px", fontWeight: 900, color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase" }}>{comment.user.username}</span>
      </div>
      <div style={{ marginBottom: "8px", paddingLeft: "27px" }}>
        <span style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Insight</span>
      </div>
      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.9)", lineHeight: 1.5, fontStyle: "italic", fontWeight: 500 }}>"{comment.content}"</p>
    </div>
  );
}

// ─── Expiry ───────────────────────────────────────────────────────────────────

export function formatExpiry(expiresAt: string | undefined): { label: string; urgent: boolean } | null {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt);
  const now = new Date();
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return null;
  if (diffDays === 0) return { label: "Expires today", urgent: true };
  if (diffDays === 1) return { label: "Expires tomorrow", urgent: true };
  if (diffDays <= 5) return { label: `Expires in ${diffDays}d`, urgent: true };
  return { label: `Exp. ${exp.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, urgent: false };
}

export function ExpiryBadge({ expiresAt, dark = false }: { expiresAt?: string; dark?: boolean }) {
  const expiry = formatExpiry(expiresAt);
  if (!expiry) return null;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "3px",
      fontSize: "9px",
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: expiry.urgent ? "#f97316" : (dark ? "rgba(255,255,255,0.5)" : "#9ca3af"),
      lineHeight: 1,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: "11px" }}>schedule</span>
      {expiry.label}
    </span>
  );
}

// ─── Verified ─────────────────────────────────────────────────────────────────

export function VerifiedShield({ size = 14 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle" }}>
      {/* Outer starburst / badge shape */}
      <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12z" fill="#0EA5E9" />
      {/* White checkmark */}
      <path d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" fill="#fff" />
    </svg>
  );
}

export function VerifiedBadge({ theme }: { theme: CardUITheme }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", paddingTop: "12px", paddingBottom: "4px", marginTop: "6px", borderTop: `1px solid ${theme.divider}` }}>
      <VerifiedShield size={16} />
      <span style={theme.verifiedText}>
        Verified by Legit.discount
      </span>
    </div>
  );
}

// ─── Deal CTA ─────────────────────────────────────────────────────────────────

export function DealCTA({ code, dealUrl, dark = false, theme }: { code?: string; dealUrl: string; dark?: boolean; theme?: CardUITheme }) {
  const [copied, setCopied] = useState(false);
  const copyCode = () => {
    navigator.clipboard.writeText(code!);
    window.open(dealUrl || "#", "_blank", "noopener,noreferrer");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const btnBg    = dark ? "#FFFFFF" : "#0A0A0A";
  const btnText  = dark ? "#0A0A0A" : "#FFFFFF";
  const learnColor = theme?.learnMore || (dark ? "rgba(255,255,255,0.4)" : "#AAAAAA");

  return (
    <div style={{ marginBottom: "10px" }}>
      {code ? (
        <button onClick={copyCode} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
          padding: "9px 10px",
          backgroundColor: dark ? "rgba(255,255,255,0.08)" : "#F5F5F5",
          border: `1px dashed ${dark ? "rgba(255,255,255,0.25)" : "#C8C8C8"}`,
          borderRadius: "8px", cursor: "pointer", outline: "none",
        }}>
          <span style={{ fontFamily: "monospace", fontSize: "11px", fontWeight: 800, color: dark ? "#fff" : "#0A0A0A", letterSpacing: "0.05em" }}>
            {copied ? "COPIED \u2713" : code}
          </span>
          {!copied && <span className="material-symbols-outlined" style={{ fontSize: "12px", color: dark ? "rgba(255,255,255,0.35)" : "#BBBBBB", lineHeight: 1, flexShrink: 0 }}>content_copy</span>}
        </button>
      ) : (
        <a href={dealUrl || "#"} target="_blank" rel="noopener noreferrer" style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "3px",
          padding: "9px 10px", backgroundColor: btnBg, borderRadius: "8px", textDecoration: "none",
        }}>
          <span style={{ fontSize: "11px", fontWeight: 800, color: btnText, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>Get Deal</span>
          <span className="material-symbols-outlined" style={{ fontSize: "12px", color: btnText, lineHeight: 1 }}>arrow_forward</span>
        </a>
      )}
    </div>
  );
}

// ─── Color Card Shell ─────────────────────────────────────────────────────────

export function ColorCard({ deal, isOpen, toggleComments, liveCommentCount, onCountChange, bg, border, glow, storeColor, isDark, useTopComment, hero, theme }: {
  deal: Deal; isOpen: boolean; toggleComments: () => void;
  liveCommentCount: number; onCountChange: (n: number) => void;
  bg: string; border: string; glow?: React.ReactNode;
  storeColor: string; isDark: boolean; useTopComment?: boolean;
  hero: React.ReactNode; theme: CardUITheme;
}) {
  return (
    <div className="deal-card rounded-2xl overflow-hidden flex flex-col relative" style={{ background: bg, border }}>
      {glow}
      <div style={{ padding: "16px 16px 20px", position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: storeColor }}>{deal.store.name}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ExpiryBadge expiresAt={deal.expiresAt} dark />
            <a href={deal.dealUrl || "#"} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "10px", fontWeight: 600, color: theme.learnMore, textDecoration: "none", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
              Learn more
            </a>
          </div>
        </div>

        {hero}

        <DealCTA code={deal.code} dealUrl={deal.dealUrl} dark={isDark} theme={theme} />

        <div className="mt-auto">
          {useTopComment
            ? <TopComment dealId={deal.id} customBorder="border-white/20" textStyle="text-white" />
            : <DarkComment dealId={deal.id} />}
          <VoteButtons dealId={deal.id} upvotes={deal.netVotes} downvotes={0} commentCount={liveCommentCount} theme={theme} onCommentClick={toggleComments} />
          {deal.isVerified && <VerifiedBadge theme={theme} />}
        </div>
        <CommentsSection dealId={deal.id} darkBg={isDark} isOpen={isOpen} onToggle={toggleComments} onCountChange={onCountChange} />
      </div>
    </div>
  );
}

// ─── Fallback Image ───────────────────────────────────────────────────────────

export function getFallbackImage(deal: Deal) {
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
}

// ─── Main DynamicDealCard ─────────────────────────────────────────────────────

export default function DynamicDealCard({ deal, isOpen, toggleComments }: { deal: Deal, isOpen: boolean, toggleComments: () => void }) {
  const [liveCommentCount, setLiveCommentCount] = useState(deal.commentCount || 0);

  useEffect(() => {
    getCommentCount(deal.id).then((count) => {
      setLiveCommentCount(count);
    });
  }, [deal.id]);

  const shared = { deal, isOpen, toggleComments, liveCommentCount, onCountChange: setLiveCommentCount };

  const hasValidImage = (url: string | undefined | null) => {
    if (!url) return false;
    const t = url.trim();
    if (t === "" || t === "null" || t === "undefined" || t.length < 5) return false;
    return true;
  };

  const dealHasImage = hasValidImage(deal.imageUrl);

  // Branded color card (no image)
  if (!dealHasImage) {
    const brandTheme = getStoreBrandTheme(deal.store?.id || "", deal.store?.name || "");
    const theme = getCardUITheme(brandTheme.themeType);
    const raw = (deal.discount || deal.savingsAmount || "").replace(/\s*off\s*/gi, "").trim();
    const isBright = brandTheme.themeType === "bright";

    return (
      <ColorCard {...shared}
        bg={brandTheme.bgGradient}
        border={`1px solid ${brandTheme.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"}`}
        isDark={brandTheme.isDark}
        useTopComment={isBright}
        theme={theme}
        storeColor={brandTheme.storeColor}
        glow={brandTheme.glowColor
          ? <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-[50px] pointer-events-none" style={{ backgroundColor: brandTheme.glowColor }} />
          : (isBright
            ? <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent pointer-events-none" />
            : undefined)}
        hero={<>
          {raw && (
            <div style={{ marginBottom: "8px", overflow: "visible" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "4px", flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "clamp(20px, 7vw, 44px)", fontWeight: 900, lineHeight: 0.95,
                  letterSpacing: "-0.03em", color: brandTheme.textColor,
                }}>{raw}</span>
                <span style={{
                  fontSize: "clamp(14px, 5vw, 32px)", fontWeight: 900, lineHeight: 0.95,
                  letterSpacing: "-0.03em",
                  color: brandTheme.isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)",
                }}>OFF</span>
              </div>
            </div>
          )}
          <h3 style={{
            fontSize: raw ? "12px" : "clamp(16px, 5.5vw, 24px)",
            fontWeight: raw ? 700 : 900,
            color: brandTheme.textColor,
            lineHeight: 1.3, marginBottom: "4px",
            ...(raw ? {} : { letterSpacing: "-0.03em" }),
          }}>{deal.title}</h3>
          <p style={{
            fontSize: "11px",
            color: brandTheme.isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
            lineHeight: 1.4, marginBottom: "10px",
          }}>{deal.description}</p>
        </>}
      />
    );
  }

  // Standard image card (has image)
  return (
    <div className="deal-card relative group rounded-2xl overflow-hidden bg-white border border-[#E4E4E4] text-black flex flex-col h-full">
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#F0F0F0]">
        <img
          alt={deal.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
          src={deal.imageUrl!}
          onError={(e) => {
            const fallback = getFallbackImage(deal);
            if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
        {deal.discount && deal.discount.trim() !== "" && (
          <div style={{
            position: "absolute", top: "10px", left: "10px", zIndex: 20,
            display: "inline-flex", alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: "8px",
            padding: "4px 8px",
            border: "1px solid rgba(255,255,255,0.12)",
          }}>
            <span style={{ fontFamily: "monospace", fontSize: "11px", fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>{"\u2212"}{deal.discount.replace(/^[-\u2212]/, "")}</span>
          </div>
        )}
      </div>

      <div style={{ padding: "12px 16px 20px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px", marginBottom: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#BBBBBB" }}>{deal.store.name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ExpiryBadge expiresAt={deal.expiresAt} />
            <a href={deal.dealUrl || "#"} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "10px", fontWeight: 600, color: "#AAAAAA", textDecoration: "none", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
              Learn more
            </a>
          </div>
        </div>

        <h3 style={{ fontWeight: 800, fontSize: "13px", lineHeight: 1.3, color: "#0A0A0A", marginBottom: "5px" }}>{deal.title}</h3>
        <p style={{ fontSize: "11px", color: "#888888", lineHeight: 1.4, marginBottom: "10px" }}>{deal.description}</p>

        <DealCTA code={deal.code} dealUrl={deal.dealUrl} />

        <div className="mt-auto">
          <TopComment dealId={deal.id} />
          <VoteButtons dealId={deal.id} upvotes={deal.netVotes} downvotes={0} commentCount={liveCommentCount} theme={THEME_DEFAULT} onCommentClick={toggleComments} />
          {deal.isVerified && <VerifiedBadge theme={THEME_DEFAULT} />}
          <CommentsSection dealId={deal.id} isOpen={isOpen} onToggle={toggleComments} onCountChange={setLiveCommentCount} />
        </div>
      </div>
    </div>
  );
}
