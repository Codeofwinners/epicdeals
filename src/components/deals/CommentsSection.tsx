"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { addComment, onDealComments, deleteComment, editComment, upvoteComment, downvoteComment, getCommentVoteStatus } from "@/lib/firestore";
import { signInWithGoogle } from "@/lib/auth";
import type { Comment } from "@/types/deals";

interface CommentsSectionProps {
  dealId: string;
  darkBg?: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export function CommentsSection({ dealId, darkBg = false, isOpen = false, onToggle }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const handleToggle = (newState: boolean) => {
    onToggle?.(newState);
  };

  // Real-time listener for comments - only load when opened
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const unsubscribe = onDealComments(dealId, (newComments) => {
      setComments(newComments);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [dealId, isOpen]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Sign in to comment");
      return;
    }

    if (!commentText.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    if (commentText.length > 1000) {
      setError("Comment must be under 1000 characters");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await addComment({
        dealId,
        content: commentText,
        user: {
          id: user.uid,
          username: user.displayName || "Anonymous",
          avatar: user.photoURL || "",
          badges: [],
        },
      });
      setCommentText("");
    } catch (err: any) {
      console.error("Error adding comment:", err);
      setError("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;

    try {
      await deleteComment(commentId);
    } catch (err: any) {
      console.error("Error deleting comment:", err);
      alert("Failed to delete comment");
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    if (editText.length > 1000) {
      setError("Comment must be under 1000 characters");
      return;
    }

    try {
      await editComment(commentId, editText);
      setEditingId(null);
      setEditText("");
    } catch (err: any) {
      console.error("Error editing comment:", err);
      setError("Failed to edit comment");
    }
  };

  const textColor = darkBg ? "#fff" : "#1A1A1A";
  const secondaryTextColor = darkBg ? "rgba(255,255,255,0.7)" : "#666666";
  const borderColor = darkBg ? "rgba(255,255,255,0.1)" : "#EBEBEB";
  const bgColor = darkBg ? "rgba(255,255,255,0.05)" : "#F9F9F7";
  const inputBgColor = darkBg ? "rgba(0,0,0,0.2)" : "#ffffff";

  // If closed, return nothing - parent controls visibility via comment icon
  if (!isOpen) {
    return null;
  }

  // Intelligent comment sorting:
  // 1. User's own comment first (if they have one)
  // 2. Then most popular comments (by upvotes)
  // 3. Then chronologically newest
  const sortedComments = [...comments].sort((a, b) => {
    // User's own comment goes first
    if (user?.uid === a.user.id && user?.uid !== b.user.id) return -1;
    if (user?.uid !== a.user.id && user?.uid === b.user.id) return 1;

    // Then sort by upvotes (most upvoted first)
    if (a.upvotes !== b.upvotes) return b.upvotes - a.upvotes;

    // Finally by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: "12px", marginTop: "12px" }}>
      {/* Close button */}
      <button
        onClick={() => handleToggle(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          fontWeight: "600",
          color: textColor,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          marginBottom: "12px",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
        Hide comments
      </button>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmitComment} style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${borderColor}`,
                  backgroundColor: inputBgColor,
                  color: textColor,
                  fontSize: "13px",
                  fontFamily: "inherit",
                  minHeight: "60px",
                  resize: "vertical",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "6px",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "11px", color: secondaryTextColor }}>
                  {commentText.length}/1000
                </span>
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  style={{
                    padding: "6px 16px",
                    backgroundColor: commentText.trim() ? "#0EA5E9" : "#ccc",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: commentText.trim() ? "pointer" : "not-allowed",
                    opacity: submitting ? 0.7 : 1,
                    outline: "none",
                  }}
                >
                  {submitting ? "Posting..." : "Post"}
                </button>
              </div>
              {error && <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{error}</div>}
            </div>
          </div>
        </form>
      ) : (
        <div style={{ textAlign: "center", padding: "12px", marginBottom: "12px" }}>
          <span style={{ fontSize: "13px", color: secondaryTextColor }}>
            <button
              onClick={() => signInWithGoogle()}
              style={{
                color: "#0EA5E9",
                background: "none",
                border: "none",
                padding: 0,
                font: "inherit",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              Sign in
            </button>
            {" "}to comment
          </span>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "12px", color: secondaryTextColor, fontSize: "13px" }}>
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "12px", color: secondaryTextColor, fontSize: "13px" }}>
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sortedComments.slice(0, 5).map((comment) => (
            <div key={comment.id}>
              {editingId === comment.id ? (
                <div
                  style={{
                    padding: "10px 0",
                    borderBottom: `1px solid ${borderColor}`,
                  }}
                >
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: `1px solid ${borderColor}`,
                      backgroundColor: inputBgColor,
                      color: textColor,
                      fontSize: "12px",
                      fontFamily: "inherit",
                      minHeight: "50px",
                      resize: "vertical",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditText("");
                      }}
                      style={{
                        padding: "4px 12px",
                        backgroundColor: "#ccc",
                        color: "#000",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "600",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEditComment(comment.id)}
                      style={{
                        padding: "4px 12px",
                        backgroundColor: "#0EA5E9",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "600",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "10px 0",
                    borderBottom: `1px solid ${borderColor}`,
                  }}
                >
                  <div style={{ display: "flex", gap: "8px" }}>
                    {comment.user && (comment.user as any).avatar && (
                      <img
                        src={(comment.user as any).avatar}
                        alt={comment.user.username}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", justifyContent: "space-between" }}>
                        <div>
                          <span style={{ fontSize: "12px", fontWeight: "600", color: textColor }}>
                            {comment.user.username}
                            {user?.uid === comment.user.id && <span style={{ fontSize: "10px", color: "#0EA5E9", marginLeft: "6px" }}>(You)</span>}
                          </span>
                          <span style={{ fontSize: "11px", color: secondaryTextColor, marginLeft: "8px" }}>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {user?.uid === comment.user.id && (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              onClick={() => {
                                setEditingId(comment.id);
                                setEditText(comment.content);
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#0EA5E9",
                                cursor: "pointer",
                                fontSize: "12px",
                                padding: "0 4px",
                                outline: "none",
                              }}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                fontSize: "12px",
                                padding: "0 4px",
                                outline: "none",
                              }}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: "12px",
                          color: textColor,
                          margin: 0,
                          wordBreak: "break-word",
                          lineHeight: "1.4",
                        }}
                      >
                        {comment.content}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                        <CommentVoting commentId={comment.id} initialUpvotes={comment.upvotes} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {comments.length > 5 && (
            <div style={{ textAlign: "center", padding: "8px", color: "#0EA5E9", fontSize: "12px", fontWeight: "600" }}>
              +{comments.length - 5} more comments
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CommentVoting({ commentId, initialUpvotes }: { commentId: string; initialUpvotes: number }) {
  const { user } = useAuth();
  const [voteStatus, setVoteStatus] = useState<any>(null);
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      getCommentVoteStatus(user.uid, commentId).then(setVoteStatus);
    }
  }, [user?.uid, commentId]);

  const handleVote = async (type: "up" | "down") => {
    if (!user) {
      alert("Sign in to vote");
      return;
    }
    setLoading(true);
    try {
      if (type === "up") {
        await upvoteComment(user.uid, commentId);
      } else {
        await downvoteComment(user.uid, commentId);
      }
      const newStatus = await getCommentVoteStatus(user.uid, commentId);
      setVoteStatus(newStatus);
    } catch (error) {
      console.error("Comment voting error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUpvotes(initialUpvotes);
  }, [initialUpvotes]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "2px", backgroundColor: "rgba(0,0,0,0.03)", padding: "2px 6px", borderRadius: "6px" }}>
        <button
          onClick={() => handleVote("up")}
          disabled={loading}
          style={{
            background: "none",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            padding: "2px",
            color: voteStatus?.voteType === "upvote" ? "#0EA5E9" : "#a1a1aa",
            outline: "none",
          }}
          title="Found this helpful"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px", fontVariationSettings: voteStatus?.voteType === "upvote" ? "'FILL' 1" : "" }}>thumb_up</span>
        </button>
        <span style={{ fontSize: "11px", fontWeight: "700", color: "#71717a", minWidth: "12px", textAlign: "center" }}>
          {upvotes}
        </span>
        <button
          onClick={() => handleVote("down")}
          disabled={loading}
          style={{
            background: "none",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            padding: "2px",
            color: voteStatus?.voteType === "downvote" ? "#ef4444" : "#a1a1aa",
            outline: "none",
          }}
          title="Not helpful"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px", fontVariationSettings: voteStatus?.voteType === "downvote" ? "'FILL' 1" : "" }}>thumb_down</span>
        </button>
      </div>
    </div>
  );
}
