"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthButton } from "@/components/auth/AuthButton";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      {/* DESKTOP HEADER */}
      <header className="hidden md:block sticky top-0 z-50" style={{
        backgroundColor: "rgba(13,12,10,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div className="px-8 py-4">
          <div className="flex items-center justify-between gap-8">
            <Link href="/" className="flex items-center gap-3 flex-shrink-0 hover:opacity-80 transition-opacity">
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: "-0.03em", fontSize: "28px", lineHeight: 1 }}>
                <span style={{ color: "#FFFFFF" }}>legit.</span>
                <span style={{ color: "rgba(255,255,255,0.35)" }}>discount</span>
              </div>
              <div style={{ width: "22px", height: "22px", borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "13px", color: "#fff", fontVariationSettings: "'FILL' 1" }}>verified</span>
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
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                  }}
                  className="placeholder:text-white/25"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2" style={{ fontSize: "16px", color: "rgba(255,255,255,0.25)" }}>search</span>
              </div>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-50" style={{
        backgroundColor: "rgba(13,12,10,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: "-0.03em", fontSize: "20px", lineHeight: 1 }}>
                <span style={{ color: "#FFFFFF" }}>legit.</span>
                <span style={{ color: "rgba(255,255,255,0.35)" }}>discount</span>
              </div>
              <div style={{ width: "18px", height: "18px", borderRadius: "5px", backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "11px", color: "#fff", fontVariationSettings: "'FILL' 1" }}>verified</span>
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
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "9px",
                color: "#fff",
                fontSize: "12px",
                outline: "none",
              }}
              className="placeholder:text-white/25"
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2" style={{ fontSize: "15px", color: "rgba(255,255,255,0.25)" }}>search</span>
          </div>
        </div>
      </header>
    </>
  );
}
