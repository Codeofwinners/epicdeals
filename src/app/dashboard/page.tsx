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
  getUserSubmittedDeals,
  deleteUserDeal,
} from "@/lib/firestore";
import type { Deal, Comment } from "@/types/deals";
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUserXP } from "@/hooks/useGamification";
import { RankBadge } from "@/components/leaderboard/RankBadge";
import { XPProgressBar } from "@/components/leaderboard/XPProgressBar";
import { HandleSetupModal } from "@/components/auth/HandleSetupModal";

type Tab = "upvotes" | "comments" | "saved" | "my-deals";

export default function DashboardPage() {
  const { user, loading: authLoading, userProfile, refreshProfile } = useAuth();
  const router = useRouter();
  const { data: xpData } = useUserXP(user?.uid);

  const [activeTab, setActiveTab] = useState<Tab>("upvotes");
  const [userDeals, setUserDeals] = useState<Deal[]>([]);
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [savedDeals, setSavedDeals] = useState<Deal[]>([]);
  const [submittedDeals, setSubmittedDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [commentsError, setCommentsError] = useState<string | null>(null);

  // Edit handle modal
  const [showHandleEdit, setShowHandleEdit] = useState(false);

  // Edit deal modal state
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    code: "",
    dealUrl: "",
    savingsAmount: "",
    conditions: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editResult, setEditResult] = useState<{ status: string; message: string } | null>(null);

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

        // Fetch user's submitted deals
        const submitted = await getUserSubmittedDeals(user.uid);
        setSubmittedDeals(submitted);

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

  const handleDeleteDeal = async (dealId: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this deal? This cannot be undone.")) return;
    try {
      await deleteUserDeal(dealId, user.uid);
      setSubmittedDeals((prev) => prev.filter((d) => d.id !== dealId));
    } catch (error) {
      console.error("Error deleting deal:", error);
      alert("Failed to delete deal. Please try again.");
    }
  };

  const openEditModal = (deal: Deal) => {
    setEditingDeal(deal);
    setEditForm({
      title: deal.title,
      description: deal.description,
      code: deal.code || "",
      dealUrl: deal.dealUrl,
      savingsAmount: deal.savingsAmount || "",
      conditions: deal.conditions || "",
    });
    setEditResult(null);
    setEditSaving(false);
  };

  const handleEditDeal = async () => {
    if (!editingDeal || !user) return;
    if (!editForm.title.trim() || !editForm.description.trim() || !editForm.dealUrl.trim()) {
      setEditResult({ status: "error", message: "Title, description, and deal URL are required." });
      return;
    }

    setEditSaving(true);
    setEditResult(null);

    try {
      const res = await fetch("/api/edit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: editingDeal.id,
          userId: user.uid,
          title: editForm.title,
          description: editForm.description,
          code: editForm.code,
          dealUrl: editForm.dealUrl,
          savingsAmount: editForm.savingsAmount,
          savingsType: editingDeal.savingsType,
          conditions: editForm.conditions,
          storeName: editingDeal.store.name,
          storeDomain: editingDeal.store.domain,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditResult({ status: "error", message: data.error || "Failed to save changes." });
        setEditSaving(false);
        return;
      }

      const newStatus = data.status as string;
      const message = newStatus === "newly_added"
        ? "Deal updated and published!"
        : "Deal updated and sent for review.";

      setEditResult({ status: newStatus, message });

      // Update local state
      setSubmittedDeals((prev) =>
        prev.map((d) =>
          d.id === editingDeal.id
            ? {
                ...d,
                title: editForm.title,
                description: editForm.description,
                code: editForm.code || undefined,
                dealUrl: editForm.dealUrl,
                savingsAmount: editForm.savingsAmount,
                conditions: editForm.conditions || undefined,
                status: newStatus as Deal["status"],
                aiReview: data.aiReview,
              }
            : d
        )
      );

      // Auto-close after short delay
      setTimeout(() => {
        setEditingDeal(null);
        setEditResult(null);
      }, 1500);
    } catch (error) {
      console.error("Error editing deal:", error);
      setEditResult({ status: "error", message: "Network error. Please try again." });
    } finally {
      setEditSaving(false);
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
    { key: "upvotes", label: "Upvotes", icon: "rocket_launch", count: userDeals.length },
    { key: "comments", label: "Comments", icon: "chat_bubble", count: userComments.length },
    { key: "saved", label: "Saved", icon: "bookmark", count: savedDeals.length },
    { key: "my-deals", label: "My Deals", icon: "sell", count: submittedDeals.length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2", fontFamily: "Manrope, sans-serif", overflowX: "hidden" }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
                @{userProfile?.handle || "user"}
              </h1>
              <button
                onClick={() => setShowHandleEdit(true)}
                title="Edit username"
                style={{
                  width: 28, height: 28, borderRadius: 8, border: "none",
                  background: "#f1f5f9", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#64748b" }}>edit</span>
              </button>
            </div>
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
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
                  flexShrink: 0,
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
        <div style={{ display: "flex", gap: 3, background: "#fff", borderRadius: 14, padding: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", marginBottom: 24, overflow: "hidden" }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  padding: "10px 4px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "Manrope, sans-serif",
                  transition: "all 0.2s",
                  background: isActive ? "linear-gradient(135deg, #06b6d4, #0891b2)" : "transparent",
                  color: isActive ? "#fff" : "#64748b",
                  boxShadow: isActive ? "0 2px 8px rgba(8,145,178,0.25)" : "none",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0 }}>{tab.icon}</span>
                <span className="hidden sm:inline" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{tab.label}</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: isActive ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                  color: isActive ? "#fff" : "#94a3b8",
                  padding: "1px 5px",
                  borderRadius: 20,
                  minWidth: 16,
                  textAlign: "center",
                  flexShrink: 0,
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
                <EmptyState icon="rocket_launch" message="No upvoted deals yet" subtext="Deals you upvote will appear here" />
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
                        <div style={{ padding: "14px 16px" }}>
                          {/* Comment header + actions row */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                              {formatTimeAgo(comment.createdAt)}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                              <button
                                onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.content); }}
                                title="Edit"
                                style={{
                                  width: 34, height: 34, borderRadius: 10, border: "none",
                                  background: "transparent", color: "#CBD5E1", cursor: "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  transition: "color 0.15s ease",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#0f172a"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "#CBD5E1"; }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 19 }}>edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                title="Delete"
                                style={{
                                  width: 34, height: 34, borderRadius: 10, border: "none",
                                  background: "transparent", color: "#CBD5E1", cursor: "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  transition: "color 0.15s ease",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "#CBD5E1"; }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 19 }}>delete</span>
                              </button>
                            </div>
                          </div>

                          {/* Comment text */}
                          <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.6, margin: 0, wordBreak: "break-word" }}>
                            {comment.content}
                          </p>
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

          {/* ─── My Deals Tab ─── */}
          {activeTab === "my-deals" && (
            <div>
              {submittedDeals.length === 0 ? (
                <EmptyState icon="sell" message="No submitted deals yet" subtext="Deals you submit will appear here" />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {submittedDeals.map((deal) => (
                    <MyDealCard
                      key={deal.id}
                      deal={deal}
                      onEdit={() => openEditModal(deal)}
                      onDelete={() => handleDeleteDeal(deal.id)}
                      formatTimeAgo={formatTimeAgo}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Edit Handle Modal ─── */}
      {showHandleEdit && (
        <HandleSetupModal
          mode="edit"
          onClose={() => {
            setShowHandleEdit(false);
            refreshProfile();
          }}
        />
      )}

      {/* ─── Edit Deal Modal ─── */}
      {editingDeal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !editSaving) {
              setEditingDeal(null);
              setEditResult(null);
            }
          }}
        >
          <div style={{
            background: "#fff",
            borderRadius: 20,
            width: "100%",
            maxWidth: 520,
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
          }}>
            {/* Modal header */}
            <div style={{
              padding: "20px 24px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0, fontFamily: "Manrope, sans-serif" }}>
                Edit Deal
              </h2>
              <button
                onClick={() => { if (!editSaving) { setEditingDeal(null); setEditResult(null); } }}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: "none",
                  background: "#f1f5f9", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#64748b" }}>close</span>
              </button>
            </div>

            {/* Store info (read-only) */}
            <div style={{ padding: "12px 24px 0" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                background: "#f8fafc",
                borderRadius: 10,
                border: "1px solid #f1f5f9",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#94a3b8" }}>store</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", fontFamily: "Manrope, sans-serif" }}>
                  {editingDeal.store.name}
                </span>
                <span style={{ fontSize: 11, color: "#cbd5e1" }}>|</span>
                <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "Manrope, sans-serif" }}>
                  {editingDeal.category?.name || "Uncategorized"}
                </span>
              </div>
            </div>

            {/* Form fields */}
            <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <EditField
                label="Title"
                value={editForm.title}
                onChange={(v) => setEditForm((f) => ({ ...f, title: v }))}
                disabled={editSaving}
              />
              <EditField
                label="Description"
                value={editForm.description}
                onChange={(v) => setEditForm((f) => ({ ...f, description: v }))}
                multiline
                disabled={editSaving}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <EditField
                  label="Promo Code"
                  value={editForm.code}
                  onChange={(v) => setEditForm((f) => ({ ...f, code: v }))}
                  placeholder="Optional"
                  disabled={editSaving}
                />
                <EditField
                  label="Savings"
                  value={editForm.savingsAmount}
                  onChange={(v) => setEditForm((f) => ({ ...f, savingsAmount: v }))}
                  placeholder="e.g. 20% off"
                  disabled={editSaving}
                />
              </div>
              <EditField
                label="Deal URL"
                value={editForm.dealUrl}
                onChange={(v) => setEditForm((f) => ({ ...f, dealUrl: v }))}
                disabled={editSaving}
              />
              <EditField
                label="Conditions"
                value={editForm.conditions}
                onChange={(v) => setEditForm((f) => ({ ...f, conditions: v }))}
                placeholder="Optional restrictions or conditions"
                multiline
                disabled={editSaving}
              />

              {/* Result message */}
              {editResult && (
                <div style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: editResult.status === "error" ? "#fef2f2" : editResult.status === "newly_added" ? "#f0fdf4" : "#fffbeb",
                  border: `1px solid ${editResult.status === "error" ? "#fecaca" : editResult.status === "newly_added" ? "#bbf7d0" : "#fde68a"}`,
                }}>
                  <p style={{
                    fontSize: 13,
                    fontWeight: 600,
                    margin: 0,
                    fontFamily: "Manrope, sans-serif",
                    color: editResult.status === "error" ? "#dc2626" : editResult.status === "newly_added" ? "#16a34a" : "#d97706",
                  }}>
                    {editResult.message}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => { if (!editSaving) { setEditingDeal(null); setEditResult(null); } }}
                  disabled={editSaving}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "#f1f5f9",
                    color: "#475569",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: editSaving ? "not-allowed" : "pointer",
                    fontFamily: "Manrope, sans-serif",
                    opacity: editSaving ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditDeal}
                  disabled={editSaving}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 10,
                    border: "none",
                    background: editSaving ? "#94a3b8" : "linear-gradient(135deg, #06b6d4, #0891b2)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: editSaving ? "not-allowed" : "pointer",
                    fontFamily: "Manrope, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {editSaving && (
                    <div style={{
                      width: 16, height: 16,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }} />
                  )}
                  {editSaving ? "AI reviewing..." : "Save Changes"}
                </button>
              </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════ */

function EditField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
}) {
  const baseStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "2px solid #e2e8f0",
    fontSize: 14,
    fontFamily: "Manrope, sans-serif",
    outline: "none",
    boxSizing: "border-box",
    background: disabled ? "#f8fafc" : "#fff",
    color: "#0f172a",
    transition: "border-color 0.15s",
  };

  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6, fontFamily: "Manrope, sans-serif" }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{ ...baseStyle, minHeight: 80, resize: "vertical" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#06b6d4"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={baseStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#06b6d4"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let label: string;
  let bg: string;
  let color: string;

  switch (status) {
    case "newly_added":
    case "verified":
      label = "Published";
      bg = "#f0fdf4";
      color = "#16a34a";
      break;
    case "pending_review":
      label = "In Review";
      bg = "#fffbeb";
      color = "#d97706";
      break;
    case "expired":
      label = "Expired";
      bg = "#f8fafc";
      color = "#94a3b8";
      break;
    default:
      label = status;
      bg = "#f8fafc";
      color = "#64748b";
  }

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      fontSize: 11,
      fontWeight: 700,
      padding: "2px 10px",
      borderRadius: 20,
      background: bg,
      color,
      fontFamily: "Manrope, sans-serif",
      letterSpacing: "0.01em",
    }}>
      {label}
    </span>
  );
}

function MyDealCard({
  deal,
  onEdit,
  onDelete,
  formatTimeAgo,
}: {
  deal: Deal;
  onEdit: () => void;
  onDelete: () => void;
  formatTimeAgo: (d: string) => string;
}) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      padding: "14px 16px",
      border: "1px solid #f1f5f9",
      boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
      display: "flex",
      gap: 12,
      alignItems: "center",
      transition: "all 0.2s ease",
      opacity: deal.status === "expired" ? 0.6 : 1,
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

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
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
          <StatusBadge status={deal.status} />
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>·</span>
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
            {formatTimeAgo(deal.createdAt)}
          </span>
        </div>
      </div>

      {/* Edit + Delete actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
        <button
          onClick={onEdit}
          title="Edit"
          style={{
            width: 36, height: 36, borderRadius: 10, border: "none",
            background: "transparent", color: "#94A3B8", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#0891b2"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          style={{
            width: 36, height: 36, borderRadius: 10, border: "none",
            background: "transparent", color: "#CBD5E1", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#CBD5E1"; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
        </button>
      </div>
    </div>
  );
}

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

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
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
