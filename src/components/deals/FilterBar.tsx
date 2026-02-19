"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TimeRange, SortCategory } from "@/lib/firestore";

interface FilterBarProps {
    timeRange: TimeRange;
    setTimeRange: (val: TimeRange) => void;
    sortBy: SortCategory;
    setSortBy: (val: SortCategory) => void;
}

const TIME_OPTIONS: { label: string; value: TimeRange }[] = [
    { label: "24h", value: "last-24h" },
    { label: "Week", value: "last-7d" },
    { label: "Month", value: "last-30d" },
    { label: "All Time", value: "all-time" },
];

const SORT_OPTIONS: { label: string; value: SortCategory; icon: string }[] = [
    { label: "Most Voted", value: "most-voted", icon: "trending_up" },
    { label: "Most Viewed", value: "most-viewed", icon: "visibility" },
    { label: "Most Discussed", value: "most-commented", icon: "forum" },
];

export function FilterBar({ timeRange, setTimeRange, sortBy, setSortBy }: FilterBarProps) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 z-20 bg-transparent pt-2 pb-6 px-1 border-b border-[#EBEBEB]">
            {/* Time Segmented Control */}
            <div className="relative flex items-center justify-start overflow-x-auto no-scrollbar pb-2 lg:pb-0 -mx-1 px-1">
                <div className="flex bg-[#EFEFEF] p-1 rounded-2xl border border-[#E5E5E5] relative">
                    {TIME_OPTIONS.map((opt) => {
                        const isActive = timeRange === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => setTimeRange(opt.value)}
                                className={`relative z-10 px-5 py-2.5 rounded-xl text-xs font-black transition-colors duration-300 min-w-[70px] uppercase tracking-wider ${isActive ? "text-[#1A1A1A]" : "text-gray-500 hover:text-gray-800"
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-time-pill"
                                        className="absolute inset-0 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-100"
                                        initial={false}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-20">{opt.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sort Options Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 -mx-1">
                <span className="hidden md:inline-block text-[10px] font-black uppercase tracking-widest text-[#888888] mr-2 flex-shrink-0">Sort By</span>
                {SORT_OPTIONS.map((opt) => {
                    const isActive = sortBy === opt.value;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => setSortBy(opt.value)}
                            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all duration-300 border ${isActive
                                ? "bg-black text-white border-black shadow-[0_8px_16px_rgba(0,0,0,0.12)] scale-[1.02]"
                                : "bg-white text-gray-600 border-gray-200/50 hover:border-gray-400 hover:bg-gray-50"
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${isActive ? "text-blue-400" : "text-gray-400"}`}>{opt.icon}</span>
                            <span className="uppercase tracking-tight">{opt.label}</span>
                        </button>
                    );
                })}
            </div>

        </div>
    );
}
