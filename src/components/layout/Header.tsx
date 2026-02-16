"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Command,
  X,
  Menu,
  TrendingUp,
  Clock,
  LayoutGrid,
  Flame,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAllStores, useAllCategories } from "@/hooks/useFirestore";
import { AuthButton } from "@/components/auth/AuthButton";
import type { Store } from "@/types/deals";

const trendingSearches = [
  "Amazon Prime Day deals",
  "Nike 40% off sitewide",
  "Best Buy laptop clearance",
  "Free shipping codes",
  "Student discounts",
];

export default function Header() {
  const { data: storesData } = useAllStores();
  const { data: categoriesData } = useAllCategories();

  const stores = storesData ?? [];
  const categories = categoriesData ?? [];

  // Top 20 stores sorted by active deals (descending)
  const topStores = [...stores]
    .sort((a, b) => b.activeDeals - a.activeDeals)
    .slice(0, 20);

  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  // ── Scroll detection ──────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Cmd+K shortcut ────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        searchInputRef.current?.blur();
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Click outside to close search dropdown ────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktop = searchContainerRef.current?.contains(target);
      const insideMobile = mobileSearchContainerRef.current?.contains(target);
      if (!insideDesktop && !insideMobile) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Lock body scroll when mobile menu is open ─────────────────
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // ── Filtered store results ────────────────────────────────────
  const filteredStores: Store[] = searchQuery.trim()
    ? stores.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  const showDropdown = isSearchFocused;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-lg border-b transition-all duration-300",
          isScrolled ? "border-gray-200 shadow-sm" : "border-gray-100"
        )}
      >
        {/* ── Main bar ─────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div
            className={cn(
              "flex items-center gap-4 transition-all duration-300",
              isScrolled ? "h-14" : "h-16"
            )}
          >
            {/* Brand */}
            <Link href="/" className="flex-shrink-0 flex items-baseline">
              <span className="text-xl font-black text-slate-900 tracking-tight">Legit</span>
              <span className="text-xl font-black text-emerald-500">.</span>
              <span className="text-xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent tracking-tight">Discount</span>
            </Link>

            {/* Search bar */}
            <div ref={searchContainerRef} className="relative flex-1 max-w-2xl hidden md:block">
              <div
                className={cn(
                  "relative flex items-center rounded-xl border bg-white transition-all duration-200",
                  isSearchFocused
                    ? "border-gray-300 shadow-md ring-1 ring-gray-200"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Search className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Search any store, brand, or deal..."
                  className={cn(
                    "w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200",
                    isScrolled ? "pl-10 pr-16 py-2" : "pl-10 pr-16 py-2.5"
                  )}
                />
                <kbd className="absolute right-3 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded border border-gray-200">
                  <Command className="w-2.5 h-2.5" />K
                </kbd>
              </div>

              {/* Search dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50"
                  >
                    {searchQuery.trim() && filteredStores.length > 0 && (
                      <div className="p-2">
                        <p className="px-2 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Stores</p>
                        {filteredStores.map((store) => (
                          <Link
                            key={store.id}
                            href={`/stores/${store.slug}`}
                            onClick={() => { setIsSearchFocused(false); setSearchQuery(""); }}
                            className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                {store.name.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{store.name}</span>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">{store.activeDeals} active deals</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {searchQuery.trim() && filteredStores.length === 0 && (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-gray-500">No stores found for &ldquo;{searchQuery}&rdquo;</p>
                        <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                      </div>
                    )}
                    {!searchQuery.trim() && (
                      <div className="p-2">
                        <p className="px-2 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Trending searches</p>
                        {trendingSearches.map((term) => (
                          <button
                            key={term}
                            onClick={() => { setSearchQuery(term); searchInputRef.current?.focus(); }}
                            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                          >
                            <Flame className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-sm text-gray-700">{term}</span>
                          </button>
                        ))}
                        <div className="mt-1 border-t border-gray-100 pt-2">
                          <p className="px-2 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Popular stores</p>
                          <div className="flex flex-wrap gap-1.5 px-2 pb-1">
                            {topStores.slice(0, 8).map((store) => (
                              <Link
                                key={store.id}
                                href={`/stores/${store.slug}`}
                                onClick={() => { setIsSearchFocused(false); setSearchQuery(""); }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                              >
                                {store.name}
                                <span className="text-gray-300">{store.activeDeals}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Nav pills */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {[
                { label: "Trending", href: "/deals?sort=hot", icon: TrendingUp },
                { label: "Expiring Soon", href: "/deals?sort=expiring", icon: Clock },
                { label: "Categories", href: "/categories", icon: LayoutGrid },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Auth Button */}
            <div className="hidden lg:block">
              <AuthButton />
            </div>

            {/* Mobile search + hamburger */}
            <div className="flex items-center gap-2 md:hidden ml-auto">
              <button
                onClick={() => mobileSearchInputRef.current?.focus()}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Desktop CTA */}
            <Link
              href="/submit"
              className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all duration-200"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Submit Deal
            </Link>
          </div>
        </div>

        {/* ── Popular retailers row ─────────────────────────────── */}
        <AnimatePresence>
          {!isScrolled && (
            <motion.div
              initial={false}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-50 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center gap-3 py-2 overflow-x-auto no-scrollbar">
                  <span className="flex-shrink-0 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Top stores
                  </span>
                  <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
                  {topStores.map((store) => (
                    <Link
                      key={store.id}
                      href={`/stores/${store.slug}`}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-gray-150 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all duration-200 whitespace-nowrap"
                    >
                      {store.name}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mobile search bar ──────────────────────────────────── */}
        <div className="md:hidden border-t border-gray-50 px-4 pb-2 pt-1">
          <div ref={mobileSearchContainerRef} className="relative">
            <div
              className={cn(
                "relative flex items-center rounded-xl border bg-white transition-all duration-200",
                isSearchFocused ? "border-gray-300 shadow-md ring-1 ring-gray-200" : "border-gray-200"
              )}
            >
              <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search stores, brands, deals..."
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none pl-9 pr-4 py-2"
              />
            </div>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
                >
                  {searchQuery.trim() && filteredStores.length > 0 && (
                    <div className="p-2">
                      {filteredStores.map((store) => (
                        <Link
                          key={store.id}
                          href={`/stores/${store.slug}`}
                          onClick={() => { setIsSearchFocused(false); setSearchQuery(""); }}
                          className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-900">{store.name}</span>
                          <span className="text-xs text-gray-400">{store.activeDeals} deals</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchQuery.trim() && filteredStores.length === 0 && (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-gray-500">No results</p>
                    </div>
                  )}
                  {!searchQuery.trim() && (
                    <div className="p-2">
                      <p className="px-2 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Trending</p>
                      {trendingSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => setSearchQuery(term)}
                          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          <span className="text-sm text-gray-700">{term}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Mobile slide-out drawer ──────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-white z-[70] shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-baseline">
                  <span className="text-lg font-black text-slate-900">Legit</span>
                  <span className="text-lg font-black text-emerald-500">.</span>
                  <span className="text-lg font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Discount</span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Auth in mobile */}
              <div className="px-5 py-3 border-b border-gray-100">
                <AuthButton />
              </div>

              <div className="px-4 py-3 space-y-0.5">
                {[
                  { label: "Trending", href: "/deals?sort=hot", icon: TrendingUp, desc: "Hottest deals right now" },
                  { label: "Expiring Soon", href: "/deals?sort=expiring", icon: Clock, desc: "Grab them before they're gone" },
                  { label: "Categories", href: "/categories", icon: LayoutGrid, desc: "Browse by category" },
                  { label: "Submit a Deal", href: "/submit", icon: Sparkles, desc: "Share what you found" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                      <item.icon className="w-4.5 h-4.5 text-gray-500 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 ml-auto" />
                  </Link>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-gray-100">
                <p className="px-3 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Categories</p>
                <div className="space-y-0.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{cat.icon}</span>
                        <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">{cat.dealCount}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="px-4 py-3 border-t border-gray-100">
                <p className="px-3 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Popular stores</p>
                <div className="flex flex-wrap gap-1.5 px-3">
                  {topStores.slice(0, 12).map((store) => (
                    <Link
                      key={store.id}
                      href={`/stores/${store.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      {store.name}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
