"use client";

import { useState, useEffect } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { useAuth } from "@/components/auth/AuthProvider";
import { upvoteDeal, downvoteDeal, getVoteStatus, getFilteredDeals, type TimeRange, type SortCategory } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { CommentsSection } from "@/components/deals/CommentsSection";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useBestComment } from "@/hooks/useFirestore";
import { FilterBar } from "@/components/deals/FilterBar";
import type { Deal } from "@/types/deals";

function fmtCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function VoteButtons({ dealId, upvotes, downvotes, darkBg = false, whiteText = false, onCommentClick }: { dealId: string; upvotes: number; downvotes: number; darkBg?: boolean; whiteText?: boolean; onCommentClick?: () => void }) {
  const { user } = useAuth();
  const [voteStatus, setVoteStatus] = useState<any>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (!db || !user?.uid) return;
    getVoteStatus(user.uid, dealId).then(setVoteStatus).catch(console.error);
  }, [user?.uid, dealId]);

  const handleVote = async (type: "up" | "down") => {
    if (!user) { alert("Sign in to vote"); return; }
    if (!db) return;
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

  const dividerColor = darkBg ? "rgba(255,255,255,0.08)" : "#EFEFEF";

  const restColor  = darkBg ? "rgba(255,255,255,0.3)" : "#C0C0C0";
  const activeColor = darkBg ? "#FFFFFF" : "#0A0A0A";

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "10px", borderTop: `1px solid ${dividerColor}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>

        {/* Upvote: arrow + count, bold black when active */}
        <button
          onClick={() => handleVote("up")}
          disabled={voting}
          style={{ display: "flex", alignItems: "center", gap: "3px", background: "none", border: "none", padding: 0, cursor: voting ? "wait" : "pointer", opacity: voting ? 0.4 : 1, outline: "none" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px", lineHeight: 1, color: isUpvoted ? activeColor : restColor, fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
          <span style={{ fontSize: "11px", fontWeight: isUpvoted ? 800 : 500, color: isUpvoted ? activeColor : restColor, letterSpacing: "0.01em", lineHeight: 1 }}>{fmtCount(netDisplay)}</span>
        </button>

        {/* Comment: bare icon */}
        <button
          onClick={() => onCommentClick?.()}
          style={{ display: "flex", alignItems: "center", background: "none", border: "none", padding: 0, cursor: "pointer", outline: "none" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px", color: restColor, lineHeight: 1 }}>chat_bubble</span>
        </button>
      </div>

      {/* Save: bare icon */}
      <button style={{ display: "flex", alignItems: "center", background: "none", border: "none", padding: 0, cursor: "pointer", outline: "none" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "14px", color: restColor, lineHeight: 1 }}>bookmark</span>
      </button>
    </div>
  );
}

function TopComment({ dealId, customBg, customBorder, textStyle }: { dealId: string; customBg?: string; customBorder?: string; textStyle?: string }) {
  const { data: comment, loading } = useBestComment(dealId);
  if (loading || !comment) return null;

  return (
    <div className={`mb-3 pb-3 border-b ${customBorder || "border-[#F0F0F0]"} flex flex-col gap-2 w-full`}>
      <div className="flex items-center gap-2 w-full">
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold shadow-sm">
          {comment.user.username[0].toUpperCase()}
        </div>
        <p className={`text-[10px] uppercase tracking-wider font-extrabold truncate ${textStyle || "text-[#1A1A1A]"}`}>{comment.user.username}</p>
      </div>
      <div className="flex-1 w-full">
        <p className={`text-[13px] leading-snug line-clamp-3 font-medium ${textStyle ? "text-white/90" : "text-[#555555]"}`}>"{comment.content}"</p>
      </div>
    </div>
  );
}

function DarkComment({ dealId }: { dealId: string }) {
  const { data: comment, loading } = useBestComment(dealId);
  if (loading || !comment) return null;

  return (
    <div className="mb-3 pb-3 border-b border-white/20 flex flex-col gap-2 w-full text-white">
      <div className="flex items-center gap-2 w-full">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-white text-[8px] font-black shadow-sm">
          {comment.user.username[0].toUpperCase()}
        </div>
        <p className="text-[10px] font-black text-white tracking-wider uppercase flex items-center gap-1.5 overflow-hidden">
          {comment.user.username}
          <span className="w-1 h-1 rounded-full bg-white/30"></span>
          <span className="text-[9px] text-white/70 normal-case font-medium">Insight</span>
        </p>
      </div>
      <p className="text-[13px] text-white/90 leading-snug line-clamp-3 italic font-medium">"{comment.content}"</p>
    </div>
  );
}

function formatExpiry(expiresAt: string | undefined): { label: string; urgent: boolean } | null {
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

function ExpiryBadge({ expiresAt, dark = false }: { expiresAt?: string; dark?: boolean }) {
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

function VerifiedBadge({ dark = false }: { dark?: boolean }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      paddingTop: "6px",
      marginTop: "2px",
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: "12px", color: "#10b981", fontVariationSettings: "'FILL' 1" }}>verified</span>
      <span style={{
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        color: "#10b981",
      }}>
        Verified by Legit.discount
      </span>
    </div>
  );
}

function DynamicDealCard({ deal, isOpen, toggleComments }: { deal: Deal, isOpen: boolean, toggleComments: () => void }) {
  const isNike = deal.store?.id === "nike";
  const isSpotify = deal.store?.id === "spotify";
  const isUber = deal.store?.id === "uber-eats";

  if (isNike) {
    return (
      <div className="rounded-3xl overflow-hidden bg-[#111] shadow-card text-white flex flex-col justify-between min-h-[420px] relative border border-gray-800">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600 rounded-full blur-[60px] opacity-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-30 pointer-events-none"></div>
        <div className="p-6 relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[10px] font-mono border border-white/20 px-2 py-1 rounded text-white/70 uppercase">{deal.code || "NIKE25"}</span>
            <ExpiryBadge expiresAt={deal.expiresAt} dark={true} />
          </div>
          <div className="flex-grow flex flex-col justify-center mb-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-2">{deal.store.name}</h2>
            <div className="text-5xl font-black tracking-tighter leading-[0.85] text-white break-words">EXTRA<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{deal.discount}</span><br />OFF</div>
            <p className="mt-4 text-sm text-white/80 font-medium leading-relaxed border-l-2 border-purple-500 pl-3">{deal.description}</p>
          </div>
          <DarkComment dealId={deal.id} />
          <VoteButtons dealId={deal.id} upvotes={deal.netVotes} downvotes={0} darkBg={true} whiteText={true} onCommentClick={toggleComments} />
          <CommentsSection dealId={deal.id} darkBg={true} isOpen={isOpen} onToggle={toggleComments} />
        </div>
      </div>
    );
  }

  if (isSpotify) {
    return (
      <div className="rounded-3xl overflow-hidden bg-[#1DB954] shadow-card border border-[#1db954]/20 flex flex-col justify-between min-h-[380px] relative transition-transform hover:scale-[1.02] duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="p-6 relative z-10 flex flex-col h-full text-white">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1DB954] shadow-lg">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">{deal.discount}</span>
            </div>
          </div>
          <div className="flex-grow mb-6">
            <h2 className="text-4xl font-black tracking-tighter leading-[0.9] text-white mb-4">3 Months<br />Premium <span className="text-black/30">Free</span></h2>
            <p className="text-sm text-white/90 font-bold leading-relaxed">{deal.description}</p>
          </div>
          <TopComment dealId={deal.id} customBorder="border-white/20" textStyle="text-white" />
          <VoteButtons dealId={deal.id} upvotes={deal.netVotes} downvotes={0} whiteText={true} darkBg={true} onCommentClick={toggleComments} />
          <CommentsSection dealId={deal.id} darkBg={true} isOpen={isOpen} onToggle={toggleComments} />
        </div>
      </div>
    );
  }

  if (isUber) {
    return (
      <div className="rounded-3xl overflow-hidden bg-black shadow-card text-white flex flex-col justify-between min-h-[400px] relative border border-gray-800">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="p-6 relative z-10 flex flex-col h-full text-white">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{deal.store.name}</span>
            <div className="text-xs font-mono bg-white text-black px-2 py-1 rounded font-bold">Uber Eats</div>
          </div>
          <div className="flex-grow text-center py-4 flex flex-col justify-center">
            <div className="text-8xl font-black leading-none tracking-tighter text-white drop-shadow-xl">{deal.savingsAmount}</div>
            <div className="text-xl font-bold tracking-[0.3em] mt-2 text-white/80">OFF FIRST</div>
            <div className="text-sm font-medium text-white/40 mt-1 uppercase tracking-widest">Order Only</div>
          </div>
          <DarkComment dealId={deal.id} />
          <VoteButtons dealId={deal.id} upvotes={deal.netVotes} downvotes={0} darkBg={true} whiteText={true} onCommentClick={toggleComments} />
          <CommentsSection dealId={deal.id} darkBg={true} isOpen={isOpen} onToggle={toggleComments} />
        </div>
      </div>
    );
  }

  const getFallbackImage = (deal: Deal) => {
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

  const displayImage = hasValidImage(deal.imageUrl) ? deal.imageUrl : getFallbackImage(deal);

  return (
    <div className="relative group rounded-3xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-all duration-300 border border-[#EBEBEB] text-black flex flex-col h-full">
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-50">
        <img
          alt={deal.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform hover:scale-105 duration-700"
          src={displayImage}
          onError={(e) => {
            const fallback = getFallbackImage(deal);
            if (e.currentTarget.src !== fallback) {
              e.currentTarget.src = fallback;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#1A1A1A] text-[11px] uppercase tracking-wide font-bold shadow-sm">-{deal.discount}</div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between gap-1 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#AAAAAA] truncate">{deal.store.name}</span>
          <ExpiryBadge expiresAt={deal.expiresAt} />
        </div>

        <h3 className="font-semibold text-[13px] leading-[1.35] text-[#1A1A1A] mb-3 line-clamp-2">{deal.title}</h3>
        <div className="mt-auto">
          <TopComment dealId={deal.id} />
          <VoteButtons dealId={deal.id} upvotes={deal.netVotes} downvotes={0} onCommentClick={toggleComments} />
          {deal.isVerified && <VerifiedBadge />}
          <CommentsSection dealId={deal.id} isOpen={isOpen} onToggle={toggleComments} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("last-7d");
  const [sortBy, setSortBy] = useState<SortCategory>("most-voted");

  const toggleComments = (dealId: string) => {
    setOpenComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) newSet.delete(dealId);
      else newSet.add(dealId);
      return newSet;
    });
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [timeRange, sortBy]);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const results = await getFilteredDeals({ timeRange, sortBy, limit: 12 });
      setDeals(results);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { min-height: 100vh; background-color: #F9F9F7; }
        .masonry-grid { column-count: 2; column-gap: 10px; }
        @media (min-width: 768px) { .masonry-grid { column-count: 4; column-gap: 20px; } }
        .masonry-item { break-inside: avoid; margin-bottom: 10px; }
        @media (min-width: 768px) { .masonry-item { margin-bottom: 20px; } }
      `}</style>

      {/* DESKTOP */}
      <div className="hidden md:block bg-white text-black font-display min-h-screen antialiased">
        <Header />
        <main className="px-6 py-6 max-w-7xl mx-auto">
          <FilterBar timeRange={timeRange} setTimeRange={setTimeRange} sortBy={sortBy} setSortBy={setSortBy} />
          {loading ? (
            <div className="flex items-center justify-center p-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : (
            <div className="masonry-grid">
              {deals.map((deal) => (
                <div key={deal.id} className="masonry-item">
                  <DynamicDealCard deal={deal} isOpen={openComments.has(deal.id)} toggleComments={() => toggleComments(deal.id)} />
                </div>
              ))}
            </div>
          )}
        </main>

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 z-50">
          <div className="flex justify-between items-center px-1">
            <a className="flex flex-col items-center justify-center p-2 rounded-xl text-white" href="#"><span className="material-symbols-outlined text-[24px]">home</span><span className="text-[10px] font-bold mt-1">Feed</span></a>
            <a className="flex flex-col items-center justify-center p-2 rounded-xl text-white/50" href="#"><span className="material-symbols-outlined text-[24px]">trending_up</span><span className="text-[10px] font-medium mt-1">Trends</span></a>
            <button className="w-12 h-12 bg-[#FF4500] rounded-full flex items-center justify-center text-white"><span className="material-symbols-outlined text-[24px]">add</span></button>
            <a className="flex flex-col items-center justify-center p-2 rounded-xl text-white/50" href="#"><span className="material-symbols-outlined text-[24px]">bookmark</span><span className="text-[10px] font-medium mt-1">Saves</span></a>
            <a className="flex flex-col items-center justify-center p-2 rounded-xl text-white/50" href="#"><span className="material-symbols-outlined text-[24px]">person</span><span className="text-[10px] font-medium mt-1">Me</span></a>
          </div>
        </nav>
      </div>

      {/* MOBILE */}
      <div className="md:hidden bg-white text-black font-display min-h-screen antialiased">
        <Header />
        <main className="px-3 pt-2 pb-8">
          <FilterBar timeRange={timeRange} setTimeRange={setTimeRange} sortBy={sortBy} setSortBy={setSortBy} />
          <h2 className="text-base font-black tracking-tight mb-3 text-[#1A1A1A]">
            {timeRange === "last-24h" ? "Daily Hits" : timeRange === "last-7d" ? "Weekly Legends" : timeRange === "last-30d" ? "Monthly Best" : "All-Time Best"}
          </h2>
          {loading ? (
            <div className="flex items-center justify-center p-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          ) : (
            <div className="masonry-grid">
              {deals.map((deal) => (
                <div key={deal.id} className="masonry-item">
                  <DynamicDealCard deal={deal} isOpen={openComments.has(deal.id)} toggleComments={() => toggleComments(deal.id)} />
                </div>
              ))}
            </div>
          )}
        </main>

      </div>
      <Footer />
    </>
  );
}
