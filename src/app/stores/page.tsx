import type { Metadata } from "next";
import Link from "next/link";
import StoresListingContent from "./StoresListingContent";

export const metadata: Metadata = {
  title: "All Stores — Coupons & Promo Codes",
  description:
    "Browse coupon codes and deals for every store. Find verified promo codes from Amazon, Nike, Target, and hundreds more.",
  alternates: { canonical: "https://legit.discount/stores" },
};

export default function StoresPage() {
  return (
    <main className="min-h-screen bg-gray-50 pt-4">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
          <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Stores</span>
        </nav>
        <h1 className="text-3xl font-black text-gray-900 mb-2">All Stores</h1>
        <p className="text-sm text-gray-500 mb-6">
          Browse deals and promo codes from every store, A to Z.
        </p>
      </div>

      <StoresListingContent />
    </main>
  );
}
