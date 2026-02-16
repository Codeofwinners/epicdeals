"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import {
  getDealById,
  upvoteDeal,
  deleteComment,
  editComment,
} from "@/lib/firestore";
import type { Deal, Comment } from "@/types/deals";
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userDeals, setUserDeals] = useState<Deal[]>([]);
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Fetch user's upvoted deals and comments
  useEffect(() => {
    if (!user || !db) return;

    const fetchUserInteractions = async () => {
      setLoading(true);
      try {
        // Fetch upvoted deals
        const votesRef = collection(db, "votes", user.uid, "dealUpvotes");
        const votedDocsSnap = await getDocs(votesRef);
        const votedDealIds = votedDocsSnap.docs.map((d) => d.id);

        // Fetch full deal data for each voted deal
        const deals = await Promise.all(
          votedDealIds.map((dealId) => getDealById(dealId))
        );
        setUserDeals(deals.filter((d) => d !== null) as Deal[]);

        // Fetch user's comments with real-time listener
        const commentsRef = collection(db, "comments");
        const commentsQuery = query(commentsRef, where("user.id", "==", user.uid));

        const unsubscribe = onSnapshot(
          commentsQuery,
          (snap) => {
            const comments = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                dealId: data.dealId,
                content: data.content,
                user: data.user,
                createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt,
                upvotes: data.upvotes || 0,
              } as Comment;
            });
            setUserComments(comments);
          },
          (error) => {
            console.error("Error fetching comments:", error);
            setCommentsError("Failed to load comments");
          }
        );

        setLoading(false);
        return unsubscribe;
      } catch (error) {
        console.error("Error fetching user interactions:", error);
        setLoading(false);
      }
    };

    const cleanup = fetchUserInteractions();
    return () => {
      cleanup?.then((unsub) => unsub?.());
    };
  }, [user]);

  const handleRemoveVote = async (dealId: string) => {
    if (!user) return;
    try {
      await upvoteDeal(user.uid, dealId);
      setUserDeals((prev) => prev.filter((d) => d.id !== dealId));
    } catch (error) {
      console.error("Error removing vote:", error);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingCommentText.trim()) {
      setCommentsError("Comment cannot be empty");
      return;
    }
    if (editingCommentText.length > 1000) {
      setCommentsError("Comment must be under 1000 characters");
      return;
    }

    try {
      await editComment(commentId, editingCommentText);
      setEditingCommentId(null);
      setEditingCommentText("");
      setCommentsError(null);
    } catch (error) {
      console.error("Error editing comment:", error);
      setCommentsError("Failed to edit comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await deleteComment(commentId);
      setUserComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
      setCommentsError("Failed to delete comment");
    }
  };

  const filteredDeals = userDeals.filter((deal) => {
    const matchesSearch =
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.store.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStore = !filterStore || deal.store.id === filterStore;
    return matchesSearch && matchesStore;
  });

  const stores = Array.from(new Map(userDeals.map((d) => [d.store.id, d.store])).values());

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-display">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-slate-600 font-display">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 font-display">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .material-icons-round {
          font-family: 'Material Icons Round';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          user-select: none;
        }

        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          user-select: none;
        }

        .shadow-card {
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
        }

        .shadow-soft {
          box-shadow: 0 8px 30px -4px rgba(48, 110, 232, 0.06);
        }

        .shadow-glow {
          box-shadow: 0 0 15px rgba(48, 110, 232, 0.3);
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl">
        {/* Header */}
        <header className="sticky top-0 z-40 mb-6 lg:mb-8 bg-white/80 backdrop-blur-md rounded-2xl lg:rounded-3xl shadow-soft border border-slate-100 p-6 lg:p-8">
          <div className="flex justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-1">
                Pro Dashboard
              </h1>
              <p className="text-sm lg:text-base font-medium text-slate-400">
                Manage interactions & history
              </p>
            </div>
            {user.photoURL && (
              <div className="relative group cursor-pointer flex-shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="relative w-12 h-12 lg:w-14 lg:h-14 rounded-full border-2 lg:border-3 border-white object-cover shadow-sm"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 lg:w-3.5 lg:h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
            )}
          </div>
        </header>

        {/* Search & Filters */}
        <div className="sticky top-24 lg:top-28 z-30 bg-white/80 backdrop-blur-md rounded-2xl lg:rounded-3xl shadow-soft border border-slate-100 p-4 lg:p-6 mb-6 lg:mb-8">
          {/* Search Bar */}
          <div className="relative mb-4 lg:mb-5">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search my history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 lg:py-4 rounded-xl lg:rounded-2xl bg-slate-50 border border-slate-200 text-sm lg:text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-display"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            <button
              onClick={() => setFilterStore("")}
              className={`flex items-center gap-2 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                !filterStore
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-glow"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="material-icons-round text-sm">filter_list</span>
              All Status
            </button>
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => setFilterStore(store.id)}
                className={`flex items-center gap-2 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  filterStore === store.id
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-glow"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {store.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="space-y-8 lg:space-y-10">
          {/* Active Engagements Section */}
          <section>
            <div className="flex justify-between items-center mb-4 lg:mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl lg:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  Active Engagements
                </h2>
                <span className="inline-flex items-center justify-center text-xs lg:text-sm font-bold bg-slate-200 text-slate-600 px-3 py-1 lg:px-3.5 lg:py-1.5 rounded-full">
                  {filteredDeals.length}
                </span>
              </div>
            </div>

            {filteredDeals.length === 0 ? (
              <div className="bg-white rounded-2xl lg:rounded-3xl p-8 lg:p-12 shadow-card border border-slate-200 text-center">
                <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                  <span className="material-icons-round text-slate-400 text-2xl lg:text-3xl">thumb_up</span>
                </div>
                <p className="text-slate-500 font-medium">No upvoted deals yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {filteredDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="group bg-white rounded-2xl lg:rounded-3xl p-3 lg:p-4 shadow-card border border-slate-200 hover:border-blue-400 hover:shadow-soft transition-all duration-300"
                  >
                    <div className="flex flex-col h-full">
                      {deal.imageUrl && (
                        <div className="relative w-full h-32 lg:h-40 rounded-xl lg:rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 mb-3 lg:mb-4 flex-shrink-0">
                          <img
                            alt={deal.title}
                            className="w-full h-full object-cover"
                            src={deal.imageUrl}
                          />
                        </div>
                      )}

                      <div className="flex-grow">
                        <h3 className="font-bold text-slate-900 text-sm lg:text-base truncate mb-2 line-clamp-2">
                          {deal.title}
                        </h3>

                        <div className="flex items-center gap-2 mb-3 lg:mb-4">
                          {deal.savingsValue > 0 && (
                            <span className="text-xs line-through text-slate-400">
                              ${deal.savingsValue}
                            </span>
                          )}
                          <span className="text-blue-600 font-bold text-base lg:text-lg">
                            {deal.savingsAmount}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] lg:text-xs font-medium text-orange-600 bg-orange-50 px-2 lg:px-2.5 py-1 lg:py-1.5 rounded-lg w-fit mb-2">
                          <span className="material-icons-round text-sm">timer</span>
                          Exp: Active
                        </div>

                        <div className="text-[10px] lg:text-xs text-slate-500">
                          {deal.store.name} • Just now
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-slate-100">
                        <button
                          onClick={() => {
                            const text = `Check out this deal: ${deal.title} at ${deal.store.name}`;
                            if (navigator.share) {
                              navigator.share({ title: deal.title, text });
                            } else {
                              navigator.clipboard.writeText(
                                `${deal.title} - ${window.location.origin}/deals/${deal.slug}`
                              );
                              alert("Deal link copied!");
                            }
                          }}
                          className="flex-1 p-2 lg:p-2.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-all duration-200 flex items-center justify-center"
                          title="Share Deal"
                        >
                          <span className="material-icons-round text-lg lg:text-xl">share</span>
                        </button>
                        <button
                          onClick={() => handleRemoveVote(deal.id)}
                          className="flex-1 p-2 lg:p-2.5 rounded-lg hover:bg-red-50 text-green-600 hover:text-red-600 transition-all duration-200 flex items-center justify-center"
                          title="Remove Vote"
                        >
                          <span className="material-icons-round text-lg lg:text-xl">thumb_up</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Comments Section */}
          <section className="pt-6 lg:pt-8 border-t border-slate-200">
            <div className="flex justify-between items-baseline mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900">Recent Comments</h2>
              {userComments.length > 0 && (
                <button className="text-xs lg:text-sm font-bold text-slate-500 border border-slate-200 px-3 lg:px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                  Select Multiple
                </button>
              )}
            </div>

            {commentsError && (
              <div className="bg-red-50 border border-red-200 rounded-xl lg:rounded-2xl p-3 lg:p-4 mb-4 lg:mb-6">
                <p className="text-sm text-red-600 font-medium">{commentsError}</p>
              </div>
            )}

            {userComments.length === 0 ? (
              <div className="bg-white rounded-2xl lg:rounded-3xl p-8 lg:p-12 shadow-card border border-slate-200 text-center">
                <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                  <span className="material-icons-round text-slate-400 text-2xl lg:text-3xl">chat</span>
                </div>
                <p className="text-slate-500 font-medium">No comments yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {userComments.map((comment) => (
                  <div key={comment.id} className="bg-white rounded-2xl lg:rounded-3xl shadow-card border border-slate-100 hover:border-slate-200 transition-all duration-200">
                    {editingCommentId === comment.id ? (
                      <div className="p-4 lg:p-6">
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="w-full p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-slate-200 text-sm lg:text-base font-display min-h-[100px] lg:min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <div className="flex justify-end gap-2 lg:gap-3 mt-3 lg:mt-4">
                          <button
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingCommentText("");
                            }}
                            className="text-xs lg:text-sm font-bold text-slate-500 border border-slate-200 px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleEditComment(comment.id)}
                            className="text-xs lg:text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 px-4 lg:px-5 py-2 lg:py-2.5 rounded-lg hover:shadow-glow transition-all duration-200"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 lg:p-6">
                        <div className="flex items-start gap-3 mb-3 lg:mb-4">
                          <input type="checkbox" className="mt-1 rounded border-slate-300 text-blue-500 focus:ring-blue-500 cursor-pointer" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs lg:text-sm font-bold text-slate-900 truncate">
                              Re: Comment
                            </h4>
                          </div>
                          <span className="text-[10px] lg:text-xs text-slate-400 flex-shrink-0">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xs lg:text-sm text-slate-600 leading-relaxed ml-8 mb-3 lg:mb-4 border-l-2 border-slate-100 pl-3">
                          "{comment.content}"
                        </p>

                        <div className="flex justify-end gap-4 ml-8">
                          <button
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingCommentText(comment.content);
                            }}
                            className="text-xs lg:text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs lg:text-sm font-bold text-slate-400 hover:text-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
