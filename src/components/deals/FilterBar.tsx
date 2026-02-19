"use client";

import { TimeRange, SortCategory } from "@/lib/firestore";

interface FilterBarProps {
    timeRange: TimeRange;
    setTimeRange: (val: TimeRange) => void;
    sortBy: SortCategory;
    setSortBy: (val: SortCategory) => void;
}

const TIME_OPTIONS: { label: string; value: TimeRange; icon: string }[] = [
    { label: "24h", value: "last-24h", icon: "schedule" },
    { label: "Week", value: "last-7d", icon: "calendar_view_week" },
    { label: "Month", value: "last-30d", icon: "calendar_month" },
    { label: "All", value: "all-time", icon: "all_inclusive" },
];

const SORT_OPTIONS: { label: string; value: SortCategory; icon: string }[] = [
    { label: "Voted", value: "most-voted", icon: "trending_up" },
    { label: "Viewed", value: "most-viewed", icon: "visibility" },
    { label: "Discussed", value: "most-commented", icon: "forum" },
];

function Pill({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "7px 12px",
                borderRadius: "10px",
                backgroundColor: isActive ? "#FFFFFF" : "transparent",
                border: isActive ? "1px solid rgba(255,255,255,0.9)" : "1px solid transparent",
                cursor: "pointer", flexShrink: 0,
                transition: "background-color 0.15s, border-color 0.15s",
                outline: "none",
            }}
        >
            <span className="material-symbols-outlined" style={{ fontSize: "13px", color: isActive ? "#0D0C0A" : "rgba(255,255,255,0.35)", lineHeight: 1 }}>
                {icon}
            </span>
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: isActive ? "#0D0C0A" : "rgba(255,255,255,0.35)", lineHeight: 1 }}>
                {label}
            </span>
        </button>
    );
}

export function FilterBar({ timeRange, setTimeRange, sortBy, setSortBy }: FilterBarProps) {
    return (
        <div
            className="no-scrollbar"
            style={{
                display: "flex", alignItems: "center", gap: "2px",
                overflowX: "auto",
                paddingBottom: "16px", marginBottom: "20px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                msOverflowStyle: "none", scrollbarWidth: "none",
            }}
        >
            {TIME_OPTIONS.map((opt) => (
                <Pill key={opt.value} icon={opt.icon} label={opt.label} isActive={timeRange === opt.value} onClick={() => setTimeRange(opt.value)} />
            ))}

            <div style={{ width: "1px", height: "16px", backgroundColor: "rgba(255,255,255,0.1)", flexShrink: 0, margin: "0 6px" }} />

            {SORT_OPTIONS.map((opt) => (
                <Pill key={opt.value} icon={opt.icon} label={opt.label} isActive={sortBy === opt.value} onClick={() => setSortBy(opt.value)} />
            ))}
        </div>
    );
}
