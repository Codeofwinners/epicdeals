"use client";

import { AuthButton } from "@/components/auth/AuthButton";
import { DealsList } from "@/components/deals/DealsList";

export default function Home() {
  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        body {
          min-height: 100vh;
          background-color: #F9F9F7;
          padding-bottom: 140px;
        }
        .masonry-grid {
          column-count: 2;
          column-gap: 12px;
        }
        @media (min-width: 768px) {
          .masonry-grid {
            column-count: 4;
            column-gap: 16px;
          }
        }
        .masonry-item {
          break-inside: avoid;
          margin-bottom: 16px;
        }
        .card-overlay {
          background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%);
        }
      `}</style>

      {/* DESKTOP */}
      <div className="hidden md:block bg-white text-black font-display min-h-screen antialiased">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
          <div className="px-8 py-4">
            {/* Top row: Logo + Actions */}
            <div className="flex items-center justify-between gap-8 mb-8">
              {/* Brand - Apple-inspired */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                <div className="text-4xl font-black tracking-tight text-black leading-none" style={{fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", letterSpacing: '-0.03em', fontWeight: 900}}>
                  legit.
                  <br/>
                  <span className="text-blue-600">discount</span>
                </div>
                <div className="flex items-center gap-2 ml-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Verified</span>
                </div>
              </div>

              {/* Search + Profile */}
              <div className="flex items-center gap-4 flex-1 max-w-md">
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    placeholder="Search deals, stores, codes..."
                    className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-600 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">search</span>
                  </button>
                </div>

                <AuthButton />
              </div>
            </div>

            {/* Tabs & Filters */}
            <div className="flex items-center justify-between gap-6">
              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                {['Daily Hits', 'Weekly Legends', 'All-Time Best'].map((tab, i) => (
                  <button
                    key={i}
                    style={{fontWeight: i === 0 ? 700 : 600}}
                    className={`px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      i === 0
                        ? 'bg-white text-black shadow-sm'
                        : 'text-gray-600 hover:text-black hover:bg-gray-50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-1.5 pl-4 border-l border-gray-200">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort:</span>
                {[
                  { icon: 'local_fire_department', label: 'Hot', accent: true },
                  { icon: 'trending_up', label: 'Rising' },
                  { icon: 'new_releases', label: 'New' },
                  { icon: 'chat', label: 'Discussed' }
                ].map((item, i) => (
                  <button
                    key={i}
                    style={{
                      backgroundColor: '#fff',
                      color: item.accent ? '#2563eb' : '#666',
                      border: '1px solid #e5e7eb'
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-[13px]" style={{color: item.accent ? '#2563eb' : 'inherit'}}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-4">
          <DealsList />
        </main>

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 z-50">
          <div className="flex justify-between items-center px-1 relative">
            <a className="flex flex-col items-center justify-center p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all w-16" href="#">
              <span className="material-symbols-outlined text-[24px]">home</span>
              <span className="text-[10px] font-medium mt-1">Feed</span>
            </a>
            <a className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/20 text-white w-16 shadow-inner" href="#">
              <span className="material-symbols-outlined text-[24px]">trending_up</span>
              <span className="text-[10px] font-bold mt-1">Trends</span>
            </a>
            <div className="relative -top-6">
              <button className="w-14 h-14 bg-[#FF4500] rounded-full flex items-center justify-center shadow-lg border-4 border-[#1A1A1A] text-white">
                <span className="material-symbols-outlined text-[28px]">add</span>
              </button>
            </div>
            <a className="flex flex-col items-center justify-center p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all w-16 relative" href="#">
              <div className="absolute top-2 right-4 w-1.5 h-1.5 bg-[#FF3D00] rounded-full"></div>
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              <span className="text-[10px] font-medium mt-1">Alerts</span>
            </a>
            <a className="flex flex-col items-center justify-center p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all w-16" href="#">
              <span className="material-symbols-outlined text-[24px]">person</span>
              <span className="text-[10px] font-medium mt-1">Me</span>
            </a>
          </div>
        </nav>
      </div>

      {/* MOBILE */}
      <div className="md:hidden bg-white text-black font-display min-h-screen antialiased">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
          {/* Top section: Logo + Search + Actions */}
          <div className="px-4 py-4">
            {/* Brand + Search Row */}
            <div className="flex items-center gap-3 mb-3">
              {/* Brand */}
              <div className="text-2xl font-black tracking-tight text-black flex-shrink-0" style={{fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", letterSpacing: '-0.03em', fontWeight: 900}}>
                legit.<span className="text-blue-600">discount</span>
              </div>

              {/* Auth Button + Alerts */}
              <div className="ml-auto flex items-center gap-2">
                <AuthButton />
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                  <span className="material-symbols-outlined text-[22px] text-gray-700">notifications</span>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative group">
              <input
                type="text"
                placeholder="Search deals, stores..."
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-600 transition-colors">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </button>
            </div>
          </div>

          {/* Tabs section */}
          <div className="px-4 pb-3 flex gap-1 overflow-x-auto no-scrollbar">
            {['Daily Hits', 'Weekly Legends', 'All-Time Best'].map((tab, i) => (
              <button
                key={i}
                style={{
                  backgroundColor: i === 0 ? '#000' : '#fff',
                  color: i === 0 ? '#fff' : '#666',
                  border: i === 0 ? 'none' : '1px solid #e5e7eb'
                }}
                className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95"
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Sort section */}
          <div className="px-4 pt-3 pb-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0">Sort:</span>
            {[
              { icon: 'local_fire_department', label: 'Hot', accent: true },
              { icon: 'trending_up', label: 'Rising' },
              { icon: 'new_releases', label: 'New' },
              { icon: 'chat', label: 'Discussed' }
            ].map((item, i) => (
              <button
                key={i}
                style={{
                  backgroundColor: '#fff',
                  color: item.accent ? '#2563eb' : '#666',
                  border: '1px solid #e5e7eb'
                }}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                <span className="material-symbols-outlined text-[12px]" style={{color: item.accent ? '#2563eb' : 'inherit'}}>
                  {item.icon}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </header>

        <main className="px-3 py-3 pb-24">
          <DealsList />
        </main>

        <nav className="fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl border border-white/40 rounded-full p-1.5 z-50">
          <div className="flex justify-between items-center px-2">
            <a className="flex flex-col items-center justify-center p-3 rounded-full bg-black text-white w-12 h-12 shadow-md" href="#">
              <span className="material-symbols-outlined text-[24px]">home</span>
            </a>
            <a className="flex flex-col items-center justify-center p-3 rounded-full text-gray-400 hover:text-black hover:bg-gray-50 transition-all w-12 h-12" href="#">
              <span className="material-symbols-outlined text-[24px]">explore</span>
            </a>
            <a className="flex flex-col items-center justify-center p-3 rounded-full text-gray-400 hover:text-black hover:bg-gray-50 transition-all w-12 h-12" href="#">
              <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: "'FILL' 1"}}>add_circle</span>
            </a>
            <a className="flex flex-col items-center justify-center p-3 rounded-full text-gray-400 hover:text-black hover:bg-gray-50 transition-all w-12 h-12 relative" href="#">
              <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></div>
              <span className="material-symbols-outlined text-[24px]">bookmark</span>
            </a>
            <a className="flex flex-col items-center justify-center p-3 rounded-full text-gray-400 hover:text-black hover:bg-gray-50 transition-all w-12 h-12" href="#">
              <span className="material-symbols-outlined text-[24px]">person</span>
            </a>
          </div>
        </nav>
      </div>
    </>
  );
}
