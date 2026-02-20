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
  onCountChange?: (count: number) => void;
}

export function CommentsSection({ dealId, darkBg = false, isOpen = false, onToggle, onCountChange }: CommentsSectionProps) {
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

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const unsubscribe = onDealComments(dealId, (newComments) => {
      setComments(newComments);
      onCountChange?.(newComments.length);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [dealId, isOpen]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert("Sign in to comment"); return; }
    if (!commentText.trim()) { setError("Comment cannot be empty"); return; }
    if (commentText.length > 1000) { setError("Comment must be under 1000 characters"); return; }

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
    if (!editText.trim()) { setError("Comment cannot be empty"); return; }
    if (editText.length > 1000) { setError("Comment must be under 1000 characters"); return; }
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
  const secondaryTextColor = darkBg ? "rgba(255,255,255,0.5)" : "#AAAAAA";
  const borderColor = darkBg ? "rgba(255,255,255,0.1)" : "#EBEBEB";
  const inputBgColor = darkBg ? "rgba(0,0,0,0.2)" : "#ffffff";

  if (!isOpen) return null;

  const sortedComments = [...comments].sort((a, b) => {
    if (user?.uid === a.user.id && user?.uid !== b.user.id) return -1;
    if (user?.uid !== a.user.id && user?.uid === b.user.id) return 1;
    if (a.upvotes !== b.upvotes) return b.upvotes - a.upvotes;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: "12px", marginTop: "12px" }}>

      {/* Close button */}
      <button
        onClick={() => handleToggle(false)}
        style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: secondaryTextColor, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: "12px", outline: "none" }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "14px", lineHeight: 1 }}>close</span>
        Hide comments
      </button>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmitComment} style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {user.photoURL && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <img src={user.photoURL} alt={user.displayName || "User"} style={{ width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0 }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: textColor }}>{user.displayName || "You"}</span>
              </div>
            )}
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
              style={{
                width: "100%", padding: "10px 12px",
                borderRadius: "8px", border: `1px solid ${borderColor}`,
                backgroundColor: inputBgColor, color: textColor,
                fontSize: "13px", fontFamily: "inherit",
                minHeight: "70px", resize: "vertical",
                boxSizing: "border-box", outline: "none",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", color: secondaryTextColor }}>{commentText.length}/1000</span>
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                style={{
                  padding: "6px 16px",
                  backgroundColor: commentText.trim() ? "#0A0A0A" : "#E0E0E0",
                  color: commentText.trim() ? "#fff" : "#999",
                  border: "none", borderRadius: "7px",
                  fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em",
                  cursor: commentText.trim() ? "pointer" : "not-allowed",
                  opacity: submitting ? 0.6 : 1, outline: "none",
                }}
              >
                {submitting ? "Posting..." : "Post"}
              </button>
            </div>
            {error && <div style={{ color: "#ef4444", fontSize: "11px" }}>{error}</div>}
          </div>
        </form>
      ) : (
        <div style={{ textAlign: "center", padding: "12px 0", marginBottom: "12px" }}>
          <span style={{ fontSize: "12px", color: secondaryTextColor }}>
            <button onClick={() => signInWithGoogle()} style={{ color: "#0EA5E9", background: "none", border: "none", padding: 0, font: "inherit", cursor: "pointer", fontWeight: 700 }}>Sign in</button>
            {" "}to join the conversation
          </span>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "12px", color: secondaryTextColor, fontSize: "12px" }}>Loading...</div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "12px 0", color: secondaryTextColor, fontSize: "12px" }}>No comments yet. Be the first!</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {sortedComments.slice(0, 5).map((comment) => (
            <div key={comment.id} style={{ paddingBottom: "12px", marginBottom: "12px", borderBottom: `1px solid ${borderColor}` }}>
              {editingId === comment.id ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: "6px",
                      border: `1px solid ${borderColor}`, backgroundColor: inputBgColor,
                      color: textColor, fontSize: "12px", fontFamily: "inherit",
                      minHeight: "50px", resize: "vertical", boxSizing: "border-box", outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px", justifyContent: "flex-end" }}>
                    <button onClick={() => { setEditingId(null); setEditText(""); }} style={{ padding: "4px 12px", backgroundColor: "transparent", color: secondaryTextColor, border: `1px solid ${borderColor}`, borderRadius: "5px", fontSize: "11px", fontWeight: 600, cursor: "pointer", outline: "none" }}>Cancel</button>
                    <button onClick={() => handleEditComment(comment.id)} style={{ padding: "4px 12px", backgroundColor: "#0A0A0A", color: "#fff", border: "none", borderRadius: "5px", fontSize: "11px", fontWeight: 700, cursor: "pointer", outline: "none" }}>Save</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>

                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      {(comment.user as any).avatar && (
                        <img src={(comment.user as any).avatar} alt={comment.user.username} style={{ width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0 }} />
                      )}
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: textColor }}>
                          {comment.user.username}
                          {user?.uid === comment.user.id && <span style={{ marginLeft: "5px", fontSize: "9px", color: "#0EA5E9", padding: "1px 5px", borderRadius: "8px", backgroundColor: "rgba(14,165,233,0.1)" }}>You</span>}
                        </span>
                        <div style={{ fontSize: "10px", color: secondaryTextColor }}>{new Date(comment.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Edit / Delete — minimal icon buttons */}
                    {user?.uid === comment.user.id && (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => { setEditingId(comment.id); setEditText(comment.content); }}
                          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", outline: "none", display: "flex", alignItems: "center" }}
                          title="Edit"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "14px", color: secondaryTextColor, lineHeight: 1 }}>edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", outline: "none", display: "flex", alignItems: "center" }}
                          title="Delete"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "14px", color: secondaryTextColor, lineHeight: 1 }}>delete</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <p style={{ fontSize: "13px", color: textColor, margin: 0, wordBreak: "break-word", lineHeight: 1.5 }}>{comment.content}</p>

                  {/* Vote row */}
                  <CommentVoting commentId={comment.id} initialUpvotes={comment.upvotes} darkBg={darkBg} />
                </div>
              )}
            </div>
          ))}
          {comments.length > 5 && (
            <div style={{ textAlign: "center", padding: "4px 0", color: "#0EA5E9", fontSize: "11px", fontWeight: 700 }}>
              +{comments.length - 5} more comments
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CommentVoting({ commentId, initialUpvotes, darkBg = false }: { commentId: string; initialUpvotes: number; darkBg?: boolean }) {
  const { user } = useAuth();
  const [voteStatus, setVoteStatus] = useState<any>(null);
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.uid) getCommentVoteStatus(user.uid, commentId).then(setVoteStatus);
  }, [user?.uid, commentId]);

  useEffect(() => { setUpvotes(initialUpvotes); }, [initialUpvotes]);

  const handleVote = async (type: "up" | "down") => {
    if (!user) { alert("Sign in to vote"); return; }
    setLoading(true);
    try {
      if (type === "up") await upvoteComment(user.uid, commentId);
      else await downvoteComment(user.uid, commentId);
      setVoteStatus(await getCommentVoteStatus(user.uid, commentId));
    } catch (error) {
      console.error("Comment voting error:", error);
    } finally {
      setLoading(false);
    }
  };

  const restColor   = darkBg ? "rgba(255,255,255,0.3)" : "#C8C8C8";
  const upColor     = darkBg ? "#FFFFFF" : "#0A0A0A";
  const downColor   = darkBg ? "rgba(255,255,255,0.5)" : "#888888";
  const isUpvoted   = voteStatus?.voteType === "upvote";
  const isDownvoted = voteStatus?.voteType === "downvote";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {/* Upvote */}
      <button
        onClick={() => handleVote("up")}
        disabled={loading}
        style={{ display: "flex", alignItems: "center", gap: "3px", background: "none", border: "none", padding: 0, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.4 : 1, outline: "none" }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "12px", lineHeight: 1, color: isUpvoted ? upColor : restColor, fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
        <span style={{ fontSize: "11px", fontWeight: 700, color: isUpvoted ? upColor : "#999", lineHeight: 1 }}>{upvotes}</span>
      </button>

      {/* Downvote */}
      <button
        onClick={() => handleVote("down")}
        disabled={loading}
        style={{ display: "flex", alignItems: "center", gap: "3px", background: "none", border: "none", padding: 0, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.4 : 1, outline: "none" }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "12px", lineHeight: 1, color: isDownvoted ? downColor : restColor, fontVariationSettings: "'FILL' 1" }}>arrow_downward</span>
      </button>
    </div>
  );
}
