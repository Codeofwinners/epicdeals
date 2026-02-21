"use client";

export function LeaderboardSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2" }}>
      {/* Dark hero skeleton */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #0F172A 100%)",
          padding: "48px 16px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          {/* Trophy placeholder */}
          <div
            style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.08)", margin: "0 auto 12px" }}
            className="animate-shimmer"
          />
          {/* Title placeholder */}
          <div
            style={{ height: 44, width: 280, background: "rgba(255,255,255,0.06)", borderRadius: 10, margin: "0 auto 10px" }}
            className="animate-shimmer"
          />
          {/* Tagline placeholder */}
          <div
            style={{ height: 16, width: 200, background: "rgba(255,255,255,0.04)", borderRadius: 6, margin: "0 auto 28px" }}
            className="animate-shimmer"
          />
          {/* UserRankCard skeleton */}
          <div
            style={{
              maxWidth: 600,
              margin: "0 auto",
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: "20px 24px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F1F5F9" }} className="animate-shimmer" />
              <div style={{ flex: 1 }}>
                <div style={{ height: 14, width: 120, background: "#F1F5F9", borderRadius: 6, marginBottom: 10 }} className="animate-shimmer" />
                <div style={{ height: 12, width: "100%", background: "#F1F5F9", borderRadius: 8 }} className="animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px 0" }}>
        {/* Quick stats skeleton */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                flex: "1 1 0",
                height: 64,
                borderRadius: 12,
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E4E4",
              }}
              className="animate-shimmer"
            />
          ))}
        </div>

        {/* Weekly challenges skeleton */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ height: 20, width: 160, background: "#F1F5F9", borderRadius: 6, marginBottom: 14 }} className="animate-shimmer" />
          <div style={{ display: "flex", gap: 12 }}>
            {[1, 2].map((i) => (
              <div
                key={i}
                style={{
                  flex: "1 1 0",
                  height: 96,
                  borderRadius: 14,
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E4E4E4",
                }}
                className="animate-shimmer"
              />
            ))}
          </div>
        </div>

        {/* Tab bar skeleton */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "2px solid #F1F5F9" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 36, width: 100, background: "#F8FAFC", borderRadius: "8px 8px 0 0" }} className="animate-shimmer" />
          ))}
        </div>

        {/* Category chips skeleton */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ height: 36, width: 90, borderRadius: 10, background: "#F8FAFC", border: "1px solid #F1F5F9" }} className="animate-shimmer" />
          ))}
        </div>

        {/* Podium skeleton */}
        <div className="hidden md:flex" style={{ gap: 16, justifyContent: "center", alignItems: "flex-end", marginBottom: 40 }}>
          {[{ w: 180, h: 240, mt: 40 }, { w: 220, h: 280, mt: 0 }, { w: 180, h: 220, mt: 60 }].map((s, i) => (
            <div
              key={i}
              style={{
                width: s.w,
                height: s.h,
                borderRadius: 18,
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E4E4",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                marginTop: s.mt,
              }}
              className="animate-shimmer"
            />
          ))}
        </div>

        {/* Mobile podium skeleton */}
        <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", marginBottom: 40 }}>
          <div style={{ width: "100%", maxWidth: 280, height: 200, borderRadius: 18, backgroundColor: "#FFFFFF", border: "1px solid #E4E4E4" }} className="animate-shimmer" />
          <div style={{ display: "flex", gap: 10, width: "100%", justifyContent: "center" }}>
            <div style={{ flex: 1, height: 180, borderRadius: 18, backgroundColor: "#FFFFFF", border: "1px solid #E4E4E4" }} className="animate-shimmer" />
            <div style={{ flex: 1, height: 180, borderRadius: 18, backgroundColor: "#FFFFFF", border: "1px solid #E4E4E4" }} className="animate-shimmer" />
          </div>
        </div>

        {/* Table skeleton */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              style={{
                height: 60,
                borderRadius: 14,
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E4E4",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
              className="animate-shimmer"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
