"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useAllStores, useAllCategories } from "@/hooks/useFirestore";

const footerLinks = {
  resources: [
    { label: "All Deals", href: "/deals" },
    { label: "All Stores", href: "/stores" },
    { label: "Categories", href: "/categories" },
    { label: "Submit a Deal", href: "/submit" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

const socialLinks = [
  { label: "Twitter / X", href: "https://twitter.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "TikTok", href: "https://tiktok.com" },
  { label: "Reddit", href: "https://reddit.com" },
];

export default function Footer() {
  const { data: storesData } = useAllStores();
  const { data: categoriesData } = useAllCategories();

  const categories = categoriesData ?? [];
  const topFooterStores = [...(storesData ?? [])]
    .sort((a, b) => b.activeDeals - a.activeDeals)
    .slice(0, 8);

  return (
    <footer className="bg-gray-900 text-white rounded-t-3xl mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        {/* ── Top section: Brand + grid ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-baseline">
              <span className="text-xl font-black text-white tracking-tight">
                Legit
              </span>
              <span className="text-xl font-black text-emerald-400">.</span>
              <span className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent tracking-tight">
                Discount
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed max-w-xs">
              Every deal AI-verified, community-validated. Real savings you can
              trust.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">
                Powered by AI
              </span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Categories
            </h3>
            <ul className="space-y-2.5">
              {categories.slice(0, 8).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    <span className="mr-1.5">{cat.icon}</span>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Stores */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Popular Stores
            </h3>
            <ul className="space-y-2.5">
              {topFooterStores.map((store) => (
                <li key={store.id}>
                  <Link
                    href={`/stores/${store.slug}`}
                    className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    {store.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Divider ────────────────────────────────────────── */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors duration-200"
                >
                  {social.label}
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Legit.Discount. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
