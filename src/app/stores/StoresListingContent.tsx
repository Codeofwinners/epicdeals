"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, Star } from "lucide-react";
import { useAllStores } from "@/hooks/useFirestore";

export default function StoresListingContent() {
  const { data: storesData, loading } = useAllStores();

  const stores = [...(storesData ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-5 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 pb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {stores.map((store, i) => (
          <motion.div
            key={store.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.02 }}
          >
            <Link
              href={`/stores/${store.slug}`}
              className="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  {store.name}
                </h2>
                {store.isFeatured && (
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  {store.domain}
                  <ExternalLink className="w-3 h-3" />
                </span>
                <span className="text-sm font-semibold text-emerald-600">
                  {store.activeDeals} deals
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
