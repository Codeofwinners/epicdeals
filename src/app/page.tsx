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

function VoteButtons({ dealId, upvotes, downvotes, darkBg = false, whiteText = false, onCommentClick }: { dealId: string; upvotes: number; downvotes: number; darkBg?: boolean; whiteText?: boolean; onCommentClick?: () => void }) {
  const { user } = useAuth();
  const [voteStatus, setVoteStatus] = useState<any>(null);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    if (user?.uid) {
      getVoteStatus(user.uid, dealId)
        .then(setVoteStatus)
        .catch(err => {
          console.error("Error loading vote status:", err);
          setError("Error: " + err.message);
        });
    }
  }, [user?.uid, dealId]);

  const handleVote = async (type: "up" | "down") => {
    if (!user) {
      alert("Sign in to vote");
      return;
    }
    if (!db) return;

    setError(null);
    setVoting(true);
    try {
      if (type === "up") {
        await upvoteDeal(user.uid, dealId);
      } else {
        await downvoteDeal(user.uid, dealId);
      }
      const newStatus = await getVoteStatus(user.uid, dealId);
      setVoteStatus(newStatus);
    } catch (error: any) {
      console.error("Vote error:", error);
      setError("ERROR: " + (error?.message || "Failed to vote"));
      alert("Vote failed");
    } finally {
      setVoting(false);
    }
  };

  const displayUpvotes = upvotes + (voteStatus?.voteType === "upvote" ? 1 : 0) - (voteStatus?.voteType === "downvote" ? 0 : 0); // Simplified for now as it's netVotes from Firebase usually
  const netDisplay = upvotes + (voteStatus?.voteType === "upvote" ? 1 : 0) + (voteStatus?.voteType === "downvote" ? -1 : 0);

  const inactiveColor = whiteText ? "#fff" : (darkBg ? "#fff" : "#666");
  const activeUpColor = darkBg ? "#FFB84D" : "#FF4500";

  return (
    <div className={`flex items-center justify-between pt-2 ${whiteText ? "text-white" : ""}`} style={{ borderTop: `1px solid ${darkBg ? "rgba(255,255,255,0.1)" : "#EBEBEB"}`, color: inactiveColor }}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleVote("up")}
          disabled={voting}
          className="flex items-center gap-1 font-bold text-xs transition-colors cursor-pointer hover:opacity-80 bg-transparent border-none p-0 outline-none"
          style={{ color: voteStatus?.voteType === "upvote" ? activeUpColor : inactiveColor, opacity: voting ? 0.5 : 1 }}
          title="Upvote"
        >
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
          {(netDisplay / 1000).toFixed(1)}k
        </button>
        <button
          onClick={() => onCommentClick?.()}
          className="flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer hover:opacity-80 bg-transparent border-none p-0 outline-none"
          style={{ color: inactiveColor }}
          title="View comments"
        >
          <span className="material-symbols-outlined text-[14px]">chat_bubble</span>
        </button>
      </div>
      <button
        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:opacity-80 bg-transparent border-none p-0 outline-none"
        style={{ color: inactiveColor }}
        title="Save deal"
      >
        <span className="material-symbols-outlined text-[18px]">bookmark</span>
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
            <span className="text-[10px] font-mono border border-white/20 px-2 py-1 rounded text-white/70 uppercase">NIKE25</span>
            <div className="flex flex-col items-end">
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-purple-400 mb-0.5">
                <span className="material-symbols-outlined text-[11px]">schedule</span> Active
              </span>
            </div>
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
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#888888]">{deal.store.name}</span>
          {deal.isVerified && (
            <span className="material-symbols-outlined text-[14px] text-blue-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          )}
        </div>

        <h3 className="font-bold text-lg leading-snug text-[#1A1A1A] mb-4 line-clamp-2">{deal.title}</h3>
        <div className="mt-auto pt-2">
          <TopComment dealId={deal.id} />
          <VoteButtons dealId={deal.id} upvotes={deal.netVotes} downvotes={0} onCommentClick={toggleComments} />
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
        .masonry-grid { column-count: 2; column-gap: 12px; }
        @media (min-width: 768px) { .masonry-grid { column-count: 4; column-gap: 16px; } }
        .masonry-item { break-inside: avoid; margin-bottom: 16px; }
      `}</style>

      {/* DESKTOP */}
      <div className="hidden md:block bg-white text-black font-display min-h-screen antialiased">
        <Header />
        <main className="px-4 py-4 max-w-7xl mx-auto">
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
      <div className="md:hidden bg-white text-black font-display min-h-screen antialiased pb-24">
        <Header />
        <main className="px-3 py-3">
          <FilterBar timeRange={timeRange} setTimeRange={setTimeRange} sortBy={sortBy} setSortBy={setSortBy} />
          <h2 className="text-xl font-black tracking-tight mb-4 text-[#1A1A1A]">Legendary Weekly</h2>
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

        <nav className="fixed bottom-6 left-6 right-6 bg-black/90 backdrop-blur-xl border border-white/10 rounded-full p-1.5 z-50">
          <div className="flex justify-between items-center px-2">
            <a className="flex items-center justify-center p-3 rounded-full bg-white text-black w-10 h-10" href="#"><span className="material-symbols-outlined text-[20px]">home</span></a>
            <a className="flex items-center justify-center p-3 rounded-full text-white/50 w-10 h-10" href="#"><span className="material-symbols-outlined text-[20px]">explore</span></a>
            <button className="w-10 h-10 bg-[#FF4500] rounded-full flex items-center justify-center text-white"><span className="material-symbols-outlined text-[20px]">add</span></button>
            <a className="flex items-center justify-center p-3 rounded-full text-white/50 w-10 h-10" href="#"><span className="material-symbols-outlined text-[20px]">bookmark</span></a>
            <a className="flex items-center justify-center p-3 rounded-full text-white/50 w-10 h-10" href="#"><span className="material-symbols-outlined text-[20px]">person</span></a>
          </div>
        </nav>
      </div>
      <Footer />
    </>
  );
}
