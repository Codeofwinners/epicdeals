"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Star,
  SlidersHorizontal,
} from "lucide-react";
import { useStoreDeals } from "@/hooks/useFirestore";
import { DealCard } from "@/components/deals/DealCard";
import { DealGridSkeleton } from "@/components/ui/Skeleton";
import type { Store, DiscountType } from "@/types/deals";

type FilterType = "all" | "code" | "deal" | "sale";
type SortType = "trending" | "newest" | "popular" | "confirmed" | "savings";

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "code", label: "Codes" },
  { value: "deal", label: "Deals" },
  { value: "sale", label: "Sales" },
];

const sortOptions: { value: SortType; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "confirmed", label: "Most Confirmed" },
  { value: "savings", label: "Biggest Savings" },
];

export default function StorePageContent({ store }: { store: Store }) {
  const { data: allDeals, loading: dealsLoading } = useStoreDeals(store.slug);

  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("trending");

  const filteredAndSorted = useMemo(() => {
    let result = [...(allDeals ?? [])];

    if (filter !== "all") {
      result = result.filter((d) => d.discountType === (filter as DiscountType));
    }

    switch (sort) {
      case "trending":
        result.sort((a, b) => b.usedLastHour - a.usedLastHour);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "popular":
        result.sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes));
        break;
      case "confirmed":
        result.sort((a, b) => b.workedYes - a.workedYes);
        break;
      case "savings":
        result.sort((a, b) => b.savingsValue - a.savingsValue);
        break;
    }

    return result;
  }, [allDeals, filter, sort]);

  return (
    <div>
      {/* Store Header */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto px-4 pb-6"
      >
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-gray-900">{store.name}</h1>
                {store.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-semibold rounded-lg border border-amber-100">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    Featured
                  </span>
                )}
              </div>
              <a
                href={`https://${store.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-500 transition-colors"
              >
                {store.domain}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-emerald-500">{filteredAndSorted.length}</div>
              <div className="text-sm text-gray-400 font-medium">Active Deals</div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Filter / Sort Toolbar */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="max-w-7xl mx-auto px-4 pb-6"
      >
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      filter === opt.value
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="hidden sm:block w-px h-6 bg-gray-200" />
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    sort === opt.value
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Deal Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        {dealsLoading ? (
          <DealGridSkeleton count={8} />
        ) : filteredAndSorted.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndSorted.map((deal, i) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <DealCard deal={deal} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500 font-medium">No deals match your current filters.</p>
            <button
              onClick={() => { setFilter("all"); setSort("trending"); }}
              className="mt-3 text-sm text-emerald-500 hover:text-emerald-600 font-semibold transition-colors"
            >
              Clear all filters
            </button>
          </motion.div>
        )}
      </section>
    </div>
  );
}
