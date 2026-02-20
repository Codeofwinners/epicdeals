"use client";

import { TimeRange, SortCategory } from "@/lib/firestore";

interface FilterBarProps {
    timeRange: TimeRange;
    setTimeRange: (val: TimeRange) => void;
    sortBy: SortCategory;
    setSortBy: (val: SortCategory) => void;
}

const TIME_OPTIONS: { label: string; value: TimeRange; icon: string }[] = [
    { label: "24h",   value: "last-24h",  icon: "schedule" },
    { label: "Week",  value: "last-7d",   icon: "calendar_view_week" },
    { label: "Month", value: "last-30d",  icon: "calendar_month" },
    { label: "All",   value: "all-time",  icon: "all_inclusive" },
];

const SORT_OPTIONS: { label: string; value: SortCategory; icon: string }[] = [
    { label: "Voted",     value: "most-voted",    icon: "trending_up" },
    { label: "Viewed",    value: "most-viewed",   icon: "visibility" },
    { label: "Discussed", value: "most-commented", icon: "forum" },
];

function Pill({ icon, label, isActive, onClick, compact = false }: {
    icon: string; label: string; isActive: boolean; onClick: () => void; compact?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                display: "flex", alignItems: "center", gap: compact ? "3px" : "5px",
                padding: compact ? "5px 9px" : "7px 12px",
                borderRadius: "9px",
                backgroundColor: isActive ? "#0A0A0A" : "transparent",
                border: isActive ? "1px solid #0A0A0A" : "1px solid transparent",
                cursor: "pointer", flexShrink: 0,
                transition: "background-color 0.15s, border-color 0.15s",
                outline: "none",
                whiteSpace: "nowrap",
            }}
        >
            <span className="material-symbols-outlined" style={{ fontSize: compact ? "11px" : "13px", color: isActive ? "#FFFFFF" : "#AAAAAA", lineHeight: 1 }}>
                {icon}
            </span>
            <span style={{ fontSize: compact ? "9px" : "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: isActive ? "#FFFFFF" : "#AAAAAA", lineHeight: 1 }}>
                {label}
            </span>
        </button>
    );
}

export function FilterBar({ timeRange, setTimeRange, sortBy, setSortBy }: FilterBarProps) {
    const allOptions = [
        ...TIME_OPTIONS.map(o => ({ ...o, type: "time" as const })),
        ...SORT_OPTIONS.map(o => ({ ...o, type: "sort" as const })),
    ];

    return (
        <>
            {/* DESKTOP: single row with standard sizing */}
            <div
                className="no-scrollbar hidden md:flex"
                style={{
                    alignItems: "center", gap: "2px",
                    overflowX: "auto",
                    paddingBottom: "16px", marginBottom: "20px",
                    borderBottom: "1px solid #E8E8E8",
                }}
            >
                {TIME_OPTIONS.map(opt => (
                    <Pill key={opt.value} icon={opt.icon} label={opt.label}
                        isActive={timeRange === opt.value} onClick={() => setTimeRange(opt.value)} />
                ))}
                <div style={{ width: "1px", height: "16px", backgroundColor: "#E0E0E0", flexShrink: 0, margin: "0 6px" }} />
                {SORT_OPTIONS.map(opt => (
                    <Pill key={opt.value} icon={opt.icon} label={opt.label}
                        isActive={sortBy === opt.value} onClick={() => setSortBy(opt.value)} />
                ))}
            </div>

            {/* MOBILE: single compact scrollable row with fade hint on right */}
            <div className="md:hidden" style={{ position: "relative", marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid #E8E8E8" }}>
                <div
                    className="no-scrollbar"
                    style={{
                        display: "flex", alignItems: "center", gap: "2px",
                        overflowX: "auto",
                        msOverflowStyle: "none", scrollbarWidth: "none",
                    }}
                >
                    {TIME_OPTIONS.map(opt => (
                        <Pill key={opt.value} icon={opt.icon} label={opt.label}
                            isActive={timeRange === opt.value} onClick={() => setTimeRange(opt.value)} compact />
                    ))}
                    <div style={{ width: "1px", height: "14px", backgroundColor: "#E0E0E0", flexShrink: 0, margin: "0 4px" }} />
                    {SORT_OPTIONS.map(opt => (
                        <Pill key={opt.value} icon={opt.icon} label={opt.label}
                            isActive={sortBy === opt.value} onClick={() => setSortBy(opt.value)} compact />
                    ))}
                </div>
                {/* Right fade — signals more content is scrollable */}
                <div style={{
                    position: "absolute", right: 0, top: 0, bottom: 0,
                    width: "32px", pointerEvents: "none",
                    background: "linear-gradient(to right, transparent, #FAF7F2)",
                }} />
            </div>
        </>
    );
}
