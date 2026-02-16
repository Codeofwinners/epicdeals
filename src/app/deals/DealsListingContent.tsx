"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  TrendingUp,
  Sparkles,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  ArrowUpRight,
  Zap,
  ExternalLink,
} from "lucide-react";
import {
  useHotDeals,
  usePopularDeals,
  useNewDeals,
  useExpiringSoon,
  useMostConfirmed,
} from "@/hooks/useFirestore";
import { DealBadge } from "@/components/ui/DealBadge";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { DealGridSkeleton } from "@/components/ui/Skeleton";
import type { Deal } from "@/types/deals";

type SortType = "hot" | "popular" | "new" | "expiring" | "confirmed";

const sortOptions: { value: SortType; label: string; icon: React.ReactNode }[] = [
  { value: "hot", label: "Hot", icon: <Flame className="w-3.5 h-3.5" /> },
  { value: "popular", label: "Popular", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { value: "new", label: "Newest", icon: <Sparkles className="w-3.5 h-3.5" /> },
  { value: "expiring", label: "Expiring Soon", icon: <Clock className="w-3.5 h-3.5" /> },
  { value: "confirmed", label: "Most Confirmed", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
];

/* ── Featured Deal Hero ─────────────────────────────────────────── */
function FeaturedDealHero({ deal }: { deal: Deal }) {
  const [copied, setCopied] = useState(false);

  const total = deal.workedYes + deal.workedNo;
  const trustPct = total > 0 ? Math.round((deal.workedYes / total) * 100) : 0;

  const copyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deal.code) {
      navigator.clipboard.writeText(deal.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-6"
    >
      <Link
        href={`/deals/${deal.slug}`}
        className="group block bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] hover:border-[var(--border)] shadow-[0_2px_12px_rgba(26,24,20,0.06)] hover:shadow-[0_20px_60px_rgba(27,115,64,0.08)] transition-all duration-300 overflow-hidden"
      >
        <div className="p-6 md:p-8 lg:p-10">
          {/* Store + badges row */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-xs font-bold text-[var(--text-faint)] uppercase tracking-[0.15em]">
              {deal.store.name}
            </span>
            <div className="flex gap-1.5">
              {deal.isVerified && <DealBadge type="verified" />}
              {deal.isTrending && <DealBadge type="trending" />}
              {deal.source === "ai_discovered" && <DealBadge type="ai_found" />}
            </div>
          </div>

          {/* Savings — huge editorial serif */}
          <div className="mb-3">
            <span className="font-editorial italic text-5xl sm:text-6xl md:text-7xl font-black text-savings leading-none tracking-tight">
              {deal.savingsAmount}
            </span>
          </div>

          {/* Title + description */}
          <h2 className="text-lg md:text-xl font-semibold text-[var(--text-primary)] mb-2 max-w-2xl group-hover:text-[var(--brand)] transition-colors">
            {deal.title}
          </h2>
          {deal.description && (
            <p className="text-sm text-[var(--text-secondary)] mb-5 max-w-2xl line-clamp-2 leading-relaxed">
              {deal.description}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-6 flex-wrap text-xs">
            {total > 0 && (
              <span className={`font-bold tabular-nums ${trustPct >= 80 ? "text-emerald-600" : trustPct >= 60 ? "text-amber-600" : "text-rose-500"}`}>
                {trustPct}% trust
              </span>
            )}
            {deal.usedLastHour > 10 && (
              <span className="flex items-center gap-1 text-[var(--brand)] font-medium">
                <Zap className="w-3 h-3" /> {deal.usedLastHour} used recently
              </span>
            )}
            {deal.expiresAt && (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <Clock className="w-3 h-3" />
                <CountdownTimer expiresAt={deal.expiresAt} compact />
              </span>
            )}
          </div>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row gap-3" onClick={(e) => e.preventDefault()}>
            {deal.code ? (
              <button
                onClick={copyCode}
                className={`flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 sm:min-w-[240px] ${
                  copied
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-[var(--text-primary)] text-white hover:shadow-lg hover:shadow-black/10"
                }`}
              >
                <span className={`font-mono tracking-[0.2em] ${copied ? "text-emerald-100" : "text-[var(--brand-light)]"}`}>
                  {deal.code}
                </span>
                {copied ? (
                  <span className="flex items-center gap-1.5"><Check className="w-4 h-4 animate-check-pop" /> Copied</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-stone-400"><Copy className="w-4 h-4" /> Copy</span>
                )}
              </button>
            ) : null}
            <a
              href={deal.dealUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white rounded-xl text-sm font-bold transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Shop at {deal.store.name}
              <ExternalLink className="w-4 h-4 opacity-70" />
            </a>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Deal Feed Item (list row) ──────────────────────────────────── */
function DealFeedItem({ deal, index }: { deal: Deal; index: number }) {
  const [copied, setCopied] = useState(false);

  const total = deal.workedYes + deal.workedNo;
  const trustPct = total > 0 ? Math.round((deal.workedYes / total) * 100) : 0;

  const copyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deal.code) {
      navigator.clipboard.writeText(deal.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link
        href={`/deals/${deal.slug}`}
        className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 px-4 py-4 sm:px-5 sm:py-4 hover:bg-[var(--surface-sunken)] transition-all duration-200 border-b border-[var(--border-light)] last:border-b-0"
      >
        {/* Savings column */}
        <div className="flex sm:flex-col items-baseline sm:items-center gap-2 sm:gap-0.5 shrink-0 sm:w-28">
          <span className="font-editorial italic text-xl sm:text-2xl font-black text-savings leading-none">
            {deal.savingsAmount}
          </span>
          <span className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-[0.12em]">
            {deal.store.name}
          </span>
        </div>

        {/* Info column */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--brand)] transition-colors">
            {deal.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {deal.isVerified && <DealBadge type="verified" />}
            {deal.isTrending && <DealBadge type="trending" />}
            {deal.source === "ai_discovered" && <DealBadge type="ai_found" />}
            {total > 0 && (
              <span className={`text-[10px] font-bold tabular-nums ${
                trustPct >= 80 ? "text-emerald-600" : trustPct >= 60 ? "text-amber-600" : trustPct >= 1 ? "text-rose-500" : "text-[var(--text-faint)]"
              }`}>
                {trustPct}% trust
              </span>
            )}
            {deal.expiresAt && (
              <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                <Clock className="w-3 h-3" />
                <CountdownTimer expiresAt={deal.expiresAt} compact />
              </span>
            )}
            {deal.usedLastHour > 10 && (
              <span className="flex items-center gap-1 text-[10px] text-[var(--brand)] font-medium">
                <Zap className="w-2.5 h-2.5" /> {deal.usedLastHour} recent
              </span>
            )}
          </div>
        </div>

        {/* CTA column */}
        <div className="shrink-0 mt-1 sm:mt-0" onClick={(e) => e.preventDefault()}>
          {deal.code ? (
            <button
              onClick={copyCode}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                copied
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                  : "bg-[var(--text-primary)] text-white hover:shadow-md hover:shadow-black/10"
              }`}
            >
              {copied ? (
                <><Check className="w-3 h-3 animate-check-pop" /> Copied</>
              ) : (
                <>
                  <span className="font-mono tracking-wider text-[var(--brand-light)]">{deal.code}</span>
                  <Copy className="w-3 h-3 text-stone-400" />
                </>
              )}
            </button>
          ) : (
            <span className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand)] text-white rounded-lg text-xs font-semibold">
              Get Deal <ArrowUpRight className="w-3 h-3 opacity-70" />
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Main Listing ───────────────────────────────────────────────── */
export default function DealsListingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialSort = (searchParams.get("sort") as SortType) || "hot";
  const [sort, setSort] = useState<SortType>(initialSort);

  const handleSort = useCallback((newSort: SortType) => {
    setSort(newSort);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const { data: hotDeals, loading: hotLoading } = useHotDeals(50);
  const { data: popularDeals, loading: popularLoading } = usePopularDeals(50);
  const { data: newDeals, loading: newLoading } = useNewDeals(50);
  const { data: expiringDeals, loading: expiringLoading } = useExpiringSoon(50);
  const { data: confirmedDeals, loading: confirmedLoading } = useMostConfirmed(50);

  const deals = useMemo(() => {
    switch (sort) {
      case "hot": return hotDeals ?? [];
      case "popular": return popularDeals ?? [];
      case "new": return newDeals ?? [];
      case "expiring": return expiringDeals ?? [];
      case "confirmed": return confirmedDeals ?? [];
    }
  }, [sort, hotDeals, popularDeals, newDeals, expiringDeals, confirmedDeals]);

  const loading = sort === "hot" ? hotLoading
    : sort === "popular" ? popularLoading
    : sort === "new" ? newLoading
    : sort === "expiring" ? expiringLoading
    : confirmedLoading;

  const featuredDeal = deals[0] ?? null;
  const feedDeals = deals.slice(1);

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Sort Toolbar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-6">
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSort(opt.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              sort === opt.value
                ? "bg-[var(--text-primary)] text-white shadow-md shadow-black/8"
                : "bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--text-faint)] hover:shadow-sm"
            }`}
          >
            <span className={sort === opt.value ? "text-[var(--brand-light)]" : "text-[var(--text-muted)]"}>{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <DealGridSkeleton count={12} />
      ) : deals.length > 0 ? (
        <>
          {/* Featured hero */}
          {featuredDeal && <FeaturedDealHero deal={featuredDeal} />}

          {/* Deal feed */}
          {feedDeals.length > 0 && (
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] shadow-[0_1px_4px_rgba(26,24,20,0.04)] overflow-hidden mb-16">
              {feedDeals.map((deal, i) => (
                <DealFeedItem key={deal.id} deal={deal} index={i} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--surface-sunken)] flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-[var(--text-faint)]" />
          </div>
          <p className="text-[var(--text-primary)] font-semibold text-lg mb-1">No deals found</p>
          <p className="text-[var(--text-muted)] text-sm">Try a different filter or check back later.</p>
        </div>
      )}
    </div>
  );
}
