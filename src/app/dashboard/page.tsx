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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading your dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-display pb-28">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="px-6 pt-12 pb-4 flex justify-between items-center sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Pro Dashboard</h1>
            <p className="text-sm font-medium text-slate-400 mt-0.5">Manage interactions & history</p>
          </div>
          {user.photoURL && (
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="relative w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
          )}
        </header>

        {/* Search & Filters */}
        <div className="px-6 space-y-4 mb-6 sticky top-20 z-10 bg-slate-50/95 backdrop-blur-md pb-4 border-b border-slate-200">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search my history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterStore("")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                !filterStore
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-xs">📋</span> All Status
            </button>
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => setFilterStore(store.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  filterStore === store.id
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {store.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="px-6 space-y-8">
          {/* Active Engagements Section */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Active Engagements
                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                  {filteredDeals.length}
                </span>
              </h2>
            </div>

            {filteredDeals.length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-card border border-slate-200 text-center text-slate-500">
                No upvoted deals yet
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="group bg-white rounded-xl p-3 shadow-card border border-slate-200 relative hover:border-blue-400 transition-all"
                  >
                    <div className="flex gap-3">
                      {deal.imageUrl && (
                        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                          <img
                            alt={deal.title}
                            className="w-full h-full object-cover"
                            src={deal.imageUrl}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-900 text-sm truncate pr-2">
                            {deal.title}
                          </h3>
                          <div className="flex items-center gap-1.5">
                            {deal.savingsValue > 0 && (
                              <span className="text-xs line-through text-slate-400">
                                ${deal.savingsValue}
                              </span>
                            )}
                            <span className="text-blue-500 font-bold text-sm">
                              {deal.savingsAmount}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-end mt-1">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-[10px] font-medium text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded w-fit">
                              <span>⏱️</span> Exp: Active
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {deal.store.name} • Now
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
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
                              className="p-1.5 rounded-full bg-slate-50 text-slate-400 hover:text-blue-500 transition-colors"
                              title="Share Deal"
                            >
                              <span className="text-sm">📤</span>
                            </button>
                            <button
                              onClick={() => handleRemoveVote(deal.id)}
                              className="p-1.5 rounded-full bg-slate-50 text-green-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                              title="Remove Vote"
                            >
                              <span className="text-sm">👍</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Comments Section */}
          <section>
            <div className="flex justify-between items-baseline mb-4 pt-4 border-t border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Recent Comments</h2>
            </div>

            {commentsError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-4 text-sm">
                {commentsError}
              </div>
            )}

            {userComments.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
                No comments yet
              </div>
            ) : (
              <div className="space-y-3">
                {userComments.map((comment) => (
                  <div key={comment.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    {editingCommentId === comment.id ? (
                      <div>
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="w-full p-3 rounded-lg border border-slate-200 text-sm font-display min-h-[80px]"
                        />
                        <div className="flex justify-end gap-3 mt-3">
                          <button
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingCommentText("");
                            }}
                            className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-1 rounded hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleEditComment(comment.id)}
                            className="text-[10px] font-bold text-blue-500 px-2 py-1 rounded hover:bg-blue-50"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              Re: Comment
                            </h4>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed ml-0 mb-2">
                          "{comment.content}"
                        </p>
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingCommentText(comment.content);
                            }}
                            className="text-[10px] font-bold text-slate-400 hover:text-blue-500 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors"
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
        </main>
      </div>
    </div>
  );
}
