import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import DealsListingContent from "./DealsListingContent";

export const metadata: Metadata = {
  title: "All Deals, Coupons & Promo Codes",
  description:
    "Browse all verified deals, coupon codes, and promo codes. Sorted by popularity, newest, expiring soon, and more. AI-verified and community-tested.",
  alternates: { canonical: "https://legit.discount/deals" },
};

export default function DealsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-2">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] mb-6">
          <Link href="/" className="hover:text-[var(--brand)] transition-colors">Home</Link>
          <svg width="12" height="12" viewBox="0 0 12 12" className="text-[var(--text-faint)]"><path d="M4.5 2.5L7.5 6L4.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="text-[var(--text-primary)] font-medium">All Deals</span>
        </nav>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-editorial italic text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight mb-2">
            All Deals
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)] max-w-lg">
            Every verified deal, promo code, and coupon — all in one place.
          </p>
        </div>
      </div>

      <Suspense>
        <DealsListingContent />
      </Suspense>
    </main>
  );
}
