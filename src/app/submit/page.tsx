"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { signInWithGoogle } from "@/lib/auth";
import { useAllStores, useAllCategories } from "@/hooks/useFirestore";
import { submitDeal } from "@/lib/firestore";
import type { DealType, DiscountType } from "@/types/deals";

const savingsTypes: { value: DealType; label: string }[] = [
  { value: "percent_off", label: "Percent Off" },
  { value: "dollar_off", label: "Dollar Off" },
  { value: "bogo", label: "BOGO" },
  { value: "free_shipping", label: "Free Shipping" },
  { value: "free_trial", label: "Free Trial" },
  { value: "cashback", label: "Cashback" },
];

interface FormErrors {
  store?: string;
  dealUrl?: string;
  savingsType?: string;
  savingsAmount?: string;
  title?: string;
  description?: string;
  category?: string;
}

export default function SubmitDealPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: stores } = useAllStores();
  const { data: categories } = useAllCategories();

  // Form state
  const [storeId, setStoreId] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
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
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!storeId) newErrors.store = "Please select a store.";
    if (!dealUrl.trim()) {
      newErrors.dealUrl = "Deal URL is required.";
    } else {
      try { new URL(dealUrl); } catch { newErrors.dealUrl = "Please enter a valid URL (e.g., https://example.com)."; }
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
    if (!selectedStore) return;

    const selectedCategory = categoriesList.find((c) => c.id === categoryId);
    if (!selectedCategory) return;

    setSubmitting(true);
    try {
      const discountType: DiscountType = promoCode ? "code" : "deal";

      await submitDeal({
        title,
        description,
        code: promoCode || undefined,
        store: selectedStore,
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
        tags: [selectedCategory.slug, selectedStore.slug],
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Submit failed:", err);
    }
    setSubmitting(false);
  }

  // Confetti particles for success animation
  const confettiColors = [
    "#10B981", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#EF4444", "#06B6D4", "#84CC16",
  ];

  // Auth gate: require sign-in
  if (!authLoading && !user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <nav className="fixed top-0 w-full h-14 border-b border-gray-100 bg-white z-50">
          <div className="max-w-7xl mx-auto h-full px-4 flex items-center">
            <Link href="/" className="flex items-baseline leading-none">
              <span className="font-black text-xl text-slate-900 tracking-tighter">Legit</span>
              <span className="font-black text-xl text-emerald-500 tracking-tighter">.</span>
              <span className="font-black text-xl bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent tracking-tighter">Discount</span>
            </Link>
          </div>
        </nav>
        <div className="pt-14 flex items-center justify-center min-h-[calc(100vh-56px)] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3">Sign in to submit deals</h1>
            <p className="text-gray-500 mb-8">
              Sign in with your Google account to submit deals and help the community save.
            </p>
            <button
              onClick={() => signInWithGoogle()}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign in with Google
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gray-50">
        <nav className="fixed top-0 w-full h-14 border-b border-gray-100 bg-white z-50">
          <div className="max-w-7xl mx-auto h-full px-4 flex items-center">
            <Link href="/" className="flex items-baseline leading-none">
              <span className="font-black text-xl text-slate-900 tracking-tighter">Legit</span>
              <span className="font-black text-xl text-emerald-500 tracking-tighter">.</span>
              <span className="font-black text-xl bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent tracking-tighter">Discount</span>
            </Link>
          </div>
        </nav>
        <div className="pt-14 flex items-center justify-center min-h-[calc(100vh-56px)] px-4">
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
                className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </motion.div>
              <h1 className="text-2xl font-black text-gray-900 mb-3">Deal Submitted!</h1>
              <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                Your deal has been submitted! Our AI will review and publish it within minutes.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/" className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors">
                  Back to Deals
                </Link>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setStoreId(""); setStoreSearch(""); setDealUrl(""); setPromoCode("");
                    setSavingsType(""); setSavingsAmount(""); setTitle(""); setDescription("");
                    setCategoryId(""); setConditions(""); setExpirationDate(""); setErrors({});
                  }}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
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

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 w-full h-14 border-b border-gray-100 bg-white z-50">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center">
          <Link href="/" className="flex items-baseline leading-none">
            <span className="font-black text-xl text-slate-900 tracking-tighter">Legit</span>
            <span className="font-black text-xl text-emerald-500 tracking-tighter">.</span>
            <span className="font-black text-xl bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent tracking-tighter">Discount</span>
          </Link>
        </div>
      </nav>

      <div className="pt-14">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Submit a Deal</span>
          </nav>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-4 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Submit a Deal</h1>
            <p className="text-gray-500">Found a deal we&apos;re missing? Share it with the community.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-4 flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800 mb-0.5">AI-Powered Review</p>
              <p className="text-sm text-emerald-600/80 leading-relaxed">
                Our AI will automatically verify your deal, format it for the platform, and publish it if it checks out.
              </p>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Store */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Store <span className="text-red-400">*</span></label>
              <div className="relative">
                <div
                  className={`w-full flex items-center gap-2 rounded-xl border px-4 py-3 cursor-pointer transition-all ${
                    storeDropdownOpen ? "border-emerald-500 ring-1 ring-emerald-500" : errors.store ? "border-red-300" : "border-gray-200"
                  }`}
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
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${storeDropdownOpen ? "rotate-180" : ""}`} />
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
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                              s.id === storeId ? "bg-emerald-50 text-emerald-700 font-medium" : "text-gray-700"
                            }`}
                          >
                            <span>{s.name}</span>
                            <span className="text-xs text-gray-400">{s.domain}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-400">No stores found</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {errors.store && <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.store}</p>}
            </motion.div>

            {/* Deal URL */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }} className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Deal URL <span className="text-red-400">*</span></label>
              <input
                type="text" value={dealUrl}
                onChange={(e) => { setDealUrl(e.target.value); if (errors.dealUrl) setErrors((prev) => { const next = { ...prev }; delete next.dealUrl; return next; }); }}
                placeholder="https://example.com/deal"
                className={`w-full rounded-xl border px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all ${errors.dealUrl ? "border-red-300" : "border-gray-200"}`}
              />
              {errors.dealUrl && <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.dealUrl}</p>}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Savings Type <span className="text-red-400">*</span></label>
                  <select
                    value={savingsType}
                    onChange={(e) => { setSavingsType(e.target.value as DealType | ""); if (errors.savingsType) setErrors((prev) => { const next = { ...prev }; delete next.savingsType; return next; }); }}
                    className={`w-full rounded-xl border px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all appearance-none bg-white ${errors.savingsType ? "border-red-300" : "border-gray-200"} ${!savingsType ? "text-gray-400" : "text-gray-900"}`}
                  >
                    <option value="">Select type</option>
                    {savingsTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {errors.savingsType && <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.savingsType}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Savings Amount <span className="text-red-400">*</span></label>
                  <input
                    type="text" value={savingsAmount}
                    onChange={(e) => { setSavingsAmount(e.target.value); if (errors.savingsAmount) setErrors((prev) => { const next = { ...prev }; delete next.savingsAmount; return next; }); }}
                    placeholder='e.g., "50% OFF", "$30 OFF"'
                    className={`w-full rounded-xl border px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all ${errors.savingsAmount ? "border-red-300" : "border-gray-200"}`}
                  />
                  {errors.savingsAmount && <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.savingsAmount}</p>}
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Deal Title <span className="text-red-400">*</span></label>
              <input
                type="text" value={title}
                onChange={(e) => { if (e.target.value.length <= 100) setTitle(e.target.value); if (errors.title) setErrors((prev) => { const next = { ...prev }; delete next.title; return next; }); }}
                placeholder="e.g., 40% Off Select Electronics"
                className={`w-full rounded-xl border px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all ${errors.title ? "border-red-300" : "border-gray-200"}`}
              />
              <div className="flex items-center justify-between mt-1.5">
                {errors.title ? <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.title}</p> : <span />}
                <span className={`text-xs ${title.length > 90 ? "text-orange-500" : "text-gray-400"}`}>{title.length}/100</span>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }} className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description <span className="text-red-400">*</span></label>
              <textarea
                value={description}
                onChange={(e) => { if (e.target.value.length <= 500) setDescription(e.target.value); if (errors.description) setErrors((prev) => { const next = { ...prev }; delete next.description; return next; }); }}
                rows={3} placeholder="Describe the deal, what's included, any tips..."
                className={`w-full rounded-xl border px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none ${errors.description ? "border-red-300" : "border-gray-200"}`}
              />
              <div className="flex items-center justify-between mt-1.5">
                {errors.description ? <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.description}</p> : <span />}
                <span className={`text-xs ${description.length > 450 ? "text-orange-500" : "text-gray-400"}`}>{description.length}/500</span>
              </div>
            </motion.div>

            {/* Category */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }} className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category <span className="text-red-400">*</span></label>
              <select
                value={categoryId}
                onChange={(e) => { setCategoryId(e.target.value); if (errors.category) setErrors((prev) => { const next = { ...prev }; delete next.category; return next; }); }}
                className={`w-full rounded-xl border px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all appearance-none bg-white ${errors.category ? "border-red-300" : "border-gray-200"} ${!categoryId ? "text-gray-400" : "text-gray-900"}`}
              >
                <option value="">Select a category</option>
                {categoriesList.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              {errors.category && <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.category}</p>}
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

            {/* Submit */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.55 }}>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl py-3 font-semibold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                {submitting ? "Submitting..." : "Submit Deal"}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">
                By submitting, you agree to our community guidelines. Deals are reviewed before publishing.
              </p>
            </motion.div>
          </form>
        </div>
      </div>
    </main>
  );
}
