"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  AlertTriangle,
  ChevronRight,
  LogIn,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { signInWithGoogle } from "@/lib/auth";
import { getPendingReviewDeals, approveDeal, rejectDeal, getUserProfile } from "@/lib/firestore";
import type { Deal } from "@/types/deals";

export default function AdminReviewPage() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Check admin role
  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((profile) => {
      setIsAdmin(profile?.role === "admin");
    });
  }, [user]);

  // Fetch pending deals
  useEffect(() => {
    if (isAdmin !== true) return;
    setLoading(true);
    getPendingReviewDeals()
      .then(setDeals)
      .finally(() => setLoading(false));
  }, [isAdmin]);

  async function handleApprove(dealId: string) {
    setProcessingIds((prev) => new Set(prev).add(dealId));
    try {
      await approveDeal(dealId);
      setDeals((prev) => prev.filter((d) => d.id !== dealId));
    } catch (err) {
      console.error("Approve failed:", err);
    }
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(dealId);
      return next;
    });
  }

  async function handleReject(dealId: string) {
    setProcessingIds((prev) => new Set(prev).add(dealId));
    try {
      await rejectDeal(dealId);
      setDeals((prev) => prev.filter((d) => d.id !== dealId));
    } catch (err) {
      console.error("Reject failed:", err);
    }
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(dealId);
      return next;
    });
  }

  const NavBar = () => (
    <nav className="fixed top-0 w-full h-14 border-b border-gray-100 bg-white z-50">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center">
        <Link href="/" className="flex items-baseline leading-none">
          <span className="font-black text-xl text-slate-900 tracking-tighter">Legit</span>
          <span className="font-black text-xl text-emerald-500 tracking-tighter">.</span>
          <span className="font-black text-xl bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent tracking-tighter">Discount</span>
        </Link>
      </div>
    </nav>
  );

  // Auth loading
  if (authLoading || isAdmin === null) {
    if (!authLoading && !user) {
      return (
        <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
          <NavBar />
          <div className="pt-14 flex items-center justify-center min-h-[calc(100vh-56px)] px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "#d1fae5" }}>
                <LogIn className="w-8 h-8" style={{ color: "#059669" }} />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-3">Sign in required</h1>
              <p className="text-gray-500 mb-8">You need to sign in to access the admin panel.</p>
              <button
                onClick={() => signInWithGoogle()}
                style={{ backgroundColor: "#111827", color: "#fff" }}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                <LogIn className="w-4 h-4" />
                Sign in with Google
              </button>
            </motion.div>
          </div>
        </main>
      );
    }

    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
        <NavBar />
        <div className="pt-14 flex items-center justify-center min-h-[calc(100vh-56px)]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </main>
    );
  }

  // Access denied
  if (!isAdmin) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
        <NavBar />
        <div className="pt-14 flex items-center justify-center min-h-[calc(100vh-56px)] px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "#fee2e2" }}>
              <XCircle className="w-8 h-8" style={{ color: "#ef4444" }} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3">Access Denied</h1>
            <p className="text-gray-500 mb-8">You don&apos;t have admin privileges to access this page.</p>
            <Link
              href="/"
              style={{ backgroundColor: "#111827", color: "#fff" }}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Back to Home
            </Link>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <NavBar />

      <div className="pt-14">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Admin Review</span>
          </nav>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-4 pb-16">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#ede9fe" }}
            >
              <ShieldCheck className="w-6 h-6" style={{ color: "#7c3aed" }} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Review Queue</h1>
              <p className="text-sm text-gray-500">
                {loading ? "Loading..." : `${deals.length} deal${deals.length !== 1 ? "s" : ""} pending review`}
              </p>
            </div>
          </motion.div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          )}

          {/* Empty state */}
          {!loading && deals.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: "#d1fae5" }}
              >
                <CheckCircle2 className="w-8 h-8" style={{ color: "#10b981" }} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">All clear!</h2>
              <p className="text-gray-500">No deals pending review. Nice work.</p>
            </motion.div>
          )}

          {/* Deal cards */}
          <AnimatePresence>
            {deals.map((deal, i) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 overflow-hidden"
              >
                {/* Deal info */}
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 leading-snug">{deal.title}</h3>
                    {deal.code && (
                      <span
                        className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
                        style={{ backgroundColor: "#f3f4f6", color: "#374151" }}
                      >
                        {deal.code}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span className="font-medium text-gray-700">{deal.store.name}</span>
                    <span>&#183;</span>
                    <span>{deal.savingsAmount}</span>
                    {deal.category && (
                      <>
                        <span>&#183;</span>
                        <span>{deal.category.name}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{deal.description}</p>
                </div>

                {/* AI Assessment */}
                {deal.aiReview && (
                  <div
                    className="rounded-xl p-4 mb-4"
                    style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" style={{ color: "#d97706" }} />
                      <span className="text-sm font-semibold" style={{ color: "#92400e" }}>
                        AI Assessment — Confidence: {deal.aiReview.confidence}%
                      </span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: "#a16207" }}>{deal.aiReview.summary}</p>
                    {deal.aiReview.reasons.length > 0 && (
                      <ul className="space-y-1">
                        {deal.aiReview.reasons.map((reason, idx) => (
                          <li key={idx} className="text-xs flex items-center gap-1.5" style={{ color: "#a16207" }}>
                            <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: "#d97706" }} />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: "#ca8a04" }}>
                      <span>Legitimacy: {deal.aiReview.legitimacyScore}%</span>
                      <span>Spam: {deal.aiReview.spamScore}%</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(deal.id)}
                    disabled={processingIds.has(deal.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "#059669", color: "#fff" }}
                  >
                    {processingIds.has(deal.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(deal.id)}
                    disabled={processingIds.has(deal.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "#ef4444", color: "#fff" }}
                  >
                    {processingIds.has(deal.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Reject
                  </button>
                  {deal.dealUrl && (
                    <a
                      href={deal.dealUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      style={{ border: "1px solid #e5e7eb" }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View URL
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
