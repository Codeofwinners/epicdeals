"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAllCategories } from "@/hooks/useFirestore";

export default function CategoriesListingContent() {
  const { data: categoriesData, loading } = useAllCategories();

  const categories = categoriesData ?? [];

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-xl mb-3" />
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
          >
            <Link
              href={`/categories/${cat.slug}`}
              className="block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: cat.color }} />
              <span className="text-3xl mb-3 block">{cat.icon}</span>
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mb-1">
                {cat.name}
              </h2>
              <span className="text-sm text-gray-400 font-medium">
                {cat.dealCount} deals
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
