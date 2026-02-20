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

function Pill({ icon, label, isActive, onClick, small = false }: { icon: string; label: string; isActive: boolean; onClick: () => void; small?: boolean }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: "flex", alignItems: "center", gap: small ? "4px" : "5px",
                padding: small ? "6px 10px" : "7px 12px",
                borderRadius: "10px",
                backgroundColor: isActive ? "#0A0A0A" : "transparent",
                border: isActive ? "1px solid #0A0A0A" : "1px solid transparent",
                cursor: "pointer", flexShrink: 0,
                transition: "background-color 0.15s, border-color 0.15s",
                outline: "none",
            }}
        >
            <span className="material-symbols-outlined" style={{ fontSize: small ? "12px" : "13px", color: isActive ? "#FFFFFF" : "#AAAAAA", lineHeight: 1 }}>
                {icon}
            </span>
            <span style={{ fontSize: small ? "9px" : "10px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: isActive ? "#FFFFFF" : "#AAAAAA", lineHeight: 1 }}>
                {label}
            </span>
        </button>
    );
}

export function FilterBar({ timeRange, setTimeRange, sortBy, setSortBy }: FilterBarProps) {
    return (
        <>
            {/* DESKTOP: single scrollable row */}
            <div
                className="no-scrollbar hidden md:flex"
                style={{
                    alignItems: "center", gap: "2px",
                    overflowX: "auto",
                    paddingBottom: "16px", marginBottom: "20px",
                    borderBottom: "1px solid #E8E8E8",
                    msOverflowStyle: "none", scrollbarWidth: "none",
                }}
            >
                {TIME_OPTIONS.map((opt) => (
                    <Pill key={opt.value} icon={opt.icon} label={opt.label} isActive={timeRange === opt.value} onClick={() => setTimeRange(opt.value)} />
                ))}
                <div style={{ width: "1px", height: "16px", backgroundColor: "#E0E0E0", flexShrink: 0, margin: "0 6px" }} />
                {SORT_OPTIONS.map((opt) => (
                    <Pill key={opt.value} icon={opt.icon} label={opt.label} isActive={sortBy === opt.value} onClick={() => setSortBy(opt.value)} />
                ))}
            </div>

            {/* MOBILE: two rows — time on top, sort below */}
            <div className="md:hidden" style={{ marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid #E8E8E8" }}>
                {/* Row 1: Time filters */}
                <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                    {TIME_OPTIONS.map((opt) => (
                        <Pill key={opt.value} icon={opt.icon} label={opt.label} isActive={timeRange === opt.value} onClick={() => setTimeRange(opt.value)} small />
                    ))}
                </div>
                {/* Row 2: Sort filters */}
                <div style={{ display: "flex", gap: "4px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#CCCCCC", alignSelf: "center", marginRight: "2px", flexShrink: 0 }}>Sort</span>
                    {SORT_OPTIONS.map((opt) => (
                        <Pill key={opt.value} icon={opt.icon} label={opt.label} isActive={sortBy === opt.value} onClick={() => setSortBy(opt.value)} small />
                    ))}
                </div>
            </div>
        </>
    );
}
