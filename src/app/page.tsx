"use client";

import { useState, useEffect } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { useAuth } from "@/components/auth/AuthProvider";
import { upvoteDeal, downvoteDeal, getVoteStatus } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { seedDeals } from "@/lib/seedDeals";

function VoteButtons({ dealId, upvotes, downvotes }: { dealId: string; upvotes: number; downvotes: number }) {
  const { user } = useAuth();
  const [voteStatus, setVoteStatus] = useState<any>(null);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("DB initialized:", !!db, "User:", user?.uid, "DealId:", dealId);
    if (!db) {
      setError("Firebase DB not initialized");
      return;
    }

    if (user?.uid) {
      console.log("Loading vote status for user:", user.uid, "deal:", dealId);
      getVoteStatus(user.uid, dealId)
        .then(status => {
          console.log("Vote status:", status);
          setVoteStatus(status);
        })
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

    if (!db) {
      alert("Firebase not initialized");
      return;
    }

    // Wait a moment for deals to be seeded
    await new Promise(r => setTimeout(r, 500));

    setError(null);
    setVoting(true);
    console.log("Starting vote:", type, "user:", user.uid, "deal:", dealId);

    try {
      if (type === "up") {
        console.log("Calling upvoteDeal...");
        await upvoteDeal(user.uid, dealId);
      } else {
        console.log("Calling downvoteDeal...");
        await downvoteDeal(user.uid, dealId);
      }

      console.log("Vote complete, loading new status...");
      const newStatus = await getVoteStatus(user.uid, dealId);
      console.log("New vote status:", newStatus);
      setVoteStatus(newStatus);
    } catch (error: any) {
      console.error("Full error object:", error);
      const errorMsg = error?.message || error?.code || JSON.stringify(error);
      console.error("Vote error:", errorMsg);
      setError("ERROR: " + errorMsg);
      alert("Vote failed:\n" + errorMsg);
    } finally {
      setVoting(false);
    }
  };

  const displayUpvotes = upvotes + (voteStatus?.voteType === "upvote" ? 1 : 0);
  const displayDownvotes = downvotes + (voteStatus?.voteType === "downvote" ? 1 : 0);

  return (
    <div className="flex flex-col gap-2">
      {error && <div style={{color: "red", fontSize: "12px"}}>{error}</div>}
      <div className="flex items-center justify-between pt-2 border-t border-[#EBEBEB]/60">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleVote("up")}
            disabled={voting}
            className="flex items-center gap-1 text-xs font-bold hover:text-[#FF4500] transition-colors cursor-pointer"
            style={{color: voteStatus?.voteType === "upvote" ? "#FF4500" : "#666", opacity: voting ? 0.5 : 1}}
          >
            <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>arrow_upward</span> {(displayUpvotes/1000).toFixed(1)}k
          </button>
          <button
            onClick={() => handleVote("down")}
            disabled={voting}
            className="flex items-center gap-1 text-xs font-bold hover:text-red-500 transition-colors cursor-pointer"
            style={{color: voteStatus?.voteType === "downvote" ? "#ef4444" : "#666", opacity: voting ? 0.5 : 1}}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_downward</span> {(displayDownvotes/1000).toFixed(1)}k
          </button>
        </div>
        <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#666666] hover:bg-gray-50 hover:text-[#1A1A1A] transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-[20px]">bookmark</span>
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  // Seed deals on mount
  useEffect(() => {
    console.log("🔥 Home mounted - seeding deals...");
    seedDeals().catch(err => console.error("Seed failed:", err));
  }, []);

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        body {
          min-height: 100vh;
          background-color: #F9F9F7;
          padding-bottom: 140px;
        }
        .masonry-grid {
          column-count: 2;
          column-gap: 12px;
        }
        @media (min-width: 768px) {
          .masonry-grid {
            column-count: 4;
            column-gap: 16px;
          }
        }
        .masonry-item {
          break-inside: avoid;
          margin-bottom: 16px;
        }
        .card-overlay {
          background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%);
        }
      `}</style>

      {/* DESKTOP */}
      <div className="hidden md:block bg-white text-black font-display min-h-screen antialiased">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200/40 backdrop-blur-md">
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

            .nav-brand {
              font-family: 'Outfit', sans-serif;
              font-weight: 800;
              letter-spacing: -0.025em;
            }

            .nav-accent {
              background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }

            .nav-tab {
              position: relative;
              font-family: 'Outfit', sans-serif;
              font-weight: 600;
              letter-spacing: -0.01em;
              transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .nav-tab::after {
              content: '';
              position: absolute;
              bottom: -8px;
              left: 0;
              width: 0;
              height: 2px;
              background: linear-gradient(90deg, #0EA5E9 0%, #06B6D4 100%);
              transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .nav-tab.active::after,
            .nav-tab:hover::after {
              width: 100%;
            }

            .nav-tab:hover {
              transform: translateY(-2px);
              color: #0EA5E9;
            }

            .search-container {
              position: relative;
              transition: all 0.3s ease;
            }

            .search-container:focus-within {
              transform: translateY(-1px);
            }

            .search-input {
              font-family: 'Inter', sans-serif;
              transition: all 0.3s ease;
              background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
            }

            .search-input:focus {
              background: linear-gradient(135deg, #ffffff 0%, #ffffff 100%);
              box-shadow: 0 8px 24px rgba(14, 165, 233, 0.12);
            }

            .sort-btn {
              font-family: 'Outfit', sans-serif;
              font-weight: 600;
              transition: all 0.25s ease;
            }

            .sort-btn:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }

            .sort-btn.active {
              background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
              color: white;
              box-shadow: 0 6px 16px rgba(14, 165, 233, 0.2);
            }
          `}</style>

          <div className="px-8 py-5">
            {/* Top row: Logo + Search + Actions */}
            <div className="flex items-center justify-between gap-8 mb-8">
              {/* Brand */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="nav-brand text-4xl leading-none">
                    <span className="text-black">legit.</span>
                    <span className="nav-accent">discount</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-0.5">Verified Deals</span>
              </div>

              {/* Search + Profile */}
              <div className="flex items-center gap-4 flex-1 max-w-lg">
                <div className="search-container flex-1">
                  <input
                    type="text"
                    placeholder="Search deals, stores, codes..."
                    className="search-input w-full px-5 py-3.5 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 transition-all duration-300"
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-300">
                    <span className="material-symbols-outlined text-[20px]">search</span>
                  </button>
                </div>

                <AuthButton />
              </div>
            </div>

            {/* Bottom row: Tabs + Sort */}
            <div className="flex items-center justify-between gap-8">
              {/* Tabs Navigation */}
              <div className="flex gap-8">
                {[
                  { label: 'Daily Hits', id: 'daily' },
                  { label: 'Weekly Legends', id: 'weekly' },
                  { label: 'All-Time Best', id: 'alltime' }
                ].map((tab, i) => (
                  <button
                    key={tab.id}
                    className={`nav-tab text-sm transition-all ${
                      i === 0 ? 'text-black active' : 'text-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2 pl-6 border-l border-gray-200/50">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">Sort:</span>
                {[
                  { icon: 'local_fire_department', label: 'Hot', accent: true },
                  { icon: 'trending_up', label: 'Rising' },
                  { icon: 'new_releases', label: 'New' },
                  { icon: 'chat', label: 'Discussed' }
                ].map((item, i) => (
                  <button
                    key={i}
                    className={`sort-btn flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                      item.accent
                        ? 'bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 border border-blue-200/50'
                        : 'bg-white text-gray-700 border border-gray-200/50 hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-4">
          <div className="masonry-grid">
            {/* Card 1: Seiko Watch */}
            <div className="masonry-item relative group rounded-3xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-all duration-300 border border-[#EBEBEB]">
              <div className="relative w-full aspect-[3/4]">
                <img alt="Seiko Watch" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0M6y_NX6jGlMjvXEm7w7l2tq0mKxvJGuh4j0yxEw91TqbxYYxGpmZDTWebRASaYfh9bzMuwEvD_TnX6qymYF0iMs8RGpY6M3Fzi6DMr9auKo_xxiS3cS-pmSmOBbix-1dgdCxjv9GoVFfCqeI9uJgJXJkL95BjLQMNriA65qMlsxoQAh7-vXjhgdmUWgMXTl83h66jQCLnRfkdF7dlgOlEUbWUP7d2smtKieBXn9rPcmm_fUtiqVEd2HpcVluK04xrjHyHx4cZrs" />
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[#1A1A1A] text-xs font-bold shadow-sm border border-white/50">-33%</div>
                <div className="absolute bottom-4 left-4 z-20 bg-black/80 backdrop-blur-md text-white px-3 py-2 rounded-xl border border-white/10 flex flex-col items-start leading-none">
                  <span className="text-xs opacity-70 line-through mb-0.5">$275</span>
                  <span className="text-lg font-bold">$185</span>
                </div>
              </div>
              <div className="p-4 pt-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Amazon</span>
                  <span className="material-symbols-outlined text-[12px] text-blue-500" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                </div>
                <h3 className="font-bold text-base leading-snug text-[#1A1A1A] mb-3 line-clamp-2">Seiko 5 Sports Automatic Watch</h3>
                <div className="bg-gray-50 rounded-xl p-2.5 mb-3 border border-gray-100 flex gap-2.5 items-start">
                  <img alt="User" className="w-6 h-6 rounded-full border border-white shadow-sm flex-shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDh5glKU2OYGAnxpAphPCIf_DvROcj5qnpIXzq5uF98p-p4faGz2bW17B1Gw7whrcy5pgnA2KImIQVpnMWysX92afM35gTJ6sbozc63heXlppQhn0WBbYmeTEq_tSqhxv1uBltFW69qHP54NEoCk5sN5aVtXtAVOR6AA_IGuUiYOul1wWtgkJvhtLY6gJkz9cfu0-9FFGQO9_3nGfZC5skqft2dhDKLw7hpW1RPeAvaTt8FN4pmPvdaL2LRIbn2XJHkZDHbfldbqw" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#1A1A1A] mb-0.5">WatchCollector88</span>
                    <p className="text-[11px] leading-snug text-[#666666] line-clamp-2">Best entry level automatic. The jubilee bracelet is surprisingly comfy for this price point.</p>
                  </div>
                </div>
                <VoteButtons dealId="seiko-watch" upvotes={1200} downvotes={45} />
              </div>
            </div>

            {/* Card 2: Nike Promo */}
            <div className="masonry-item rounded-3xl overflow-hidden bg-[#111] shadow-card text-white flex flex-col justify-between min-h-[420px] relative border border-gray-800">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600 rounded-full blur-[60px] opacity-40 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-30 pointer-events-none"></div>
              <div className="p-6 relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-mono border border-white/20 px-2 py-1 rounded text-white/70 uppercase">NIKE25</span>
                  <div className="flex flex-col items-end">
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-purple-400 mb-0.5">
                      <span className="material-symbols-outlined text-[11px]">schedule</span> Ends in
                    </span>
                    <div className="text-xl font-black text-white leading-none tracking-tight">2d 14h</div>
                  </div>
                </div>
                <div className="flex-grow flex flex-col justify-center mb-6">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-2">Nike Store Event</h2>
                  <div className="text-6xl font-black tracking-tighter leading-[0.85] text-white break-words">EXTRA<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">25%</span><br/>OFF</div>
                  <p className="mt-4 text-sm text-white/80 font-medium leading-relaxed border-l-2 border-purple-500 pl-3">Valid on clearance items. The community is going crazy over the Air Jordan restocks included in this.</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10 flex gap-3 items-start backdrop-blur-sm">
                  <img alt="User" className="w-8 h-8 rounded-full border border-white/20 shadow-sm flex-shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMOiVe6WRRQ2d1Uu7ClaIp5O-tQtD1qrgs0S4govVxLR6kbds89rHg0ZkAh1Yc7BLdH55SVRfTHKAkKEfxwrNPOooRQx1jaoX7xdVx9_8QU8WMS9YAbcEsEwtK3s4niQyBFHrZwiMcxV-AZV9INwq_ddus4rwA3cunOYBuNzy2TeKfkav1HcUwlvGhxDcV5DDVl8Ef5kMLJciOYGZa3D_dL0OFtl-ixQWx-79pHXTPzVaWysZNpsdW_LJj3ws1op42c1-sXI7wFOI" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-white mb-0.5">SneakerHead_Official</span>
                    <p className="text-[12px] leading-snug text-white/70">Confirmed working on outlet items too. Just grabbed VaporMax for $90.</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-purple-400 font-bold text-sm">
                      <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span> 2.1k
                    </div>
                    <div className="flex items-center gap-1.5 text-white/60 font-bold text-sm hover:text-white transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">chat_bubble</span> 128
                    </div>
                  </div>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[20px]">bookmark</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Espresso Machine */}
            <div className="masonry-item relative group rounded-3xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-all duration-300 border border-[#EBEBEB]">
              <div className="relative w-full aspect-[3/5]">
                <img alt="Espresso Machine" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCV16gCseuB648qlcRc4CHJX4IxCPsxHtUsUUaYUw-ISHdB5OzL0jw3JFkqJ1O4hUQGx0KUdJsHRw4njcmOJptpJBirt3kF0bCOLrAdfoxXjiB46-uXLwTg-3SUbdVRYNIyzIQChi5UNplCciGQ146s_SS3AvtHOJ1khEQgZVp2-rvsdSOLn9xTv4DVKrtU5M0zKBK0nUpY2em7pZzzkg4jY96KfTcnGI8-7Yw54kCKuX3Ma37EDalUv1bCsMk1weE6w7niYhpuMMs" />
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-green-500 text-white text-xs font-bold shadow-sm">$150 OFF</div>
                <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-xl text-[#1A1A1A] px-3 py-2 rounded-xl shadow-lg border border-white/50 flex flex-col items-start leading-none">
                  <span className="text-xs text-[#666666] line-through mb-0.5">$750</span>
                  <span className="text-lg font-bold">$599</span>
                </div>
              </div>
              <div className="p-4 pt-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Best Buy</span>
                </div>
                <h3 className="font-bold text-base leading-snug text-[#1A1A1A] mb-3 line-clamp-2">Breville Barista Express Espresso Machine</h3>
                <div className="bg-gray-50 rounded-xl p-2.5 mb-3 border border-gray-100 flex gap-2.5 items-start">
                  <img alt="User" className="w-6 h-6 rounded-full border border-white shadow-sm flex-shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiRnqIybdKOPItxVVI2iC0fiw5Bj4zhKLMqfUyTERGDWsyTV-wZSzrN0jehIdnp-aLqdw-hsCxgnTgoS1mGMqhQTGOASP52oxBFExc5a_JkDGfutm3PAdsQ84vfTDRIheEwwnMtLlBskOKhMNe3MJfQ2fAkZJzkAZi4zniCylkiLaFfO-V78sD3LnufLf8z2Gpwc2PPxQWwtENYPMIjeEZXRg9oe8ZXsajGWQhmF3guwOHJLPR3pW3IPlwIT0PHRTBO85qhQawEJU" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#1A1A1A] mb-0.5">BaristaBob</span>
                    <p className="text-[11px] leading-snug text-[#666666] line-clamp-2">Requires some dialing in, but once set, it beats Starbucks easily. Grinder is consistent.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#EBEBEB]/60">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[#FF4500] font-bold text-xs">
                      <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>arrow_upward</span> 8.5k
                    </div>
                    <div className="flex items-center gap-1 text-[#666666] font-bold text-xs hover:text-[#1A1A1A] transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[16px]">chat_bubble</span> 342
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#666666] hover:bg-gray-50 hover:text-[#1A1A1A] transition-colors">
                    <span className="material-symbols-outlined text-[20px]">bookmark</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 4: Spotify */}
            <div className="masonry-item rounded-3xl overflow-hidden bg-white shadow-card border border-[#EBEBEB] flex flex-col justify-between min-h-[380px] relative">
              <div className="absolute inset-0 bg-[#1db954] opacity-[0.03]"></div>
              <div className="p-6 relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-[#1db954] flex items-center justify-center text-white shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">music_note</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#1db954] bg-[#1db954]/10 px-2 py-1 rounded-full">Free</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#666666] mb-0.5">
                      <span className="material-symbols-outlined text-[11px]">schedule</span> Expiring
                    </span>
                    <div className="text-xl font-black text-[#1db954] leading-none tracking-tight">Dec 31</div>
                  </div>
                </div>
                <div className="flex-grow mb-4">
                  <h2 className="text-5xl font-black tracking-tighter leading-[0.9] text-[#1A1A1A] mb-3">3 Months<br/><span className="text-[#1db954]">Premium</span></h2>
                  <p className="text-sm text-[#666666] font-medium">New subscribers only. Standard auto-renewal applies after trial.</p>
                </div>
                <div className="bg-white rounded-xl p-3 mb-4 border border-[#EBEBEB] shadow-sm flex gap-3 items-start">
                  <img alt="User" className="w-8 h-8 rounded-full border border-gray-100 shadow-sm flex-shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCv0Ga-q3HerYTotdiaCosccCbAfFWkneGO5NpTqfoXt1nSZBXx9cspVOha8giGHdSIlOYJEpIDL3EYNC-CoW9CTit27_hx86FIC4hatLY36gP5GBhH3ZaLmXXCDxPRzSjClPOIWnJedmhrV0gZ2kgyqX4p7Xz-89ygGhBkne4gvc0s0-8Sj1618La1s4Y-KMEC2-KwdlovRvMF9V-yZQ5PbWzBwzVZkrPhWfYiwT_jXm-EZpHSyAi-HzXb1emgO3wl1qpkEF75qNw" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#1A1A1A] mb-0.5">MelodyMaker</span>
                    <p className="text-[12px] leading-snug text-[#666666]">Used a different email and it worked perfectly. Playlist migration tools exist if you need them!</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-[#EBEBEB] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[#1db954] font-bold text-sm">
                      <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>arrow_upward</span> 856
                    </div>
                    <div className="flex items-center gap-1 text-[#666666] font-bold text-sm hover:text-[#1A1A1A] transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">chat_bubble</span> 92
                    </div>
                  </div>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center text-[#666666] hover:bg-gray-50 hover:text-[#1A1A1A] transition-colors">
                    <span className="material-symbols-outlined text-[20px]">bookmark</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 5: Nike Air Max */}
            <div className="masonry-item relative group rounded-3xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-all duration-300 border border-[#EBEBEB]">
              <div className="relative w-full aspect-[3/4]">
                <img alt="Nike Sneakers" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrVhiuaqKmVRLRrFcmiNyBJfPAZq0E3YggMFtb8Pkb2ZbqW-53NaOnbVcDWyYQ5ByVOMAN6N8Vj1zlyHBia1tHjomX2XJE5L7ufrEJ0shYJN8ulfFbgn6eZvYBsNiVO83jGsr2_4fHcuQxR7BxZw8rULSkeTr0CyPiObv5ZvBv5rERBcjgdxIoeE9XdQv7DD62v0fQQJvPyUw9whxojNPOP67OYN7untf74VjsZUKq_GLDXgDUAq6s_IYtqkipb33pmYWJ8m-Mfp0" />
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-[#FF3D00] text-white text-xs font-bold shadow-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">local_fire_department</span> Hot
                </div>
                <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-xl text-[#1A1A1A] px-3 py-2 rounded-xl shadow-lg border border-white/50 flex flex-col items-start leading-none">
                  <span className="text-xs text-[#666666] line-through mb-0.5">$130</span>
                  <span className="text-lg font-bold text-[#FF3D00]">$89.99</span>
                </div>
              </div>
              <div className="p-4 pt-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Nike</span>
                </div>
                <h3 className="font-bold text-base leading-snug text-[#1A1A1A] mb-3 line-clamp-2">Nike Air Max 90 - University Red</h3>
                <div className="bg-gray-50 rounded-xl p-2.5 mb-3 border border-gray-100 flex gap-2.5 items-start">
                  <img alt="User" className="w-6 h-6 rounded-full border border-white shadow-sm flex-shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1nGE4DabXMcO-5JUOpjROjBygdimvjZjpvbDl1W2Tecj_J4MVUU3w_MbbpZXG6nDzhMQ813cYaF1dydOmfjWONvW0TxOoR8rewS2Xj_9m3g_YXdIIyetHYU__9Ougmzm4Hw96D3SVBpY-bYpdXzDZQTlYEAgMWMpKooZwecUHG2x2G5dlcli8GGNXb_ANkN6tdOijzPqsfryjsF0W1i7SpobOUrlLKpVnr5jJPLjuP2DCzPaCKi9AqdJrwbnPS-kf9vO9oHF-9vk" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#1A1A1A] mb-0.5">AirMaxLover</span>
                    <p className="text-[11px] leading-snug text-[#666666] line-clamp-2">Size up 0.5 if you have wide feet. The red pops way more in person.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#EBEBEB]/60">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[#FF4500] font-bold text-xs">
                      <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>arrow_upward</span> 12k
                    </div>
                    <div className="flex items-center gap-1 text-[#666666] font-bold text-xs hover:text-[#1A1A1A] transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[16px]">chat_bubble</span> 504
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#666666] hover:bg-gray-50 hover:text-[#1A1A1A] transition-colors">
                    <span className="material-symbols-outlined text-[20px]">bookmark</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 6: Uber Eats */}
            <div className="masonry-item rounded-3xl overflow-hidden bg-black shadow-card text-white flex flex-col justify-between min-h-[400px] relative border border-gray-800">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="absolute top-[-20%] right-[-20%] w-60 h-60 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="p-6 relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Uber Eats</span>
                    <span className="text-xs font-mono bg-white text-black px-2 py-1 rounded font-bold">EATS20</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-green-400 mb-0.5">
                      <span className="material-symbols-outlined text-[11px]">schedule</span> Expires
                    </span>
                    <div className="text-xl font-black text-white leading-none tracking-tight">4h 12m</div>
                  </div>
                </div>
                <div className="flex-grow text-center py-4">
                  <div className="text-8xl font-black leading-none tracking-tighter text-white drop-shadow-xl">$20</div>
                  <div className="text-xl font-bold tracking-[0.3em] mt-2 text-white/80">OFF FIRST</div>
                  <div className="text-sm font-medium text-white/40 mt-1 uppercase tracking-widest">Order Only</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10 flex gap-3 items-start backdrop-blur-sm mt-4">
                  <img alt="User" className="w-8 h-8 rounded-full border border-white/20 shadow-sm flex-shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBD0IPnzq3Lg7y_HCQ384BKEiVxRck7H-4C98uWN-GYXxvjZ6yTQt1UiNkBd7s0Qc0gV1NbcK4lyNmCz2siPo_4O8V1IlBRBz7mxneuqTSQ4cjCinfor9HsHfrDYIOrLSzxyNbBuhCwU6SQO3iTiG7uYSAo6oY7-wMZlSypL_zNeJ0ZHdudFrldoey297dBsMFMvwoyufWn1o6r5aHEe5H6try3cC_lfPS-lFNdbbFl3RqW-cTx3ImK5pfXV0yLkVpPt1IRZq88m9g" />
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-white mb-0.5">LateNightSnack</span>
                    <p className="text-[12px] leading-snug text-white/70">Works for existing accounts if you haven't ordered in 30 days! Tested in NYC.</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-green-400 font-bold text-sm">
                      <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span> 440
                    </div>
                    <div className="flex items-center gap-1.5 text-white/60 font-bold text-sm hover:text-white transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">chat_bubble</span> 28
                    </div>
                  </div>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[20px]">bookmark</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Cards - Desktop Grid */}
            {/* Card 7: Amazon Fresh */}
            <div className="masonry-item relative group rounded-3xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-all duration-300 border border-[#EBEBEB]">
              <div className="relative w-full aspect-[3/4]">
                <img alt="Amazon Fresh" className="absolute inset-0 w-full h-full object-cover" src="https://images.unsplash.com/photo-1585521537190-6ba16e08b0b7?w=400&h=500&fit=crop" />
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[#1A1A1A] text-xs font-bold shadow-sm border border-white/50">-25%</div>
                <div className="absolute bottom-4 left-4 z-20 bg-black/80 backdrop-blur-md text-white px-3 py-2 rounded-xl border border-white/10 flex flex-col items-start leading-none">
                  <span className="text-xs opacity-70 line-through mb-0.5">$45</span>
                  <span className="text-lg font-bold">$34</span>
                </div>
              </div>
              <div className="p-4 pt-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Amazon Fresh</span>
                </div>
                <h3 className="font-bold text-base leading-snug text-[#1A1A1A] mb-3 line-clamp-2">Organic Grocery Bundle</h3>
                <div className="flex items-center justify-between pt-2 border-t border-[#EBEBEB]/60">
                  <div className="flex items-center gap-1 text-[#FF4500] font-bold text-xs">
                    <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>arrow_upward</span> 3.2k
                  </div>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#666666] hover:bg-gray-50 hover:text-[#1A1A1A] transition-colors">
                    <span className="material-symbols-outlined text-[20px]">bookmark</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 8: Best Buy Tech */}
            <div className="masonry-item relative group rounded-3xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-all duration-300 border border-[#EBEBEB]">
              <div className="relative w-full aspect-[3/4]">
                <img alt="Best Buy Tech" className="absolute inset-0 w-full h-full object-cover" src="https://images.unsplash.com/photo-1505880969541-ca48aebad63c?w=400&h=500&fit=crop" />
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[#1A1A1A] text-xs font-bold shadow-sm border border-white/50">-40%</div>
                <div className="absolute bottom-4 left-4 z-20 bg-black/80 backdrop-blur-md text-white px-3 py-2 rounded-xl border border-white/10 flex flex-col items-start leading-none">
                  <span className="text-xs opacity-70 line-through mb-0.5">$199</span>
                  <span className="text-lg font-bold">$119</span>
                </div>
              </div>
              <div className="p-4 pt-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Best Buy</span>
                </div>
                <h3 className="font-bold text-base leading-snug text-[#1A1A1A] mb-3 line-clamp-2">Wireless Headphones</h3>
                <div className="flex items-center justify-between pt-2 border-t border-[#EBEBEB]/60">
                  <div className="flex items-center gap-1 text-[#FF4500] font-bold text-xs">
                    <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>arrow_upward</span> 5.8k
                  </div>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#666666] hover:bg-gray-50 hover:text-[#1A1A1A] transition-colors">
                    <span className="material-symbols-outlined text-[20px]">bookmark</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 9: Gap Fashion */}
            <div className="masonry-item rounded-3xl overflow-hidden bg-gradient-to-br from-pink-500 to-rose-600 shadow-card text-white flex flex-col justify-between min-h-[380px] relative border border-gray-800">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-400 rounded-full blur-[60px] opacity-40 pointer-events-none"></div>
              <div className="p-6 relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-mono border border-white/20 px-2 py-1 rounded text-white/70 uppercase">CODE: GAP50</span>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold uppercase tracking-widest text-pink-200 mb-0.5">Flash Sale</span>
                    <div className="text-lg font-black text-white leading-none">2h left</div>
                  </div>
                </div>
                <div className="flex-grow flex flex-col justify-center mb-6">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-2">Gap & Old Navy</h2>
                  <div className="text-5xl font-black tracking-tighter leading-[0.85] text-white break-words">EXTRA<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-200 to-rose-200">50%</span><br/>OFF</div>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-pink-200 font-bold text-sm">
                    <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span> 1.9k
                  </div>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[20px]">bookmark</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 10: Target Home */}
            <div className="masonry-item relative group rounded-3xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-all duration-300 border border-[#EBEBEB]">
              <div className="relative w-full aspect-[3/4]">
                <img alt="Target Home" className="absolute inset-0 w-full h-full object-cover" src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=500&fit=crop" />
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-[#FF3D00] text-white text-xs font-bold shadow-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">local_fire_department</span> Trending
                </div>
                <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-xl text-[#1A1A1A] px-3 py-2 rounded-xl shadow-lg border border-white/50 flex flex-col items-start leading-none">
                  <span className="text-xs text-[#666666] line-through mb-0.5">$79</span>
                  <span className="text-lg font-bold text-[#FF3D00]">$49</span>
                </div>
              </div>
              <div className="p-4 pt-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Target</span>
                </div>
                <h3 className="font-bold text-base leading-snug text-[#1A1A1A] mb-3 line-clamp-2">Room Decor Collection</h3>
                <div className="flex items-center justify-between pt-2 border-t border-[#EBEBEB]/60">
                  <div className="flex items-center gap-1 text-[#FF4500] font-bold text-xs">
                    <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>arrow_upward</span> 6.4k
                  </div>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#666666] hover:bg-gray-50 hover:text-[#1A1A1A] transition-colors">
                    <span className="material-symbols-outlined text-[20px]">bookmark</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 11: Sephora Beauty */}
            <div className="masonry-item rounded-3xl overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-700 shadow-card text-white flex flex-col justify-between min-h-[360px] relative border border-gray-800">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
              <div className="p-6 relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-200 bg-purple-800/50 px-2 py-1 rounded">Beauty</span>
                  <div className="text-sm font-black text-white">VIP+</div>
                </div>
                <div className="flex-grow mb-4">
                  <h2 className="text-4xl font-black tracking-tighter leading-[0.9] text-white mb-2">Beauty<br/>Sale</h2>
                  <p className="text-sm text-white/80">Up to 50% off select brands</p>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold text-sm">
                    <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span> 2.3k
                  </div>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[20px]">bookmark</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 12: Whole Foods */}
            <div className="masonry-item relative group rounded-3xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-all duration-300 border border-[#EBEBEB]">
              <div className="relative w-full aspect-[3/4]">
                <img alt="Whole Foods" className="absolute inset-0 w-full h-full object-cover" src="https://images.unsplash.com/photo-1488459716781-8f52f7e3e3f1?w=400&h=500&fit=crop" />
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-green-500 text-white text-xs font-bold shadow-sm">Prime Day</div>
                <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-xl text-[#1A1A1A] px-3 py-2 rounded-xl shadow-lg border border-white/50 flex flex-col items-start leading-none">
                  <span className="text-xs text-[#666666] line-through mb-0.5">$35</span>
                  <span className="text-lg font-bold">$21</span>
                </div>
              </div>
              <div className="p-4 pt-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Whole Foods</span>
                </div>
                <h3 className="font-bold text-base leading-snug text-[#1A1A1A] mb-3 line-clamp-2">Organic Health Bundle</h3>
                <div className="flex items-center justify-between pt-2 border-t border-[#EBEBEB]/60">
                  <div className="flex items-center gap-1 text-[#FF4500] font-bold text-xs">
                    <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>arrow_upward</span> 4.1k
                  </div>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#666666] hover:bg-gray-50 hover:text-[#1A1A1A] transition-colors">
                    <span className="material-symbols-outlined text-[20px]">bookmark</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 z-50">
          <div className="flex justify-between items-center px-1 relative">
            <a className="flex flex-col items-center justify-center p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all w-16" href="#">
              <span className="material-symbols-outlined text-[24px]">home</span>
              <span className="text-[10px] font-medium mt-1">Feed</span>
            </a>
            <a className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/20 text-white w-16 shadow-inner" href="#">
              <span className="material-symbols-outlined text-[24px]">trending_up</span>
              <span className="text-[10px] font-bold mt-1">Trends</span>
            </a>
            <div className="relative -top-6">
              <button className="w-14 h-14 bg-[#FF4500] rounded-full flex items-center justify-center shadow-lg border-4 border-[#1A1A1A] text-white">
                <span className="material-symbols-outlined text-[28px]">add</span>
              </button>
            </div>
            <a className="flex flex-col items-center justify-center p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all w-16 relative" href="#">
              <div className="absolute top-2 right-4 w-1.5 h-1.5 bg-[#FF3D00] rounded-full"></div>
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              <span className="text-[10px] font-medium mt-1">Alerts</span>
            </a>
            <a className="flex flex-col items-center justify-center p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all w-16" href="#">
              <span className="material-symbols-outlined text-[24px]">person</span>
              <span className="text-[10px] font-medium mt-1">Me</span>
            </a>
          </div>
        </nav>
      </div>

      {/* MOBILE */}
      <div className="md:hidden bg-white text-black font-display min-h-screen antialiased">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200/40 backdrop-blur-md">
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

            .mobile-nav-brand {
              font-family: 'Outfit', sans-serif;
              font-weight: 800;
              letter-spacing: -0.02em;
            }

            .mobile-nav-accent {
              background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }

            .mobile-tab {
              font-family: 'Outfit', sans-serif;
              font-weight: 600;
              transition: all 0.2s ease;
              position: relative;
            }

            .mobile-tab.active {
              color: #0EA5E9;
              background: linear-gradient(135deg, #f0f9ff 0%, #ecf8ff 100%);
            }

            .mobile-tab:active {
              transform: scale(0.95);
            }

            .mobile-search {
              font-family: 'Inter', sans-serif;
              transition: all 0.3s ease;
            }
          `}</style>

          <div className="px-4 py-3.5">
            {/* Top section: Brand + Actions */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="mobile-nav-brand text-xl leading-none">
                  <span className="text-black">legit.</span>
                  <span className="mobile-nav-accent">discount</span>
                </div>
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <AuthButton />
                <button className="p-2.5 rounded-lg hover:bg-gray-100 transition-all active:scale-90 relative">
                  <span className="material-symbols-outlined text-[20px] text-gray-700">notifications</span>
                  <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative group mb-3">
              <input
                type="text"
                placeholder="Search deals, stores..."
                className="mobile-search w-full px-4 py-2.5 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </button>
            </div>

            {/* Tabs section */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3 pb-0.5">
              {[
                { label: 'Daily Hits', id: 'daily' },
                { label: 'Weekly Legends', id: 'weekly' },
                { label: 'All-Time Best', id: 'alltime' }
              ].map((tab, i) => (
                <button
                  key={tab.id}
                  className={`mobile-tab flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    i === 0
                      ? 'active bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort section */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-gray-200/50 pt-2.5">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0">Sort:</span>
              {[
                { icon: 'local_fire_department', label: 'Hot', accent: true },
                { icon: 'trending_up', label: 'Rising' },
                { icon: 'new_releases', label: 'New' },
                { icon: 'chat', label: 'Discussed' }
              ].map((item, i) => (
                <button
                  key={i}
                  className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-90 ${
                    item.accent
                      ? 'bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 border border-blue-200/50'
                      : 'bg-white text-gray-700 border border-gray-200/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="px-3 py-3 pb-24">
          <div className="masonry-grid">
            {/* Mobile Card 1: Seiko Watch */}
            <div className="masonry-item relative group rounded-2xl overflow-hidden bg-white shadow-card">
              <div className="relative w-full aspect-[3/4]">
                <img alt="Seiko Watch" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0M6y_NX6jGlMjvXEm7w7l2tq0mKxvJGuh4j0yxEw91TqbxYYxGpmZDTWebRASaYfh9bzMuwEvD_TnX6qymYF0iMs8RGpY6M3Fzi6DMr9auKo_xxiS3cS-pmSmOBbix-1dgdCxjv9GoVFfCqeI9uJgJXJkL95BjLQMNriA65qMlsxoQAh7-vXjhgdmUWgMXTl83h66jQCLnRfkdF7dlgOlEUbWUP7d2smtKieBXn9rPcmm_fUtiqVEd2HpcVluK04xrjHyHx4cZrs" />
                <button className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg active:scale-90">
                  <span className="material-symbols-outlined text-[18px]">ios_share</span>
                </button>
                <div className="absolute top-3 left-3 z-20 px-2 py-1 rounded-lg bg-[#FF3D00] text-white text-xs font-bold shadow-sm">-33% OFF</div>
                <div className="absolute bottom-0 inset-x-0 pt-16 pb-3 px-3 card-overlay text-white z-10 flex flex-col justify-end h-full">
                  <div className="flex items-center gap-1 mb-1 opacity-90">
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">Amazon</span>
                    <span className="text-[10px] font-medium text-green-300 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[10px]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span> Verified
                    </span>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2">Seiko 5 Sports Automatic</h3>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-xl font-extrabold text-white">$185</span>
                    <span className="text-sm text-white/60 line-through mb-1">$275</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex gap-3 text-xs font-medium text-white/90">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">visibility</span> 1.2k
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">chat_bubble</span> 24
                      </span>
                    </div>
                    <button className="text-white hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">bookmark</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Card 2: Nike Promo */}
            <div className="masonry-item rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-700 shadow-card text-white p-5 flex flex-col justify-between min-h-[220px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono opacity-60 uppercase tracking-widest border border-white/20 px-2 py-1 rounded-full">Code: NIKE25</span>
                <button className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-purple-600 transition-all">
                  <span className="material-symbols-outlined text-[16px]">ios_share</span>
                </button>
              </div>
              <div className="my-4 text-center">
                <div className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Nike Store</div>
                <div className="text-4xl font-black leading-none tracking-tighter mb-2">EXTRA<br/>25%<br/>OFF</div>
                <div className="text-sm font-medium opacity-90">Clearance Items</div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex gap-3 text-xs font-medium text-white/80">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">trending_up</span> 2.1k</span>
                </div>
                <button style={{backgroundColor: '#a78bfa', color: '#fff'}} className="text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">Copy</button>
              </div>
            </div>

            {/* Mobile Card 3: Espresso Machine */}
            <div className="masonry-item relative group rounded-2xl overflow-hidden bg-white shadow-card">
              <div className="relative w-full aspect-[3/5]">
                <img alt="Espresso Machine" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCV16gCseuB648qlcRc4CHJX4IxCPsxHtUsUUaYUw-ISHdB5OzL0jw3JFkqJ1O4hUQGx0KUdJsHRw4njcmOJptpJBirt3kF0bCOLrAdfoxXjiB46-uXLwTg-3SUbdVRYNIyzIQChi5UNplCciGQ146s_SS3AvtHOJ1khEQgZVp2-rvsdSOLn9xTv4DVKrtU5M0zKBK0nUpY2em7pZzzkg4jY96KfTcnGI8-7Yw54kCKuX3Ma37EDalUv1bCsMk1weE6w7niYhpuMMs" />
                <button className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg active:scale-90">
                  <span className="material-symbols-outlined text-[18px]">ios_share</span>
                </button>
                <div className="absolute top-3 left-3 z-20 px-2 py-1 rounded-lg bg-green-500 text-white text-xs font-bold shadow-sm">$150 DROP</div>
                <div className="absolute bottom-0 inset-x-0 pt-16 pb-3 px-3 card-overlay text-white z-10 flex flex-col justify-end h-full">
                  <div className="flex items-center gap-1 mb-1 opacity-90">
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">Best Buy</span>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2">Breville Barista Express</h3>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-xl font-extrabold text-white">$599</span>
                    <span className="text-sm text-white/60 line-through mb-1">$750</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex gap-3 text-xs font-medium text-white/90">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">visibility</span> 8.5k</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">chat_bubble</span> 112</span>
                    </div>
                    <button className="text-white hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">bookmark</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Card 4: Spotify */}
            <div className="masonry-item rounded-2xl overflow-hidden bg-gradient-to-br from-green-400 to-teal-500 shadow-card text-white p-5 flex flex-col justify-between min-h-[200px]">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-white/80 text-[20px]">music_note</span>
                <button className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-teal-600 transition-all">
                  <span className="material-symbols-outlined text-[16px]">ios_share</span>
                </button>
              </div>
              <div className="my-3">
                <div className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Spotify Premium</div>
                <div className="text-3xl font-black leading-tight tracking-tight mb-2">3 Months<br/>Free Trial</div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex gap-3 text-xs font-medium text-white/80">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">save</span> 856</span>
                </div>
                <button style={{backgroundColor: '#14b8a6', color: '#fff'}} className="text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">Get</button>
              </div>
            </div>

            {/* Mobile Card 5: Nike Air Max */}
            <div className="masonry-item relative group rounded-2xl overflow-hidden bg-white shadow-card">
              <div className="relative w-full aspect-[3/4]">
                <img alt="Nike Sneakers" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrVhiuaqKmVRLRrFcmiNyBJfPAZq0E3YggMFtb8Pkb2ZbqW-53NaOnbVcDWyYQ5ByVOMAN6N8Vj1zlyHBia1tHjomX2XJE5L7ufrEJ0shYJN8ulfFbgn6eZvYBsNiVO83jGsr2_4fHcuQxR7BxZw8rULSkeTr0CyPiObv5ZvBv5rERBcjgdxIoeE9XdQv7DD62v0fQQJvPyUw9whxojNPOP67OYN7untf74VjsZUKq_GLDXgDUAq6s_IYtqkipb33pmYWJ8m-Mfp0" />
                <button className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg active:scale-90">
                  <span className="material-symbols-outlined text-[18px]">ios_share</span>
                </button>
                <div className="absolute top-3 left-3 z-20 px-2 py-1 rounded-lg bg-orange-500 text-white text-xs font-bold shadow-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">local_fire_department</span> Hot
                </div>
                <div className="absolute bottom-0 inset-x-0 pt-16 pb-3 px-3 card-overlay text-white z-10 flex flex-col justify-end h-full">
                  <div className="flex items-center gap-1 mb-1 opacity-90">
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">Nike</span>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2">Nike Air Max 90 - Red</h3>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-xl font-extrabold text-white">$89.99</span>
                    <span className="text-sm text-white/60 line-through mb-1">$130</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex gap-3 text-xs font-medium text-white/90">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">visibility</span> 12k</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">chat_bubble</span> 156</span>
                    </div>
                    <button className="text-white hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">bookmark</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Card 6: Uber Eats */}
            <div className="masonry-item rounded-2xl overflow-hidden bg-black shadow-card text-white p-5 flex flex-col justify-between min-h-[180px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono opacity-60 uppercase tracking-widest border border-white/20 px-2 py-1 rounded-full">Code: EATS20</span>
                <button className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
                  <span className="material-symbols-outlined text-[16px]">ios_share</span>
                </button>
              </div>
              <div className="my-4 text-center">
                <div className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Uber Eats</div>
                <div className="text-5xl font-black leading-none tracking-tighter">$20</div>
                <div className="text-xl font-bold tracking-tight">OFF FIRST ORDER</div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex gap-3 text-xs font-medium text-white/80">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> 3h left</span>
                </div>
                <button style={{backgroundColor: '#fff', color: '#000'}} className="text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">Copy</button>
              </div>
            </div>

            {/* Mobile Card 7: Amazon Fresh */}
            <div className="masonry-item relative group rounded-2xl overflow-hidden bg-white shadow-card">
              <div className="relative w-full aspect-[3/4]">
                <img alt="Amazon Fresh" className="absolute inset-0 w-full h-full object-cover" src="https://images.unsplash.com/photo-1585521537190-6ba16e08b0b7?w=400&h=500&fit=crop" />
                <button className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg active:scale-90">
                  <span className="material-symbols-outlined text-[18px]">ios_share</span>
                </button>
                <div className="absolute top-3 left-3 z-20 px-2 py-1 rounded-lg bg-green-500 text-white text-xs font-bold shadow-sm">-25% OFF</div>
                <div className="absolute bottom-0 inset-x-0 pt-16 pb-3 px-3 card-overlay text-white z-10 flex flex-col justify-end h-full">
                  <div className="flex items-center gap-1 mb-1 opacity-90">
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">Amazon Fresh</span>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2">Organic Grocery Bundle</h3>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-xl font-extrabold text-white">$34</span>
                    <span className="text-sm text-white/60 line-through mb-1">$45</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex gap-3 text-xs font-medium text-white/90">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">visibility</span> 3.2k</span>
                    </div>
                    <button className="text-white hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">bookmark</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Card 8: Best Buy Tech */}
            <div className="masonry-item relative group rounded-2xl overflow-hidden bg-white shadow-card">
              <div className="relative w-full aspect-[3/4]">
                <img alt="Best Buy Tech" className="absolute inset-0 w-full h-full object-cover" src="https://images.unsplash.com/photo-1505880969541-ca48aebad63c?w=400&h=500&fit=crop" />
                <button className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg active:scale-90">
                  <span className="material-symbols-outlined text-[18px]">ios_share</span>
                </button>
                <div className="absolute top-3 left-3 z-20 px-2 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm">-40% OFF</div>
                <div className="absolute bottom-0 inset-x-0 pt-16 pb-3 px-3 card-overlay text-white z-10 flex flex-col justify-end h-full">
                  <div className="flex items-center gap-1 mb-1 opacity-90">
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">Best Buy</span>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2">Wireless Headphones</h3>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-xl font-extrabold text-white">$119</span>
                    <span className="text-sm text-white/60 line-through mb-1">$199</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex gap-3 text-xs font-medium text-white/90">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">visibility</span> 5.8k</span>
                    </div>
                    <button className="text-white hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">bookmark</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Card 9: Gap Fashion */}
            <div className="masonry-item rounded-2xl overflow-hidden bg-gradient-to-br from-pink-500 to-rose-600 shadow-card text-white p-5 flex flex-col justify-between min-h-[220px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono opacity-60 uppercase tracking-widest border border-white/20 px-2 py-1 rounded-full">Code: GAP50</span>
                <button className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-pink-600 transition-all">
                  <span className="material-symbols-outlined text-[16px]">ios_share</span>
                </button>
              </div>
              <div className="my-3">
                <div className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Gap & Old Navy</div>
                <div className="text-3xl font-black leading-tight tracking-tight mb-1">EXTRA<br/>50%<br/>OFF</div>
                <div className="text-sm font-medium opacity-90">Flash Sale - 2h left</div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex gap-3 text-xs font-medium text-white/80">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> 2h left</span>
                </div>
                <button style={{backgroundColor: '#a78bfa', color: '#fff'}} className="text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">Shop</button>
              </div>
            </div>

            {/* Mobile Card 10: Target Home */}
            <div className="masonry-item relative group rounded-2xl overflow-hidden bg-white shadow-card">
              <div className="relative w-full aspect-[3/4]">
                <img alt="Target Home" className="absolute inset-0 w-full h-full object-cover" src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=500&fit=crop" />
                <button className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg active:scale-90">
                  <span className="material-symbols-outlined text-[18px]">ios_share</span>
                </button>
                <div className="absolute top-3 left-3 z-20 px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-bold shadow-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">local_fire_department</span> Trending
                </div>
                <div className="absolute bottom-0 inset-x-0 pt-16 pb-3 px-3 card-overlay text-white z-10 flex flex-col justify-end h-full">
                  <div className="flex items-center gap-1 mb-1 opacity-90">
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">Target</span>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2">Room Decor Collection</h3>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-xl font-extrabold text-white">$49</span>
                    <span className="text-sm text-white/60 line-through mb-1">$79</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex gap-3 text-xs font-medium text-white/90">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">visibility</span> 6.4k</span>
                    </div>
                    <button className="text-white hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">bookmark</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Card 11: Sephora Beauty */}
            <div className="masonry-item rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-700 shadow-card text-white p-5 flex flex-col justify-between min-h-[200px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono opacity-60 uppercase tracking-widest border border-white/20 px-2 py-1 rounded-full">VIP+</span>
                <button className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-purple-600 transition-all">
                  <span className="material-symbols-outlined text-[16px]">ios_share</span>
                </button>
              </div>
              <div className="my-3">
                <div className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Sephora Beauty</div>
                <div className="text-3xl font-black leading-tight tracking-tight mb-1">50%<br/>OFF</div>
                <div className="text-sm font-medium opacity-90">Select brands</div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex gap-3 text-xs font-medium text-white/80">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">save</span> 2.3k</span>
                </div>
                <button style={{backgroundColor: '#14b8a6', color: '#fff'}} className="text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">Browse</button>
              </div>
            </div>

            {/* Mobile Card 12: Whole Foods */}
            <div className="masonry-item relative group rounded-2xl overflow-hidden bg-white shadow-card">
              <div className="relative w-full aspect-[3/4]">
                <img alt="Whole Foods" className="absolute inset-0 w-full h-full object-cover" src="https://images.unsplash.com/photo-1488459716781-8f52f7e3e3f1?w=400&h=500&fit=crop" />
                <button className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg active:scale-90">
                  <span className="material-symbols-outlined text-[18px]">ios_share</span>
                </button>
                <div className="absolute top-3 left-3 z-20 px-2 py-1 rounded-lg bg-green-600 text-white text-xs font-bold shadow-sm">Prime Day</div>
                <div className="absolute bottom-0 inset-x-0 pt-16 pb-3 px-3 card-overlay text-white z-10 flex flex-col justify-end h-full">
                  <div className="flex items-center gap-1 mb-1 opacity-90">
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">Whole Foods</span>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2">Organic Health Bundle</h3>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-xl font-extrabold text-white">$21</span>
                    <span className="text-sm text-white/60 line-through mb-1">$35</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex gap-3 text-xs font-medium text-white/90">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">visibility</span> 4.1k</span>
                    </div>
                    <button className="text-white hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">bookmark</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <nav className="fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl border border-white/40 rounded-full p-1.5 z-50">
          <div className="flex justify-between items-center px-2">
            <a className="flex flex-col items-center justify-center p-3 rounded-full bg-black text-white w-12 h-12 shadow-md" href="#">
              <span className="material-symbols-outlined text-[24px]">home</span>
            </a>
            <a className="flex flex-col items-center justify-center p-3 rounded-full text-gray-400 hover:text-black hover:bg-gray-50 transition-all w-12 h-12" href="#">
              <span className="material-symbols-outlined text-[24px]">explore</span>
            </a>
            <a className="flex flex-col items-center justify-center p-3 rounded-full text-gray-400 hover:text-black hover:bg-gray-50 transition-all w-12 h-12" href="#">
              <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: "'FILL' 1"}}>add_circle</span>
            </a>
            <a className="flex flex-col items-center justify-center p-3 rounded-full text-gray-400 hover:text-black hover:bg-gray-50 transition-all w-12 h-12 relative" href="#">
              <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></div>
              <span className="material-symbols-outlined text-[24px]">bookmark</span>
            </a>
            <a className="flex flex-col items-center justify-center p-3 rounded-full text-gray-400 hover:text-black hover:bg-gray-50 transition-all w-12 h-12" href="#">
              <span className="material-symbols-outlined text-[24px]">person</span>
            </a>
          </div>
        </nav>
      </div>
    </>
  );
}
