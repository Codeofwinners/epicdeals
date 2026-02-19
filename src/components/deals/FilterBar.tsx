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
    { label: "Voted", value: "most-voted", icon: "trending_up" },
    { label: "Viewed", value: "most-viewed", icon: "visibility" },
    { label: "Discussed", value: "most-commented", icon: "forum" },
];

export function FilterBar({ timeRange, setTimeRange, sortBy, setSortBy }: FilterBarProps) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 z-20 bg-transparent pt-2 pb-6 px-1 border-b border-[#EBEBEB]">
            {/* Time Segmented Control */}
            <div className="relative flex items-center justify-start overflow-x-auto no-scrollbar pb-2 lg:pb-0 -mx-1 px-1">
                <div className="flex gap-1">
                    {TIME_OPTIONS.map((opt) => {
                        const isActive = timeRange === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => setTimeRange(opt.value)}
                                className={`px-2 py-1.5 md:px-5 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all duration-300 min-w-[50px] md:min-w-[70px] uppercase tracking-wider ${isActive ? "bg-gray-900 text-white shadow-md border border-gray-800" : "bg-transparent text-gray-500 hover:text-black hover:bg-gray-100/50"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sort Options Pills */}
            <div className="flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar py-1 px-1 -mx-1">
                <span className="hidden md:inline-block text-[10px] font-black uppercase tracking-widest text-[#888888] mr-2 flex-shrink-0">Sort By</span>
                {SORT_OPTIONS.map((opt) => {
                    const isActive = sortBy === opt.value;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => setSortBy(opt.value)}
                            className={`flex items-center gap-1 md:gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl text-[10px] md:text-[11px] font-black whitespace-nowrap transition-all duration-300 ${isActive
                                ? "text-black bg-gray-100 md:bg-gray-100"
                                : "text-gray-500 hover:text-black hover:bg-gray-50/50"
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[14px] md:text-[16px] ${isActive ? "text-blue-500" : "text-gray-400"}`}>{opt.icon}</span>
                            <span className="uppercase tracking-tight">{opt.label}</span>
                        </button>
                    );
                })}
            </div>

        </div>
    );
}
