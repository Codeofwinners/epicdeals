import type { Metadata } from "next";
import Link from "next/link";
import CategoriesListingContent from "./CategoriesListingContent";

export const metadata: Metadata = {
  title: "All Categories — Deals & Promo Codes by Category",
  description:
    "Browse deals by category: Electronics, Fashion, Food, Travel, Beauty, Home, Software, Gaming, Sports, and more. AI-verified savings.",
  alternates: { canonical: "https://legit.discount/categories" },
};

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-gray-50 pt-4">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
          <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Categories</span>
        </nav>
        <h1 className="text-3xl font-black text-gray-900 mb-2">All Categories</h1>
        <p className="text-sm text-gray-500 mb-6">
          Browse deals across every category.
        </p>
      </div>

      <CategoriesListingContent />
    </main>
  );
}
