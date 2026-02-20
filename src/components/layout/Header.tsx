"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthButton } from "@/components/auth/AuthButton";

const HEADER_STYLE = {
  backgroundColor: "#111111",
  backgroundImage: [
    "repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255,255,255,0.03) 18px, rgba(255,255,255,0.03) 19px)",
    "repeating-linear-gradient(-45deg, transparent, transparent 18px, rgba(255,255,255,0.03) 18px, rgba(255,255,255,0.03) 19px)",
  ].join(", "),
};

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      {/* DESKTOP HEADER */}
      <header className="hidden md:block sticky top-0 z-50" style={HEADER_STYLE}>
        <div className="px-8 py-4">
          <div className="flex items-center justify-between gap-8">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: "-0.03em", fontSize: "26px", lineHeight: 1 }}>
                <span style={{ color: "#FFFFFF" }}>legit.</span>
                <span style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>discount</span>
              </div>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: "13px", color: "#fff", fontVariationSettings: "'FILL' 1" }}>check</span>
              </div>
            </Link>

            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search deals, stores, codes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 40px 10px 16px",
                    backgroundColor: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "10px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    outline: "none",
                  }}
                  className="placeholder:text-white/30"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2" style={{ fontSize: "16px", color: "rgba(255,255,255,0.3)" }}>search</span>
              </div>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-50" style={HEADER_STYLE}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: "-0.03em", fontSize: "20px", lineHeight: 1 }}>
                <span style={{ color: "#FFFFFF" }}>legit.</span>
                <span style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>discount</span>
              </div>
              <div style={{ width: "19px", height: "19px", borderRadius: "50%", background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: "11px", color: "#fff", fontVariationSettings: "'FILL' 1" }}>check</span>
              </div>
            </Link>
            <AuthButton />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%", padding: "9px 36px 9px 14px",
                backgroundColor: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "9px",
                color: "#FFFFFF",
                fontSize: "12px",
                outline: "none",
              }}
              className="placeholder:text-white/30"
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2" style={{ fontSize: "15px", color: "rgba(255,255,255,0.3)" }}>search</span>
          </div>
        </div>
      </header>
    </>
  );
}
