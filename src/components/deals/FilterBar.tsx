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

function Pill({
    icon,
    label,
    isActive,
    onClick,
    size = "md",
}: {
    icon: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
    size?: "sm" | "md";
}) {
    const py = size === "sm" ? "6px" : "8px";
    const px = size === "sm" ? "10px" : "12px";
    const iconSize = size === "sm" ? "13px" : "15px";
    const textSize = size === "sm" ? "9px" : "10px";

    return (
        <button
            onClick={onClick}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                paddingTop: py,
                paddingBottom: py,
                paddingLeft: px,
                paddingRight: px,
                borderRadius: "12px",
                backgroundColor: isActive ? "#111827" : "transparent",
                border: isActive ? "1px solid #111827" : "1px solid transparent",
                cursor: "pointer",
                flexShrink: 0,
                transition: "background-color 0.15s, border-color 0.15s",
                outline: "none",
            }}
        >
            <span
                className="material-symbols-outlined"
                style={{
                    fontSize: iconSize,
                    color: isActive ? "#ffffff" : "#9ca3af",
                    lineHeight: 1,
                }}
            >
                {icon}
            </span>
            <span
                style={{
                    fontSize: textSize,
                    fontWeight: 900,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: isActive ? "#ffffff" : "#9ca3af",
                    lineHeight: 1,
                }}
            >
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
                display: "flex",
                alignItems: "center",
                gap: "2px",
                overflowX: "auto",
                paddingBottom: "16px",
                marginBottom: "20px",
                borderBottom: "1px solid #EBEBEB",
                msOverflowStyle: "none",
                scrollbarWidth: "none",
            }}
        >
            {/* Time Range */}
            {TIME_OPTIONS.map((opt) => (
                <Pill
                    key={opt.value}
                    icon={opt.icon}
                    label={opt.label}
                    isActive={timeRange === opt.value}
                    onClick={() => setTimeRange(opt.value)}
                />
            ))}

            {/* Divider */}
            <div
                style={{
                    width: "1px",
                    height: "18px",
                    backgroundColor: "#e5e7eb",
                    flexShrink: 0,
                    margin: "0 6px",
                }}
            />

            {/* Sort By */}
            {SORT_OPTIONS.map((opt) => (
                <Pill
                    key={opt.value}
                    icon={opt.icon}
                    label={opt.label}
                    isActive={sortBy === opt.value}
                    onClick={() => setSortBy(opt.value)}
                />
            ))}
        </div>
    );
}
