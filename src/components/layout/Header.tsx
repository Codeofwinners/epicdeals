"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthButton } from "@/components/auth/AuthButton";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      {/* DESKTOP HEADER */}
      <header className="hidden md:block sticky top-0 z-50 bg-white border-b border-[#EBEBEB]">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between gap-8">
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-80 transition-opacity">
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: "-0.03em", fontSize: "26px", lineHeight: 1 }}>
                <span style={{ color: "#0A0A0A" }}>legit.</span>
                <span style={{ color: "#AAAAAA" }}>discount</span>
              </div>
              <div style={{ width: "20px", height: "20px", borderRadius: "6px", backgroundColor: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "12px", color: "#fff", fontVariationSettings: "'FILL' 1" }}>verified</span>
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
                    backgroundColor: "#F5F5F5",
                    border: "1px solid #E8E8E8",
                    borderRadius: "10px",
                    color: "#0A0A0A",
                    fontSize: "13px",
                    outline: "none",
                  }}
                  className="placeholder:text-[#BBBBBB]"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2" style={{ fontSize: "16px", color: "#BBBBBB" }}>search</span>
              </div>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-[#EBEBEB]">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: "-0.03em", fontSize: "20px", lineHeight: 1 }}>
                <span style={{ color: "#0A0A0A" }}>legit.</span>
                <span style={{ color: "#AAAAAA" }}>discount</span>
              </div>
              <div style={{ width: "17px", height: "17px", borderRadius: "5px", backgroundColor: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                backgroundColor: "#F5F5F5",
                border: "1px solid #E8E8E8",
                borderRadius: "9px",
                color: "#0A0A0A",
                fontSize: "12px",
                outline: "none",
              }}
              className="placeholder:text-[#BBBBBB]"
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2" style={{ fontSize: "15px", color: "#BBBBBB" }}>search</span>
          </div>
        </div>
      </header>
    </>
  );
}
