"use client";

export function LeaderboardSkeleton() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      {/* Hero skeleton */}
      <div style={{ height: 180, borderRadius: 20, background: "#1a1a1a", marginBottom: 32, position: "relative", overflow: "hidden" }}>
        <div className="animate-shimmer" style={{ position: "absolute", inset: 0, opacity: 0.3 }} />
      </div>

      {/* Filter bar skeleton */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 36, width: 100, borderRadius: 10, background: "#f1f5f9" }} className="animate-shimmer" />
        ))}
      </div>

      {/* Podium skeleton */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 40 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ width: 180, height: i === 2 ? 220 : 190, borderRadius: 16, background: "#f8fafc", border: "1px solid #f1f5f9" }} className="animate-shimmer" />
        ))}
      </div>

      {/* Table skeleton */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} style={{ height: 56, borderRadius: 12, background: "#f8fafc", border: "1px solid #f1f5f9" }} className="animate-shimmer" />
        ))}
      </div>
    </div>
  );
}
