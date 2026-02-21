"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getDealById,
  upvoteDeal,
  deleteComment,
  editComment,
  getSavedDeals,
  unsaveDeal,
} from "@/lib/firestore";
import type { Deal, Comment } from "@/types/deals";
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUserXP } from "@/hooks/useGamification";
import { RankBadge } from "@/components/leaderboard/RankBadge";
import { XPProgressBar } from "@/components/leaderboard/XPProgressBar";

type Tab = "upvotes" | "comments" | "saved";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data: xpData } = useUserXP(user?.uid);

  const [activeTab, setActiveTab] = useState<Tab>("upvotes");
  const [userDeals, setUserDeals] = useState<Deal[]>([]);
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [savedDeals, setSavedDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [commentsError, setCommentsError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Fetch user data
  useEffect(() => {
    if (!user || !db) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch upvoted deals
        const votesRef = collection(db, "votes", user.uid, "dealUpvotes");
        const votedDocsSnap = await getDocs(votesRef);
        const votedDealIds = votedDocsSnap.docs.map((d) => d.id);
        const deals = await Promise.all(
          votedDealIds.map((dealId) => getDealById(dealId))
        );
        setUserDeals(deals.filter((d) => d !== null) as Deal[]);

        // Fetch saved deals
        const saved = await getSavedDeals(user.uid);
        setSavedDeals(saved);

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
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    const cleanup = fetchData();
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

  const handleUnsave = async (dealId: string) => {
    if (!user) return;
    try {
      await unsaveDeal(user.uid, dealId);
      setSavedDeals((prev) => prev.filter((d) => d.id !== dealId));
    } catch (error) {
      console.error("Error unsaving deal:", error);
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

  const formatTimeAgo = (dateStr: string) => {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF7F2" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: "4px solid #e5e7eb", borderTopColor: "#0891b2", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b", fontFamily: "Manrope, sans-serif", fontSize: 15 }}>Loading your dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF7F2" }}>
        <p style={{ color: "#64748b", fontFamily: "Manrope, sans-serif" }}>Redirecting...</p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: string; count: number }[] = [
    { key: "upvotes", label: "Upvotes", icon: "thumb_up", count: userDeals.length },
    { key: "comments", label: "Comments", icon: "chat_bubble", count: userComments.length },
    { key: "saved", label: "Saved", icon: "bookmark", count: savedDeals.length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2", fontFamily: "Manrope, sans-serif" }}>
      {/* Header */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px 0" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <Link
            href="/"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 14, fontWeight: 600, textDecoration: "none" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            Home
          </Link>
        </div>

        {/* User info */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                referrerPolicy="no-referrer"
                style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "3px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
              />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #06b6d4, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#fff" }}>person</span>
              </div>
            )}
            <div style={{ position: "absolute", bottom: 1, right: 1, width: 14, height: 14, background: "#22c55e", borderRadius: "50%", border: "2.5px solid #fff" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
              {user.displayName || "Your Dashboard"}
            </h1>
            <p style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500, margin: "2px 0 0" }}>
              Your Activity
            </p>
          </div>
        </div>

        {/* XP & Rank Section */}
        {xpData && (
          <div style={{
            background: "#111",
            borderRadius: 16,
            padding: "20px 20px 16px",
            marginBottom: 20,
            position: "relative",
            overflow: "hidden",
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255,255,255,0.02) 18px, rgba(255,255,255,0.02) 19px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: xpData.rank.color, letterSpacing: "-0.02em" }}>
                  {xpData.xp.toLocaleString()}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>XP</span>
                <RankBadge xp={xpData.xp} size="md" />
              </div>
              <Link
                href="/leaderboard"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0EA5E9",
                  textDecoration: "none",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>leaderboard</span>
                View Leaderboard
              </Link>
            </div>
            <XPProgressBar xp={xpData.xp} height={6} />
          </div>
        )}

        {/* Tab navigation */}
        <div style={{ display: "flex", gap: 6, background: "#fff", borderRadius: 14, padding: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", marginBottom: 24 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "Manrope, sans-serif",
                  transition: "all 0.2s",
                  background: isActive ? "linear-gradient(135deg, #06b6d4, #0891b2)" : "transparent",
                  color: isActive ? "#fff" : "#64748b",
                  boxShadow: isActive ? "0 2px 8px rgba(8,145,178,0.25)" : "none",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
                {tab.label}
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  background: isActive ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                  color: isActive ? "#fff" : "#94a3b8",
                  padding: "2px 7px",
                  borderRadius: 20,
                  minWidth: 22,
                  textAlign: "center",
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ paddingBottom: 40 }}>
          {/* ─── Upvotes Tab ─── */}
          {activeTab === "upvotes" && (
            <div>
              {userDeals.length === 0 ? (
                <EmptyState icon="thumb_up" message="No upvoted deals yet" subtext="Deals you upvote will appear here" />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {userDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      actionIcon="close"
                      actionLabel="Remove"
                      onAction={() => handleRemoveVote(deal.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Comments Tab ─── */}
          {activeTab === "comments" && (
            <div>
              {commentsError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
                  <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 600, margin: 0 }}>{commentsError}</p>
                </div>
              )}
              {userComments.length === 0 ? (
                <EmptyState icon="chat_bubble" message="No comments yet" subtext="Your comments on deals will show up here" />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {userComments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{
                        background: "#fff",
                        borderRadius: 14,
                        border: "1px solid #f1f5f9",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                        overflow: "hidden",
                      }}
                    >
                      {editingCommentId === comment.id ? (
                        /* ── Edit mode ── */
                        <div style={{ padding: 16 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Edit your comment</label>
                          <textarea
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            style={{
                              width: "100%",
                              padding: 12,
                              borderRadius: 10,
                              border: "2px solid #e2e8f0",
                              fontSize: 14,
                              fontFamily: "Manrope, sans-serif",
                              minHeight: 100,
                              resize: "none",
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                            <button
                              onClick={() => { setEditingCommentId(null); setEditingCommentText(""); }}
                              style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#f1f5f9", color: "#475569", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Manrope, sans-serif" }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleEditComment(comment.id)}
                              style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #06b6d4, #0891b2)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Manrope, sans-serif" }}
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Display mode ── */
                        <div style={{ padding: 16 }}>
                          {/* Comment header */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#94a3b8" }}>chat_bubble</span>
                              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                                {formatTimeAgo(comment.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Comment text with left accent border */}
                          <div style={{
                            borderLeft: "3px solid #06b6d4",
                            paddingLeft: 12,
                            marginBottom: 14,
                            marginLeft: 2,
                          }}>
                            <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.6, margin: 0, wordBreak: "break-word" }}>
                              {comment.content}
                            </p>
                          </div>

                          {/* Actions */}
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.content); }}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                padding: "7px 14px", borderRadius: 8, border: "none",
                                background: "#f0f9ff", color: "#0891b2", fontSize: 12, fontWeight: 700,
                                cursor: "pointer", fontFamily: "Manrope, sans-serif",
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                padding: "7px 14px", borderRadius: 8, border: "none",
                                background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 700,
                                cursor: "pointer", fontFamily: "Manrope, sans-serif",
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Saved Tab ─── */}
          {activeTab === "saved" && (
            <div>
              {savedDeals.length === 0 ? (
                <EmptyState icon="bookmark" message="No saved deals yet" subtext="Bookmark deals you want to revisit later" />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {savedDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      actionIcon="close"
                      actionLabel="Remove"
                      onAction={() => handleUnsave(deal.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════ */

function EmptyState({ icon, message, subtext }: { icon: string; message: string; subtext: string }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      padding: "48px 24px",
      textAlign: "center",
      border: "1px solid #f1f5f9",
      boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
    }}>
      <div style={{
        width: 64, height: 64, margin: "0 auto 16px",
        background: "linear-gradient(135deg, #ecfeff, #e0f2fe)",
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#0891b2" }}>{icon}</span>
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#334155", margin: "0 0 4px" }}>{message}</p>
      <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{subtext}</p>
    </div>
  );
}

function DealCard({
  deal,
  actionIcon,
  actionLabel,
  onAction,
}: {
  deal: Deal;
  actionIcon: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const expiryLabel = deal.status === "expired"
    ? "Expired"
    : deal.expiresAt
      ? (() => {
          const diff = new Date(deal.expiresAt).getTime() - Date.now();
          if (diff <= 0) return "Expired";
          const hrs = Math.floor(diff / 3600000);
          if (hrs < 24) return `${hrs}h left`;
          return `${Math.floor(hrs / 24)}d left`;
        })()
      : "Active";

  const isExpired = expiryLabel === "Expired";

  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      padding: "14px 16px",
      border: "1px solid #f1f5f9",
      boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
      opacity: isExpired ? 0.6 : 1,
      display: "flex",
      gap: 12,
      alignItems: "center",
      transition: "all 0.2s ease",
    }}>
      {/* Thumbnail */}
      <div style={{
        width: 56, height: 56, flexShrink: 0,
        borderRadius: 12, overflow: "hidden",
        background: "#f8fafc",
      }}>
        {deal.imageUrl ? (
          <img src={deal.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#cbd5e1" }}>local_offer</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{
          fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          letterSpacing: "-0.01em",
        }}>
          {deal.title}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>
            {deal.store.name}
          </span>
          {deal.savingsAmount && (
            <>
              <span style={{ fontSize: 10, color: "#CBD5E1" }}>·</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#059669", letterSpacing: "-0.01em" }}>
                {deal.savingsAmount}
              </span>
            </>
          )}
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>·</span>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: isExpired ? "#94a3b8" : "#f59e0b",
          }}>
            {expiryLabel}
          </span>
        </div>
      </div>

      {/* Actions — clean ghost icons, no backgrounds */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
        <button
          onClick={() => {
            const text = `Check out this deal: ${deal.title} at ${deal.store.name}`;
            if (navigator.share) {
              navigator.share({ title: deal.title, text });
            } else {
              navigator.clipboard.writeText(
                `${deal.title} - ${window.location.origin}/deals/${deal.slug}`
              );
              alert("Link copied!");
            }
          }}
          title="Share"
          style={{
            width: 36, height: 36, borderRadius: 10, border: "none",
            background: "transparent", color: "#94A3B8", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#0f172a"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>ios_share</span>
        </button>
        <button
          onClick={onAction}
          title={actionLabel}
          style={{
            width: 36, height: 36, borderRadius: 10, border: "none",
            background: "transparent", color: "#CBD5E1", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#CBD5E1"; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{actionIcon}</span>
        </button>
      </div>
    </div>
  );
}
