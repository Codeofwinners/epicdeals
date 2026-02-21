"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Bot,
  Search,
  ChevronDown,
  LogIn,
  Plus,
  AlertTriangle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Clock,
  XCircle,
  Upload,
  Camera,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { signInWithGoogle } from "@/lib/auth";
import { useAllStores, useAllCategories } from "@/hooks/useFirestore";
import type { DealType, DiscountType } from "@/types/deals";

const savingsTypes: { value: DealType; label: string }[] = [
  { value: "percent_off", label: "Percent Off" },
  { value: "dollar_off", label: "Dollar Off" },
  { value: "bogo", label: "BOGO" },
  { value: "free_shipping", label: "Free Shipping" },
  { value: "free_trial", label: "Free Trial" },
  { value: "cashback", label: "Cashback" },
];

type SubmitPhase = "idle" | "checking_duplicates" | "analyzing" | "creating";
type ResultStatus = "approved" | "needs_review" | "duplicate" | null;
type PageMode = "upload" | "manual";

interface FormErrors {
  store?: string;
  dealUrl?: string;
  savingsType?: string;
  savingsAmount?: string;
  title?: string;
  description?: string;
  category?: string;
  storeDomain?: string;
}

interface DuplicateMatch {
  id: string;
  title: string;
  reason: string;
}

export default function SubmitDealPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: stores } = useAllStores();
  const { data: categories } = useAllCategories();

  // Page mode
  const [mode, setMode] = useState<PageMode>("upload");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedFromScreenshot, setExtractedFromScreenshot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Form state
  const [storeId, setStoreId] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [isNewStore, setIsNewStore] = useState(false);
  const [newStoreDomain, setNewStoreDomain] = useState("");
  const [dealUrl, setDealUrl] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [savingsType, setSavingsType] = useState<DealType | "">("");
  const [savingsAmount, setSavingsAmount] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [conditions, setConditions] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>("idle");
  const [resultStatus, setResultStatus] = useState<ResultStatus>(null);
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [storeCreated, setStoreCreated] = useState(false);

  // Real-time duplicate warnings
  const [liveDuplicates, setLiveDuplicates] = useState<DuplicateMatch[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  const storesList = stores ?? [];
  const categoriesList = categories ?? [];

  const filteredStores = useMemo(() => {
    if (!storeSearch.trim()) return storesList;
    const q = storeSearch.toLowerCase();
    return storesList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.domain.toLowerCase().includes(q)
    );
  }, [storeSearch, storesList]);

  const selectedStore = useMemo(
    () => storesList.find((s) => s.id === storeId),
    [storeId, storesList]
  );

  // ── Screenshot handling ──────────────────────────────────────
  function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) {
      setExtractError("Please select an image file (PNG, JPG, or WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setExtractError("Image must be under 10MB.");
      return;
    }

    setExtractError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      extractDealFromImage(base64);
    };
    reader.readAsDataURL(file);
  }

  async function extractDealFromImage(base64: string) {
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch("/api/extract-deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to extract deal info.");
      }

      const ext = data.extracted;

      // Auto-fill form fields
      if (ext.title) setTitle(ext.title);
      if (ext.description) setDescription(ext.description);
      if (ext.savingsAmount) setSavingsAmount(ext.savingsAmount);
      if (ext.code) setPromoCode(ext.code.toUpperCase());
      if (ext.dealUrl) setDealUrl(ext.dealUrl);
      if (ext.conditions) setConditions(ext.conditions);

      // Match savings type
      if (ext.savingsType) {
        const validTypes: DealType[] = ["percent_off", "dollar_off", "bogo", "free_shipping", "free_trial", "cashback"];
        if (validTypes.includes(ext.savingsType)) {
          setSavingsType(ext.savingsType);
        }
      }

      // Match store (fuzzy lowercase match)
      if (ext.storeName && storesList.length > 0) {
        const storeLower = ext.storeName.toLowerCase();
        const matched = storesList.find(
          (s) =>
            s.name.toLowerCase() === storeLower ||
            s.name.toLowerCase().includes(storeLower) ||
            storeLower.includes(s.name.toLowerCase()) ||
            (ext.storeDomain && s.domain.toLowerCase().includes(ext.storeDomain.toLowerCase()))
        );
        if (matched) {
          setStoreId(matched.id);
          setIsNewStore(false);
          setStoreSearch("");
        } else {
          setIsNewStore(true);
          setStoreSearch(ext.storeName);
          if (ext.storeDomain) setNewStoreDomain(ext.storeDomain);
        }
      }

      // Match category by slug
      if (ext.categoryGuess && categoriesList.length > 0) {
        const catSlug = ext.categoryGuess.toLowerCase();
        const matched = categoriesList.find(
          (c) => c.slug.toLowerCase() === catSlug || c.slug.toLowerCase().includes(catSlug)
        );
        if (matched) setCategoryId(matched.id);
      }

      setExtractedFromScreenshot(true);
      setMode("manual");

      // Scroll to form after a brief delay
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Failed to extract deal. Please fill in manually.");
    }
    setExtracting(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function clearScreenshot() {
    setImagePreview(null);
    setExtractedFromScreenshot(false);
    setExtractError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Real-time duplicate checking with debounce
  const checkDuplicatesDebounced = useCallback(async () => {
    const currentStoreId = storeId;
    if (!currentStoreId || (!title && !promoCode && !dealUrl)) {
      setLiveDuplicates([]);
      return;
    }

    setCheckingDuplicates(true);
    try {
      const res = await fetch("/api/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: currentStoreId,
          title: title || undefined,
          code: promoCode || undefined,
          dealUrl: dealUrl || undefined,
        }),
      });
      const data = await res.json();
      setLiveDuplicates(data.matches || []);
    } catch {
      setLiveDuplicates([]);
    }
    setCheckingDuplicates(false);
  }, [storeId, title, promoCode, dealUrl]);

  useEffect(() => {
    if (!storeId) {
      setLiveDuplicates([]);
      return;
    }
    const timer = setTimeout(checkDuplicatesDebounced, 800);
    return () => clearTimeout(timer);
  }, [storeId, title, promoCode, dealUrl, checkDuplicatesDebounced]);

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!storeId && !isNewStore) newErrors.store = "Please select a store.";
    if (isNewStore && !storeSearch.trim()) newErrors.store = "Please enter the store name.";
    if (isNewStore && !newStoreDomain.trim()) newErrors.storeDomain = "Please enter the store domain.";
    if (!dealUrl.trim()) {
      newErrors.dealUrl = "Deal URL is required.";
    } else {
      try {
        new URL(dealUrl);
      } catch {
        newErrors.dealUrl = "Please enter a valid URL (e.g., https://example.com).";
      }
    }
    if (!savingsType) newErrors.savingsType = "Please select a savings type.";
    if (!savingsAmount.trim()) newErrors.savingsAmount = "Savings amount is required.";
    if (!title.trim()) {
      newErrors.title = "Deal title is required.";
    } else if (title.length > 100) {
      newErrors.title = "Title must be 100 characters or fewer.";
    }
    if (!description.trim()) {
      newErrors.description = "Description is required.";
    } else if (description.length > 500) {
      newErrors.description = "Description must be 500 characters or fewer.";
    }
    if (!categoryId) newErrors.category = "Please select a category.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const selectedCategory = categoriesList.find((c) => c.id === categoryId);
    if (!selectedCategory) return;

    setSubmitPhase("checking_duplicates");

    try {
      // Build payload
      const discountType: DiscountType = promoCode ? "code" : "deal";
      const payload: Record<string, unknown> = {
        title,
        description,
        code: promoCode || undefined,
        category: selectedCategory,
        savingsType: savingsType as DealType,
        savingsAmount,
        savingsValue: parseFloat(savingsAmount.replace(/[^0-9.]/g, "")) || 0,
        discountType,
        conditions: conditions || undefined,
        dealUrl,
        expiresAt: expirationDate || undefined,
        submittedBy: user
          ? {
              id: user.uid,
              username: user.displayName || user.email?.split("@")[0] || "User",
              reputation: 0,
              badges: [],
              dealsSubmitted: 0,
            }
          : undefined,
        tags: [selectedCategory.slug],
      };

      if (isNewStore) {
        payload.storeName = storeSearch.trim();
        payload.storeDomain = newStoreDomain.trim();
      } else {
        payload.storeId = storeId;
        if (selectedStore) {
          payload.tags = [selectedCategory.slug, selectedStore.slug];
        }
      }

      // Phase 2: AI analyzing
      setSubmitPhase("analyzing");

      const res = await fetch("/api/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      if (data.status === "duplicate") {
        setDuplicateMatches(data.matches || []);
        setResultStatus("duplicate");
        setSubmitPhase("idle");
        return;
      }

      // Phase 3: Creating
      setSubmitPhase("creating");
      await new Promise((r) => setTimeout(r, 600)); // brief visual pause

      setAiConfidence(data.aiReview?.confidence ?? null);
      setStoreCreated(data.storeCreated || false);

      if (data.status === "approved") {
        setResultStatus("approved");
      } else {
        setResultStatus("needs_review");
      }
    } catch (err) {
      console.error("Submit failed:", err);
      setErrors({ title: err instanceof Error ? err.message : "Submission failed. Please try again." });
    }
    setSubmitPhase("idle");
  }

  function resetForm() {
    setStoreId("");
    setStoreSearch("");
    setIsNewStore(false);
    setNewStoreDomain("");
    setDealUrl("");
    setPromoCode("");
    setSavingsType("");
    setSavingsAmount("");
    setTitle("");
    setDescription("");
    setCategoryId("");
    setConditions("");
    setExpirationDate("");
    setErrors({});
    setResultStatus(null);
    setDuplicateMatches([]);
    setAiConfidence(null);
    setStoreCreated(false);
    setLiveDuplicates([]);
    setSubmitPhase("idle");
    setMode("upload");
    setImagePreview(null);
    setExtractedFromScreenshot(false);
    setExtractError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Confetti particles for success animation
  const confettiColors = [
    "#10B981", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#EF4444", "#06B6D4", "#84CC16",
  ];

  // ── Auth gate
  if (!authLoading && !user) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>

        <div className="flex items-center justify-center min-h-[60vh] px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "#d1fae5" }}
            >
              <LogIn className="w-8 h-8" style={{ color: "#059669" }} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3">Sign in to submit deals</h1>
            <p className="text-gray-500 mb-8">
              Sign in with your Google account to submit deals and help the community save.
            </p>
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

  // ── Result: Approved
  if (resultStatus === "approved") {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>

        <div className="flex items-center justify-center min-h-[60vh] px-4 py-12">
          <div className="relative">
            {confettiColors.map((color, i) =>
              [0, 1, 2].map((j) => (
                <motion.div
                  key={`${i}-${j}`}
                  className="absolute w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(((i * 3 + j) * 2 * Math.PI) / 24) * (150 + j * 60),
                    y: Math.sin(((i * 3 + j) * 2 * Math.PI) / 24) * (150 + j * 60) - 80,
                    opacity: 0, scale: 0,
                    rotate: 360 * (j % 2 === 0 ? 1 : -1),
                  }}
                  transition={{ duration: 1.2 + j * 0.2, ease: "easeOut", delay: j * 0.1 }}
                />
              ))
            )}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
              className="text-center relative z-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: "#d1fae5" }}
              >
                <CheckCircle2 className="w-10 h-10" style={{ color: "#10b981" }} />
              </motion.div>
              <h1 className="text-2xl font-black text-gray-900 mb-3">Deal Published!</h1>
              {aiConfidence !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4"
                  style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0" }}
                >
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#059669" }} />
                  <span className="text-xs font-semibold" style={{ color: "#059669" }}>
                    AI Confidence: {aiConfidence}%
                  </span>
                </motion.div>
              )}
              <p className="text-gray-500 max-w-md mx-auto mb-2 leading-relaxed">
                Your deal has been verified by our AI and is now live on the platform!
              </p>
              {storeCreated && (
                <p className="text-sm mb-6" style={{ color: "#059669" }}>
                  A new store was also created for this deal.
                </p>
              )}
              <div className="flex items-center justify-center gap-3 mt-6">
                <Link
                  href="/"
                  style={{ backgroundColor: "#111827", color: "#fff" }}
                  className="px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Back to Deals
                </Link>
                <button
                  onClick={resetForm}
                  style={{ backgroundColor: "#059669", color: "#fff" }}
                  className="px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Submit Another
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    );
  }

  // ── Result: Needs Review
  if (resultStatus === "needs_review") {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>

        <div className="flex items-center justify-center min-h-[60vh] px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
            className="text-center max-w-md"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "#fef3c7" }}
            >
              <Clock className="w-10 h-10" style={{ color: "#d97706" }} />
            </motion.div>
            <h1 className="text-2xl font-black text-gray-900 mb-3">Submitted for Review</h1>
            <div
              className="rounded-xl p-4 mb-6 text-left"
              style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}
            >
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#d97706" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#92400e" }}>
                    AI flagged this for a quick manual check
                  </p>
                  <p className="text-sm mt-1" style={{ color: "#a16207" }}>
                    This usually happens for newer stores or unusually high discounts. Your deal should be live within 24 hours.
                  </p>
                </div>
              </div>
            </div>
            {storeCreated && (
              <p className="text-sm mb-4" style={{ color: "#059669" }}>
                A new store was also created for this deal.
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/"
                style={{ backgroundColor: "#111827", color: "#fff" }}
                className="px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Back to Deals
              </Link>
              <button
                onClick={resetForm}
                style={{ backgroundColor: "#d97706", color: "#fff" }}
                className="px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Submit Another
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  // ── Result: Duplicate
  if (resultStatus === "duplicate") {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>

        <div className="flex items-center justify-center min-h-[60vh] px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
            className="text-center max-w-md w-full"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "#fee2e2" }}
            >
              <XCircle className="w-10 h-10" style={{ color: "#ef4444" }} />
            </motion.div>
            <h1 className="text-2xl font-black text-gray-900 mb-3">This Deal Already Exists</h1>
            <p className="text-gray-500 mb-6">
              We found matching deals that are already on the platform.
            </p>
            <div className="space-y-2 mb-6 text-left">
              {duplicateMatches.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="rounded-xl p-3 flex items-center gap-3"
                  style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#ef4444" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{match.title}</p>
                    <p className="text-xs" style={{ color: "#dc2626" }}>{match.reason}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/"
                style={{ backgroundColor: "#111827", color: "#fff" }}
                className="px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Back to Deals
              </Link>
              <button
                onClick={resetForm}
                style={{ backgroundColor: "#ef4444", color: "#fff" }}
                className="px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Try Different Deal
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  // ── Main form
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <div>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Submit a Deal</span>
          </nav>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Submit a Deal</h1>
            <p className="text-gray-500">Found a deal we&apos;re missing? Share it with the community.</p>
          </motion.div>

          {/* ── Screenshot Upload Zone (Mode A: Upload) ── */}
          {mode === "upload" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="mb-6"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              {/* Drop zone or extracting state */}
              {!imagePreview && !extracting && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className="cursor-pointer rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all"
                  style={{
                    border: dragOver ? "2px dashed #10b981" : "2px dashed #d1d5db",
                    backgroundColor: dragOver ? "#ecfdf5" : "#fff",
                    minHeight: "240px",
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                    style={{
                      background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)",
                      border: "1px solid #a7f3d0",
                    }}
                  >
                    <Camera className="w-7 h-7" style={{ color: "#059669" }} />
                  </div>
                  <p className="text-lg font-bold text-gray-900 mb-1">
                    Drop a screenshot of any deal
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Our AI will extract everything automatically
                  </p>
                  <div
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#059669", color: "#fff" }}
                  >
                    <Upload className="w-4 h-4" />
                    Browse Files
                  </div>
                  <p className="text-xs text-gray-300 mt-3">PNG, JPG, or WebP up to 10MB</p>
                </div>
              )}

              {/* Extracting state with image preview */}
              {imagePreview && extracting && (
                <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid #a7f3d0", backgroundColor: "#fff" }}>
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Screenshot preview"
                      className="w-full max-h-64 object-contain"
                      style={{ backgroundColor: "#f9fafb" }}
                    />
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      style={{ backgroundColor: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)" }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <Sparkles className="w-10 h-10 mb-3" style={{ color: "#059669" }} />
                      </motion.div>
                      <p className="text-sm font-bold" style={{ color: "#065f46" }}>AI reading your screenshot...</p>
                      <p className="text-xs text-gray-400 mt-1">Extracting deal details</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Image preview after extraction (or error) */}
              {imagePreview && !extracting && (
                <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Screenshot preview"
                      className="w-full max-h-48 object-contain"
                      style={{ backgroundColor: "#f9fafb" }}
                    />
                    <button
                      onClick={clearScreenshot}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {extractError && (
                    <div className="p-3" style={{ backgroundColor: "#fef2f2", borderTop: "1px solid #fecaca" }}>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
                        <div>
                          <p className="text-sm" style={{ color: "#dc2626" }}>{extractError}</p>
                          <button
                            onClick={() => { setMode("manual"); setExtractError(null); }}
                            className="text-sm font-semibold mt-1 hover:underline"
                            style={{ color: "#059669" }}
                          >
                            Fill in manually instead
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Extract error without preview */}
              {!imagePreview && extractError && (
                <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#ef4444" }} />
                    <p className="text-sm" style={{ color: "#dc2626" }}>{extractError}</p>
                  </div>
                </div>
              )}

              {/* "Or fill in manually" link */}
              {!extracting && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => setMode("manual")}
                    className="text-sm font-medium hover:underline transition-colors"
                    style={{ color: "#6b7280" }}
                  >
                    Or fill in manually
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Form (Mode B: Manual / post-extraction review) ── */}
          {mode === "manual" && (
            <div ref={formRef}>
              {/* Extracted from screenshot badge */}
              {extractedFromScreenshot && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 rounded-2xl p-4 flex items-start gap-3"
                  style={{ background: "linear-gradient(to right, #ecfdf5, #f0fdfa)", border: "1px solid #a7f3d0" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#fff", border: "1px solid #a7f3d0" }}
                  >
                    <Sparkles className="w-5 h-5" style={{ color: "#10b981" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "#065f46" }}>Extracted from screenshot</p>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(5,150,105,0.8)" }}>
                      Review the details below and make any corrections before submitting.
                    </p>
                  </div>
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Source"
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                      style={{ border: "1px solid #a7f3d0" }}
                    />
                  )}
                </motion.div>
              )}

              {/* AI-Powered Review banner (only when not extracted) */}
              {!extractedFromScreenshot && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 }}
                  className="mb-8 rounded-2xl p-4 flex items-start gap-3"
                  style={{ background: "linear-gradient(to right, #ecfdf5, #f0fdfa)", border: "1px solid #a7f3d0" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#fff", border: "1px solid #a7f3d0" }}
                  >
                    <Bot className="w-5 h-5" style={{ color: "#10b981" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#065f46" }}>AI-Powered Review</p>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(5,150,105,0.8)" }}>
                      Our AI automatically checks for duplicates, evaluates deal quality, and can even create new stores. High-quality deals are published instantly.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* "Use screenshot instead" link */}
              {!extractedFromScreenshot && (
                <div className="text-center mb-6">
                  <button
                    onClick={() => setMode("upload")}
                    className="text-sm font-medium hover:underline transition-colors inline-flex items-center gap-1.5"
                    style={{ color: "#059669" }}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Upload a screenshot instead
                  </button>
                </div>
              )}

              {/* Live duplicate warning */}
              <AnimatePresence>
                {liveDuplicates.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <div
                      className="rounded-2xl p-4"
                      style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" style={{ color: "#d97706" }} />
                        <span className="text-sm font-semibold" style={{ color: "#92400e" }}>
                          Possible duplicates found
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {liveDuplicates.map((m) => (
                          <div key={m.id} className="flex items-center gap-2 text-sm" style={{ color: "#a16207" }}>
                            <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: "#d97706" }} />
                            <span className="truncate">{m.title}</span>
                            <span className="text-xs shrink-0" style={{ color: "#ca8a04" }}>({m.reason})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Store */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Store <span style={{ color: "#f87171" }}>*</span></label>

                  {isNewStore ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 flex items-center gap-2 rounded-xl px-4 py-3"
                          style={{ border: "1px solid #a7f3d0", backgroundColor: "#ecfdf5" }}
                        >
                          <Plus className="w-4 h-4" style={{ color: "#059669" }} />
                          <span className="text-sm font-medium" style={{ color: "#065f46" }}>
                            New store: {storeSearch}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewStore(false);
                            setNewStoreDomain("");
                            setStoreSearch("");
                          }}
                          className="text-sm px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Store Domain</label>
                        <input
                          type="text"
                          value={newStoreDomain}
                          onChange={(e) => {
                            setNewStoreDomain(e.target.value);
                            if (errors.storeDomain) setErrors((prev) => { const next = { ...prev }; delete next.storeDomain; return next; });
                          }}
                          placeholder="e.g., example.com"
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                        />
                        {errors.storeDomain && <p className="mt-1.5 text-sm flex items-center gap-1" style={{ color: "#ef4444" }}><AlertCircle className="w-3.5 h-3.5" />{errors.storeDomain}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div
                        className="w-full flex items-center gap-2 rounded-xl border px-4 py-3 cursor-pointer transition-all"
                        style={{
                          borderColor: storeDropdownOpen ? "#10b981" : errors.store ? "#fca5a5" : "#e5e7eb",
                          boxShadow: storeDropdownOpen ? "0 0 0 1px #10b981" : "none",
                        }}
                        onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
                      >
                        <Search className="w-4 h-4 text-gray-400 shrink-0" />
                        {storeDropdownOpen ? (
                          <input
                            type="text" value={storeSearch} onChange={(e) => setStoreSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()} placeholder="Search stores..."
                            className="flex-1 outline-none text-sm bg-transparent" autoFocus
                          />
                        ) : (
                          <span className={`flex-1 text-sm ${selectedStore ? "text-gray-900" : "text-gray-400"}`}>
                            {selectedStore ? selectedStore.name : "Select a store"}
                          </span>
                        )}
                        <ChevronDown
                          className="w-4 h-4 text-gray-400 shrink-0 transition-transform"
                          style={{ transform: storeDropdownOpen ? "rotate(180deg)" : "none" }}
                        />
                      </div>
                      <AnimatePresence>
                        {storeDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-52 overflow-y-auto"
                          >
                            {filteredStores.length > 0 ? (
                              filteredStores.map((s) => (
                                <button
                                  key={s.id} type="button"
                                  onClick={() => {
                                    setStoreId(s.id); setStoreSearch(""); setStoreDropdownOpen(false);
                                    if (errors.store) setErrors((prev) => { const next = { ...prev }; delete next.store; return next; });
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between"
                                  style={{
                                    backgroundColor: s.id === storeId ? "#ecfdf5" : undefined,
                                    color: s.id === storeId ? "#047857" : "#374151",
                                    fontWeight: s.id === storeId ? 500 : undefined,
                                  }}
                                >
                                  <span>{s.name}</span>
                                  <span className="text-xs text-gray-400">{s.domain}</span>
                                </button>
                              ))
                            ) : storeSearch.trim() ? (
                              <div className="p-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsNewStore(true);
                                    setStoreDropdownOpen(false);
                                    setStoreId("");
                                    if (errors.store) setErrors((prev) => { const next = { ...prev }; delete next.store; return next; });
                                  }}
                                  className="w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center gap-2 transition-colors"
                                  style={{ backgroundColor: "#ecfdf5", color: "#059669" }}
                                >
                                  <Plus className="w-4 h-4" />
                                  <span className="font-medium">Add &quot;{storeSearch}&quot; as a new store</span>
                                </button>
                              </div>
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-400">No stores found</div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  {errors.store && <p className="mt-1.5 text-sm flex items-center gap-1" style={{ color: "#ef4444" }}><AlertCircle className="w-3.5 h-3.5" />{errors.store}</p>}
                </motion.div>

                {/* Deal URL */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Deal URL <span style={{ color: "#f87171" }}>*</span></label>
                  <input
                    type="text" value={dealUrl}
                    onChange={(e) => { setDealUrl(e.target.value); if (errors.dealUrl) setErrors((prev) => { const next = { ...prev }; delete next.dealUrl; return next; }); }}
                    placeholder="https://example.com/deal"
                    className="w-full rounded-xl border px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                    style={{ borderColor: errors.dealUrl ? "#fca5a5" : "#e5e7eb" }}
                  />
                  {errors.dealUrl && <p className="mt-1.5 text-sm flex items-center gap-1" style={{ color: "#ef4444" }}><AlertCircle className="w-3.5 h-3.5" />{errors.dealUrl}</p>}
                </motion.div>

                {/* Promo Code */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Promo Code <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="e.g., SAVE20"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-mono tracking-wider focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </motion.div>

                {/* Savings Type + Amount */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Savings Type <span style={{ color: "#f87171" }}>*</span></label>
                      <select
                        value={savingsType}
                        onChange={(e) => { setSavingsType(e.target.value as DealType | ""); if (errors.savingsType) setErrors((prev) => { const next = { ...prev }; delete next.savingsType; return next; }); }}
                        className="w-full rounded-xl border px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all appearance-none bg-white"
                        style={{
                          borderColor: errors.savingsType ? "#fca5a5" : "#e5e7eb",
                          color: !savingsType ? "#9ca3af" : "#111827",
                        }}
                      >
                        <option value="">Select type</option>
                        {savingsTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      {errors.savingsType && <p className="mt-1.5 text-sm flex items-center gap-1" style={{ color: "#ef4444" }}><AlertCircle className="w-3.5 h-3.5" />{errors.savingsType}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Savings Amount <span style={{ color: "#f87171" }}>*</span></label>
                      <input
                        type="text" value={savingsAmount}
                        onChange={(e) => { setSavingsAmount(e.target.value); if (errors.savingsAmount) setErrors((prev) => { const next = { ...prev }; delete next.savingsAmount; return next; }); }}
                        placeholder='e.g., "50% OFF", "$30 OFF"'
                        className="w-full rounded-xl border px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                        style={{ borderColor: errors.savingsAmount ? "#fca5a5" : "#e5e7eb" }}
                      />
                      {errors.savingsAmount && <p className="mt-1.5 text-sm flex items-center gap-1" style={{ color: "#ef4444" }}><AlertCircle className="w-3.5 h-3.5" />{errors.savingsAmount}</p>}
                    </div>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Deal Title <span style={{ color: "#f87171" }}>*</span></label>
                  <input
                    type="text" value={title}
                    onChange={(e) => { if (e.target.value.length <= 100) setTitle(e.target.value); if (errors.title) setErrors((prev) => { const next = { ...prev }; delete next.title; return next; }); }}
                    placeholder="e.g., 40% Off Select Electronics"
                    className="w-full rounded-xl border px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                    style={{ borderColor: errors.title ? "#fca5a5" : "#e5e7eb" }}
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    {errors.title ? <p className="text-sm flex items-center gap-1" style={{ color: "#ef4444" }}><AlertCircle className="w-3.5 h-3.5" />{errors.title}</p> : <span />}
                    <span className="text-xs" style={{ color: title.length > 90 ? "#f97316" : "#9ca3af" }}>{title.length}/100</span>
                  </div>
                </motion.div>

                {/* Description */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description <span style={{ color: "#f87171" }}>*</span></label>
                  <textarea
                    value={description}
                    onChange={(e) => { if (e.target.value.length <= 500) setDescription(e.target.value); if (errors.description) setErrors((prev) => { const next = { ...prev }; delete next.description; return next; }); }}
                    rows={3} placeholder="Describe the deal, what's included, any tips..."
                    className="w-full rounded-xl border px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none"
                    style={{ borderColor: errors.description ? "#fca5a5" : "#e5e7eb" }}
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    {errors.description ? <p className="text-sm flex items-center gap-1" style={{ color: "#ef4444" }}><AlertCircle className="w-3.5 h-3.5" />{errors.description}</p> : <span />}
                    <span className="text-xs" style={{ color: description.length > 450 ? "#f97316" : "#9ca3af" }}>{description.length}/500</span>
                  </div>
                </motion.div>

                {/* Category */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category <span style={{ color: "#f87171" }}>*</span></label>
                  <select
                    value={categoryId}
                    onChange={(e) => { setCategoryId(e.target.value); if (errors.category) setErrors((prev) => { const next = { ...prev }; delete next.category; return next; }); }}
                    className="w-full rounded-xl border px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all appearance-none bg-white"
                    style={{
                      borderColor: errors.category ? "#fca5a5" : "#e5e7eb",
                      color: !categoryId ? "#9ca3af" : "#111827",
                    }}
                  >
                    <option value="">Select a category</option>
                    {categoriesList.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                  {errors.category && <p className="mt-1.5 text-sm flex items-center gap-1" style={{ color: "#ef4444" }}><AlertCircle className="w-3.5 h-3.5" />{errors.category}</p>}
                </motion.div>

                {/* Conditions */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.45 }} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Conditions <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    value={conditions} onChange={(e) => setConditions(e.target.value)}
                    rows={2} placeholder="e.g., New customers only. Minimum order $50."
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none"
                  />
                </motion.div>

                {/* Expiration Date */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expiration Date <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </motion.div>

                {/* Submit Button - Multi-phase */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.55 }}>
                  <button
                    type="submit"
                    disabled={submitPhase !== "idle"}
                    className="w-full rounded-xl py-3.5 font-semibold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{
                      backgroundColor: submitPhase !== "idle" ? "#6ee7b7" : "#059669",
                      color: "#fff",
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {submitPhase === "idle" && (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Send className="w-5 h-5" />
                          Submit Deal
                        </motion.span>
                      )}
                      {submitPhase === "checking_duplicates" && (
                        <motion.span
                          key="checking"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Checking for duplicates...
                        </motion.span>
                      )}
                      {submitPhase === "analyzing" && (
                        <motion.span
                          key="analyzing"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Sparkles className="w-5 h-5 animate-pulse" />
                          AI analyzing...
                        </motion.span>
                      )}
                      {submitPhase === "creating" && (
                        <motion.span
                          key="creating"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Publishing deal...
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-3">
                    By submitting, you agree to our community guidelines. Deals are reviewed by AI before publishing.
                  </p>
                </motion.div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* AI Watcher Badge - floating pill */}
      <div
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg"
        style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: "#10b981" }}
          />
          <span
            className="relative inline-flex rounded-full h-2.5 w-2.5"
            style={{ backgroundColor: "#10b981" }}
          />
        </span>
        <span className="text-xs font-medium text-gray-500">
          {extracting ? "AI extracting..." : checkingDuplicates ? "Checking..." : "AI monitoring"}
        </span>
      </div>
    </main>
  );
}
