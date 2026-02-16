"use client";

import { useState, useEffect } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, limit, Timestamp, doc, setDoc } from "firebase/firestore";
import { upvoteDeal, downvoteDeal, getVoteStatus } from "@/lib/firestore";

interface Deal {
  id: string;
  title: string;
  store: { name: string; id: string };
  imageUrl: string;
  savingsAmount: string;
  discount: string;
  workedYes: number;
  workedNo: number;
  commentCount: number;
  description: string;
}

function VoteButton({ dealId, userId, onVote }: { dealId: string; userId: string | null; onVote: () => void }) {
  const [status, setStatus] = useState<any>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (userId) {
      getVoteStatus(userId, dealId).then(setStatus).catch(err => console.error("Error:", err));
    }
  }, [userId, dealId]);

  const handleVote = async (type: "up" | "down") => {
    if (!userId) {
      alert("Sign in to vote");
      return;
    }
    setVoting(true);
    try {
      if (type === "up") await upvoteDeal(userId, dealId);
      else await downvoteDeal(userId, dealId);
      const newStatus = await getVoteStatus(userId, dealId);
      setStatus(newStatus);
      onVote();
    } catch (error) {
      console.error("Vote failed:", error);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button onClick={() => handleVote("up")} disabled={voting} className="flex items-center gap-1 text-[#FF4500] font-bold text-xs hover:opacity-80 transition-opacity">
        <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>arrow_upward</span> {((1200 + (status?.voteType === "upvote" ? 1 : 0))/1000).toFixed(1)}k
      </button>
      <button onClick={() => handleVote("down")} disabled={voting} className="flex items-center gap-1 text-[#666666] font-bold text-xs hover:opacity-80 transition-opacity">
        <span className="material-symbols-outlined text-[16px]">chat_bubble</span> 45
      </button>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeals() {
      if (!db) {
        setLoading(false);
        return;
      }

      try {
        // Seed if needed
        const snapshot = await getDocs(query(collection(db, "deals"), limit(1)));
        if (snapshot.empty) {
          await seedSampleDeals();
        }

        // Load deals
        const result = await getDocs(query(collection(db, "deals"), limit(12)));
        const loaded: Deal[] = result.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Deal));

        setDeals(loaded);
      } catch (error) {
        console.error("Load error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDeals();
  }, []);

  async function seedSampleDeals() {
    const sampleDeals = [
      {
        id: "seiko-watch",
        title: "Seiko 5 Sports Automatic Watch",
        store: { name: "Amazon", id: "amazon" },
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC0M6y_NX6jGlMjvXEm7w7l2tq0mKxvJGuh4j0yxEw91TqbxYYxGpmZDTWebRASaYfh9bzMuwEvD_TnX6qymYF0iMs8RGpY6M3Fzi6DMr9auKo_xxiS3cS-pmSmOBbix-1dgdCxjv9GoVFfCqeI9uJgJXJkL95BjLQMNriA65qMlsxoQAh7-vXjhgdmUWgMXTl83h66jQCLnRfkdF7dlgOlEUbWUP7d2smtKieBXn9rPcmm_fUtiqVEd2HpcVluK04xrjHyHx4cZrs",
        savingsAmount: "$90",
        discount: "33%",
        workedYes: 1200,
        workedNo: 45,
        commentCount: 5,
        description: "Best entry level automatic",
        createdAt: Timestamp.now(),
        submittedBy: "system",
        netVotes: 1155,
        isVerified: true,
        category: { id: "watches", name: "Watches" },
        slug: "seiko-watch",
      },
      {
        id: "nike-25off",
        title: "Nike Store Event - Extra 25% Off",
        store: { name: "Nike", id: "nike" },
        imageUrl: "https://via.placeholder.com/600x400",
        savingsAmount: "25% OFF",
        discount: "25%",
        workedYes: 2100,
        workedNo: 128,
        commentCount: 12,
        description: "Confirmed working on outlet items",
        createdAt: Timestamp.now(),
        submittedBy: "system",
        netVotes: 1972,
        isVerified: true,
        category: { id: "apparel", name: "Apparel" },
        slug: "nike-25off",
      },
    ];

    for (const deal of sampleDeals) {
      await setDoc(doc(db, "deals", deal.id), deal);
    }
  }

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { min-height: 100vh; background-color: #F9F9F7; padding-bottom: 140px; }
        .masonry-grid { column-count: 2; column-gap: 12px; }
        @media (min-width: 768px) { .masonry-grid { column-count: 4; column-gap: 16px; } }
        .masonry-item { break-inside: avoid; margin-bottom: 16px; }
      `}</style>

      {/* DESKTOP */}
      <div className="hidden md:block bg-white text-black font-display min-h-screen antialiased">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between gap-8 mb-8">
              <div className="text-4xl font-black tracking-tight">legit.<span style={{color: '#2563eb'}}>discount</span></div>
              <div className="flex items-center gap-4">
                <input placeholder="Search deals..." className="px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200" />
                <AuthButton />
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-4">
          <div className="masonry-grid">
            {loading ? (
              <div>Loading deals...</div>
            ) : (
              deals.map((deal) => (
                <div key={deal.id} className="masonry-item relative group rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-[#EBEBEB]">
                  <div className="relative w-full aspect-[3/4]">
                    <img alt={deal.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src={deal.imageUrl} />
                    <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[#1A1A1A] text-xs font-bold shadow-sm border border-white/50">{deal.discount}</div>
                    <div className="absolute bottom-4 left-4 z-20 bg-black/80 backdrop-blur-md text-white px-3 py-2 rounded-xl border border-white/10 flex flex-col items-start leading-none">
                      <span className="text-lg font-bold">{deal.savingsAmount}</span>
                    </div>
                  </div>
                  <div className="p-4 pt-3">
                    <h3 className="font-bold text-base leading-snug text-[#1A1A1A] mb-3 line-clamp-2">{deal.title}</h3>
                    <div className="bg-gray-50 rounded-xl p-2.5 mb-3 border border-gray-100">
                      <p className="text-[11px] leading-snug text-[#666666] line-clamp-2">{deal.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#EBEBEB]/60">
                      <VoteButton dealId={deal.id} userId={user?.uid || null} onVote={() => {}} />
                      <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#666666] hover:bg-gray-50 hover:text-[#1A1A1A] transition-colors">
                        <span className="material-symbols-outlined text-[20px]">bookmark</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* MOBILE */}
      <div className="md:hidden bg-white text-black font-display min-h-screen antialiased pb-24">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="text-2xl font-black">legit.<span style={{color: '#2563eb'}}>discount</span></div>
            <AuthButton />
          </div>
        </header>

        <main className="px-3 py-3">
          <div className="masonry-grid">
            {loading ? (
              <div>Loading...</div>
            ) : (
              deals.map((deal) => (
                <div key={deal.id} className="masonry-item relative group rounded-2xl overflow-hidden bg-white shadow-sm border border-[#EBEBEB]">
                  <div className="relative w-full aspect-[3/4]">
                    <img alt={deal.title} className="absolute inset-0 w-full h-full object-cover" src={deal.imageUrl} />
                    <div className="absolute top-3 left-3 z-20 px-2 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#1A1A1A] text-xs font-bold shadow-sm">{deal.discount}</div>
                    <div className="absolute bottom-3 left-3 z-20 bg-black/80 backdrop-blur-md text-white px-2 py-1.5 rounded-lg border border-white/10">
                      <span className="text-sm font-bold">{deal.savingsAmount}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm leading-snug text-[#1A1A1A] mb-2 line-clamp-2">{deal.title}</h3>
                    <div className="flex items-center justify-between pt-2 border-t border-[#EBEBEB]/60">
                      <VoteButton dealId={deal.id} userId={user?.uid || null} onVote={() => {}} />
                      <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#666666] hover:bg-gray-50">
                        <span className="material-symbols-outlined text-[18px]">bookmark</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </>
  );
}
