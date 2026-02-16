"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import {
  getDealById,
  getVoteStatus,
  upvoteDeal,
  getDealComments,
  deleteComment,
  editComment,
} from "@/lib/firestore";
import type { Deal, Comment } from "@/types/deals";
import { collection, getDocs, query, where, onSnapshot, doc } from "firebase/firestore";
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "16px", color: "#666" }}>Loading your dashboard...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#1a1a1a",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto", paddingBottom: "120px" }}>
        {/* Header */}
        <header
          style={{
            padding: "48px 24px 16px",
            borderBottom: "1px solid #e5e5e5",
            backgroundColor: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", margin: "0 0 8px 0" }}>Pro Dashboard</h1>
            <p style={{ fontSize: "14px", fontWeight: "500", color: "#999", margin: 0 }}>
              Manage interactions & history
            </p>
          </div>
          {user.photoURL && (
            <div
              style={{
                position: "relative",
                display: "inline-block",
              }}
            >
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "2px solid #fff",
                  boxShadow: "0 0 10px rgba(48, 110, 232, 0.2)",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: "10px",
                  height: "10px",
                  backgroundColor: "#22c55e",
                  borderRadius: "50%",
                  border: "2px solid #fff",
                  boxShadow: "0 0 4px rgba(34, 197, 94, 0.3)",
                }}
              />
            </div>
          )}
        </header>

        {/* Search & Filters */}
        <div
          style={{
            padding: "16px 24px",
            backgroundColor: "#fff",
            borderBottom: "1px solid #e5e5e5",
          }}
        >
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" color="#999">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search my history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: "40px",
                paddingRight: "16px",
                paddingTop: "12px",
                paddingBottom: "12px",
                borderRadius: "12px",
                border: "1px solid #e5e5e5",
                backgroundColor: "#fff",
                fontSize: "14px",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Filter buttons */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "8px",
            }}
          >
            <button
              onClick={() => setFilterStore("")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: !filterStore ? "none" : "1px solid #e5e5e5",
                backgroundColor: !filterStore ? "#306ee8" : "#fff",
                color: !filterStore ? "#fff" : "#666",
                fontWeight: "600",
                fontSize: "12px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              All Stores
            </button>
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => setFilterStore(store.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: filterStore === store.id ? "none" : "1px solid #e5e5e5",
                  backgroundColor: filterStore === store.id ? "#306ee8" : "#fff",
                  color: filterStore === store.id ? "#fff" : "#666",
                  fontWeight: "600",
                  fontSize: "12px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                }}
              >
                {store.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main style={{ padding: "24px" }}>
          {/* Active Engagements Section */}
          <section style={{ marginBottom: "48px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                Active Engagements
                <span
                  style={{
                    fontSize: "10px",
                    backgroundColor: "#e5e5e5",
                    color: "#666",
                    padding: "4px 8px",
                    borderRadius: "999px",
                    fontWeight: "600",
                  }}
                >
                  {filteredDeals.length}
                </span>
              </h2>
            </div>

            {filteredDeals.length === 0 ? (
              <div
                style={{
                  padding: "32px",
                  textAlign: "center",
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  border: "1px solid #e5e5e5",
                  color: "#999",
                }}
              >
                No upvoted deals yet
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredDeals.map((deal) => (
                  <div
                    key={deal.id}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid #e5e5e5",
                      display: "flex",
                      gap: "12px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#306ee8";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(48, 110, 232, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5";
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}
                  >
                    {/* Deal Image */}
                    {deal.imageUrl && (
                      <div
                        style={{
                          width: "64px",
                          height: "64px",
                          minWidth: "64px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          backgroundColor: "#f5f5f5",
                        }}
                      >
                        <img
                          src={deal.imageUrl}
                          alt={deal.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    )}

                    {/* Deal Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: "600", margin: 0, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {deal.title}
                        </h3>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          {deal.savingsAmount && (
                            <>
                              <span style={{ fontSize: "11px", textDecoration: "line-through", color: "#999" }}>
                                ${deal.savingsValue > 0 ? deal.savingsValue : "N/A"}
                              </span>
                              <span style={{ fontSize: "14px", fontWeight: "700", color: "#306ee8" }}>
                                {deal.savingsAmount}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "10px",
                              fontWeight: "600",
                              color: "#ff9500",
                              backgroundColor: "rgba(255, 149, 0, 0.1)",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              marginBottom: "4px",
                              width: "fit-content",
                            }}
                          >
                            ⏱️ Active
                          </div>
                          <div style={{ fontSize: "10px", color: "#999" }}>
                            {deal.store.name}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button
                            onClick={() => {
                              const text = `Check out this deal: ${deal.title} at ${deal.store.name} - ${deal.savingsAmount} off`;
                              if (navigator.share) {
                                navigator.share({ title: deal.title, text });
                              } else {
                                navigator.clipboard.writeText(`${deal.title} - ${window.location.origin}/deals/${deal.slug}`);
                                alert("Deal link copied!");
                              }
                            }}
                            style={{
                              padding: "8px",
                              borderRadius: "50%",
                              border: "none",
                              backgroundColor: "#f5f5f5",
                              color: "#666",
                              cursor: "pointer",
                              fontSize: "16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "#306ee8";
                              (e.currentTarget as HTMLElement).style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "#f5f5f5";
                              (e.currentTarget as HTMLElement).style.color = "#666";
                            }}
                            title="Share Deal"
                          >
                            ↗️
                          </button>
                          <button
                            onClick={() => handleRemoveVote(deal.id)}
                            style={{
                              padding: "8px",
                              borderRadius: "50%",
                              border: "none",
                              backgroundColor: "rgba(34, 197, 94, 0.1)",
                              color: "#22c55e",
                              cursor: "pointer",
                              fontSize: "16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                              (e.currentTarget as HTMLElement).style.color = "#ef4444";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(34, 197, 94, 0.1)";
                              (e.currentTarget as HTMLElement).style.color = "#22c55e";
                            }}
                            title="Remove Vote"
                          >
                            👍
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Comments Section */}
          <section style={{ paddingTop: "24px", borderTop: "1px solid #e5e5e5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Recent Comments</h2>
            </div>

            {commentsError && (
              <div style={{ padding: "12px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>
                {commentsError}
              </div>
            )}

            {userComments.length === 0 ? (
              <div
                style={{
                  padding: "32px",
                  textAlign: "center",
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  border: "1px solid #e5e5e5",
                  color: "#999",
                }}
              >
                No comments yet
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {userComments.map((comment) => (
                  <div key={comment.id} style={{ backgroundColor: "#fff", padding: "16px", borderRadius: "12px", border: "1px solid #e5e5e5" }}>
                    {editingCommentId === comment.id ? (
                      <div>
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "1px solid #e5e5e5",
                            fontFamily: "inherit",
                            fontSize: "13px",
                            minHeight: "80px",
                            boxSizing: "border-box",
                          }}
                        />
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingCommentText("");
                            }}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#f5f5f5",
                              border: "1px solid #e5e5e5",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleEditComment(comment.id)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#306ee8",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div>
                            <h4 style={{ fontSize: "12px", fontWeight: "600", margin: "0 0 4px 0", color: "#1a1a1a" }}>
                              Comment
                            </h4>
                            <span style={{ fontSize: "11px", color: "#999" }}>
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: "13px", color: "#666", lineHeight: "1.5", margin: "8px 0", wordBreak: "break-word" }}>
                          "{comment.content}"
                        </p>
                        <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                          <button
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingCommentText(comment.content);
                            }}
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#306ee8",
                              border: "none",
                              backgroundColor: "transparent",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#ef4444",
                              border: "none",
                              backgroundColor: "transparent",
                              cursor: "pointer",
                              padding: 0,
                            }}
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
