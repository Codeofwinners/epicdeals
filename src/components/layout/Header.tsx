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

function ShieldLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path d="M12 2L3 6.5V11.5C3 16.74 6.84 21.64 12 23C17.16 21.64 21 16.74 21 11.5V6.5L12 2Z" fill="url(#shieldGrad)" />
      <path d="M10 15.5L6.5 12L7.91 10.59L10 12.67L16.09 6.59L17.5 8L10 15.5Z" fill="#fff" />
    </svg>
  );
}

function AddDealButton() {
  return (
    <Link
      href="/submit"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
        borderRadius: "10px",
        color: "#fff",
        fontSize: "13px",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        textDecoration: "none",
        whiteSpace: "nowrap",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 0 20px rgba(14,165,233,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
        transition: "all 0.2s ease",
      }}
      className="hover:brightness-110 hover:shadow-[0_0_28px_rgba(14,165,233,0.5)] active:scale-[0.97]"
    >
      <span style={{ fontSize: "16px", fontWeight: 800, lineHeight: 1 }}>+</span>
      Add Deal
    </Link>
  );
}

function AddDealButtonMobile() {
  return (
    <Link
      href="/submit"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "6px 12px",
        background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
        borderRadius: "8px",
        color: "#fff",
        fontSize: "12px",
        fontWeight: 700,
        textDecoration: "none",
        whiteSpace: "nowrap",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 0 16px rgba(14,165,233,0.25)",
      }}
    >
      <span style={{ fontSize: "14px", fontWeight: 800, lineHeight: 1 }}>+</span>
      Add
    </Link>
  );
}

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      {/* DESKTOP HEADER */}
      <header className="hidden md:block sticky top-0 z-50" style={HEADER_STYLE}>
        <div className="px-8 py-4">
          <div className="flex items-center justify-between gap-8">
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-80 transition-opacity">
              <ShieldLogo size={24} />
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: "-0.03em", fontSize: "26px", lineHeight: 1 }}>
                <span style={{ color: "#FFFFFF" }}>legit.</span>
                <span style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>discount</span>
              </div>
            </Link>

            <div className="flex items-center gap-3 flex-1 max-w-lg">
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
              <Link
                href="/leaderboard"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(239,68,68,0.12) 100%)",
                  color: "#F59E0B",
                  fontSize: "13px",
                  fontWeight: 700,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  border: "1px solid rgba(245,158,11,0.25)",
                  transition: "all 0.2s ease",
                }}
                className="hover:brightness-125 hover:border-amber-400/40"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#F59E0B" }}>emoji_events</span>
                Ranks
              </Link>
              <AddDealButton />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-50" style={HEADER_STYLE}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-2 mb-3">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <ShieldLogo size={20} />
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: "-0.03em", fontSize: "20px", lineHeight: 1 }}>
                <span style={{ color: "#FFFFFF" }}>legit.</span>
                <span style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>discount</span>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/leaderboard"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(239,68,68,0.12) 100%)",
                  color: "#F59E0B",
                  fontSize: "11px",
                  fontWeight: 700,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  border: "1px solid rgba(245,158,11,0.25)",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#F59E0B" }}>emoji_events</span>
                Ranks
              </Link>
              <AddDealButtonMobile />
              <AuthButton />
            </div>
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
