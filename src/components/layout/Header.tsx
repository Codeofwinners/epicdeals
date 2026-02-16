"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthButton } from "@/components/auth/AuthButton";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

        .nav-brand {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          letter-spacing: -0.025em;
        }

        .nav-accent {
          background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-tab {
          position: relative;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          letter-spacing: -0.01em;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .nav-tab::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #0EA5E9 0%, #06B6D4 100%);
          transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .nav-tab.active::after,
        .nav-tab:hover::after {
          width: 100%;
        }

        .nav-tab:hover {
          transform: translateY(-2px);
          color: #0EA5E9;
        }

        .search-container {
          position: relative;
          transition: all 0.3s ease;
        }

        .search-container:focus-within {
          transform: translateY(-1px);
        }

        .search-input {
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
        }

        .search-input:focus {
          background: linear-gradient(135deg, #ffffff 0%, #ffffff 100%);
          box-shadow: 0 8px 24px rgba(14, 165, 233, 0.12);
        }

        .sort-btn {
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          transition: all 0.25s ease;
        }

        .sort-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .sort-btn.active {
          background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
          color: white;
          box-shadow: 0 6px 16px rgba(14, 165, 233, 0.2);
        }
      `}</style>

      {/* DESKTOP HEADER */}
      <header className="hidden md:block sticky top-0 z-50 bg-white border-b border-gray-200/40 backdrop-blur-md">
        <div className="px-8 py-5">
          {/* Top row: Logo + Search + Actions */}
          <div className="flex items-center justify-between gap-8 mb-8">
            {/* Brand */}
            <Link href="/" className="flex flex-col gap-1.5 flex-shrink-0 hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-3">
                <div className="nav-brand text-4xl leading-none">
                  <span className="text-black">legit.</span>
                  <span className="nav-accent">discount</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-0.5">Verified Deals</span>
            </Link>

            {/* Search + Profile */}
            <div className="flex items-center gap-4 flex-1 max-w-lg">
              <div className="search-container flex-1">
                <input
                  type="text"
                  placeholder="Search deals, stores, codes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input w-full px-5 py-3.5 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 transition-all duration-300"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-300">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </button>
              </div>

              <AuthButton />
            </div>
          </div>

          {/* Bottom row: Tabs + Sort */}
          <div className="flex items-center justify-between gap-8">
            {/* Tabs Navigation */}
            <div className="flex gap-8">
              <Link href="/" className="nav-tab active text-sm text-gray-700">Daily Hits</Link>
              <Link href="/" className="nav-tab text-sm text-gray-500 hover:text-gray-700">Weekly Legends</Link>
              <Link href="/" className="nav-tab text-sm text-gray-500 hover:text-gray-700">All-Time Best</Link>
            </div>

            {/* Sort & Filter */}
            <div className="flex items-center gap-3">
              <button className="sort-btn px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
                <span className="material-symbols-outlined text-[16px] inline-block mr-1">tune</span>
                Filter
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200/40 backdrop-blur-md">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            {/* Mobile Brand */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="nav-brand text-2xl leading-none">
                <span className="text-black">legit</span>
                <span className="nav-accent">.</span>
              </div>
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </Link>

            <AuthButton />
          </div>

          {/* Mobile Search */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input w-full px-4 py-2.5 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <span className="material-symbols-outlined text-[16px]">search</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
