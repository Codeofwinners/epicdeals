"use client";

// ─── Badge Component (Modern minimal design - no outlines) ────────
interface DealBadgeProps {
  type: string;
  showIcon?: boolean;
}

export function DealBadge({ type, showIcon = true }: DealBadgeProps) {
  switch (type) {
    case "trending":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold leading-none text-orange-600 bg-orange-100/60 cursor-default hover:bg-orange-100 transition-colors">
          {showIcon && <span className="text-sm animate-flame">🔥</span>}
          <span>Hot</span>
        </span>
      );

    case "verified":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold leading-none text-blue-600 bg-blue-100/60 cursor-default hover:bg-blue-100 transition-colors">
          {showIcon && <span className="text-sm">✓</span>}
          <span>Verified</span>
        </span>
      );

    case "community_pick":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold leading-none text-amber-600 bg-amber-100/60 cursor-default hover:bg-amber-100 transition-colors">
          {showIcon && <span className="text-sm animate-sparkle">⭐</span>}
          <span>Pick</span>
        </span>
      );

    case "ai_found":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold leading-none text-cyan-600 bg-cyan-100/60 cursor-default hover:bg-cyan-100 transition-colors">
          {showIcon && <span className="text-sm animate-ai-scan">✨</span>}
          <span>AI Found</span>
        </span>
      );

    case "expiring":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold leading-none text-red-600 bg-red-100/60 cursor-default hover:bg-red-100 transition-colors">
          {showIcon && <span className="text-sm animate-pulse-soft">⏰</span>}
          <span>Expiring</span>
        </span>
      );

    case "new":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold leading-none text-emerald-600 bg-emerald-100/60 cursor-default hover:bg-emerald-100 transition-colors">
          {showIcon && <span className="text-sm animate-sparkle">✨</span>}
          <span>New</span>
        </span>
      );

    case "user_submitted":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold leading-none text-slate-600 bg-slate-100/60 cursor-default hover:bg-slate-100 transition-colors">
          {showIcon && <span className="text-sm">👤</span>}
          <span>User</span>
        </span>
      );

    default:
      return null;
  }
}
