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
                                style={{
                                    backgroundColor: isActive ? "#111827" : "transparent",
                                    color: isActive ? "#ffffff" : "#6b7280",
                                    boxShadow: isActive ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none",
                                    border: isActive ? "1px solid #1f2937" : "1px solid transparent",
                                }}
                                className={`px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all duration-300 min-w-[50px] md:min-w-[70px] uppercase tracking-wider`}
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
                            style={{
                                backgroundColor: isActive ? "#f3f4f6" : "transparent",
                                color: isActive ? "#000000" : "#6b7280",
                            }}
                            className={`flex items-center gap-1 md:gap-1.5 px-3 py-2 md:px-3 md:py-2 rounded-xl text-[10px] md:text-[11px] font-black whitespace-nowrap transition-all duration-300 hover:text-black`}
                        >
                            <span className={`material-symbols-outlined text-[14px] md:text-[16px]`} style={{ color: isActive ? "#3b82f6" : "#9ca3af" }}>{opt.icon}</span>
                            <span className="uppercase tracking-tight">{opt.label}</span>
                        </button>
                    );
                })}
            </div>

        </div>
    );
}
