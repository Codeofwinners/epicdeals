// ─── AI Brand Theme System ─────────────────────────────────────────────────────
// Auto-determines brand colors for any store. Deals WITHOUT images get branded
// gradient cards; deals WITH images use the standard image card.

import type React from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type BrandColors = {
  primary: string;
  secondary?: string;
  isDark: boolean;       // true = light text on dark/vivid bg
  glowColor?: string;
};

export type BrandTheme = {
  bg: string;
  bgGradient: string;
  textColor: string;
  storeColor: string;
  isDark: boolean;
  themeType: "bright" | "dark" | "default";
  glowColor?: string;
};

export type CardUITheme = {
  divider: string;
  icon: string;
  countText: string;
  upvoteInactive: string;
  upvoteActive: React.CSSProperties;
  learnMore: string;
  verifiedIcon: React.CSSProperties;
  verifiedText: React.CSSProperties;
  ringColor: string;
  floatStyle: React.CSSProperties;
};

// ─── Shared styles ─────────────────────────────────────────────────────────────

const ACTIVE_GRADIENT = "linear-gradient(135deg, #006039 0%, #16a34a 50%, #84cc16 100%)";
const gradientText: React.CSSProperties = {
  background: ACTIVE_GRADIENT,
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
};

// ─── Card UI Themes ────────────────────────────────────────────────────────────

export const THEME_DEFAULT: CardUITheme = {
  divider: "#EFEFEF", icon: "#C0C0C0", countText: "#888", upvoteInactive: "#CCCCCC",
  upvoteActive: gradientText,
  learnMore: "#AAAAAA",
  verifiedIcon: { color: "#9CA3AF", fontSize: "14px", fontVariationSettings: "'FILL' 1", lineHeight: 1, flexShrink: 0, display: "inline-block" },
  verifiedText: { color: "#9CA3AF", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, lineHeight: 1.2 },
  ringColor: "#16a34a",
  floatStyle: gradientText,
};

export const THEME_DARK: CardUITheme = {
  divider: "rgba(255,255,255,0.08)", icon: "rgba(255,255,255,0.3)", countText: "rgba(255,255,255,0.4)", upvoteInactive: "rgba(255,255,255,0.35)",
  upvoteActive: gradientText,
  learnMore: "rgba(255,255,255,0.4)",
  verifiedIcon: { color: "rgba(255,255,255,0.4)", fontSize: "14px", fontVariationSettings: "'FILL' 1", lineHeight: 1, flexShrink: 0, display: "inline-block" },
  verifiedText: { color: "rgba(255,255,255,0.4)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, lineHeight: 1.2 },
  ringColor: "#16a34a",
  floatStyle: gradientText,
};

export const THEME_BRIGHT: CardUITheme = {
  divider: "rgba(255,255,255,0.2)", icon: "rgba(255,255,255,0.85)", countText: "rgba(255,255,255,0.7)", upvoteInactive: "rgba(255,255,255,0.7)",
  upvoteActive: { color: "#fff" },
  learnMore: "rgba(255,255,255,0.8)",
  verifiedIcon: { color: "rgba(255,255,255,0.5)", fontSize: "14px", fontVariationSettings: "'FILL' 1", lineHeight: 1, flexShrink: 0, display: "inline-block" },
  verifiedText: { color: "rgba(255,255,255,0.5)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, lineHeight: 1.2 },
  ringColor: "#fff",
  floatStyle: { color: "#fff" },
};

export function getCardUITheme(themeType: "bright" | "dark" | "default"): CardUITheme {
  if (themeType === "bright") return THEME_BRIGHT;
  if (themeType === "dark") return THEME_DARK;
  return THEME_DEFAULT;
}

// ─── Brand Color Database (80+ brands) ─────────────────────────────────────────

const BRAND_DATABASE: Record<string, BrandColors> = {
  // ── Existing hardcoded brands (must match current visuals exactly) ──
  "nike":            { primary: "#111111", isDark: true, glowColor: "rgba(168,85,247,0.3)" },
  "spotify":         { primary: "#1DB954", isDark: true },
  "uber-eats":       { primary: "#0A0A0A", isDark: true },

  // ── Retail / Department ──
  "amazon":          { primary: "#FF9900", secondary: "#232F3E", isDark: true },
  "target":          { primary: "#CC0000", isDark: true },
  "walmart":         { primary: "#0071CE", isDark: true },
  "costco":          { primary: "#E31837", secondary: "#005DAA", isDark: true },
  "macys":           { primary: "#E21A2C", isDark: true },
  "nordstrom":       { primary: "#1B1B1B", isDark: true },
  "kohls":           { primary: "#8B0000", isDark: true },
  "tjmaxx":          { primary: "#E11B22", isDark: true },
  "marshalls":       { primary: "#2E3192", isDark: true },

  // ── Tech / Electronics ──
  "apple":           { primary: "#1D1D1F", secondary: "#555555", isDark: true },
  "samsung":         { primary: "#1428A0", isDark: true },
  "best-buy":        { primary: "#0046BE", secondary: "#FFE000", isDark: true },
  "newegg":          { primary: "#F7A300", secondary: "#2D2D2D", isDark: true },
  "microsoft":       { primary: "#737373", secondary: "#00A4EF", isDark: true },
  "google":          { primary: "#4285F4", secondary: "#34A853", isDark: true },
  "adobe":           { primary: "#FF0000", secondary: "#330000", isDark: true },

  // ── Fashion / Apparel ──
  "adidas":          { primary: "#1A1A1A", isDark: true },
  "puma":            { primary: "#D40511", isDark: true },
  "under-armour":    { primary: "#1D1D1D", isDark: true },
  "new-balance":     { primary: "#CF0A2C", isDark: true },
  "lululemon":       { primary: "#D31334", isDark: true },
  "old-navy":        { primary: "#003B64", isDark: true },
  "gap":             { primary: "#1E3A5F", isDark: true },
  "hm":              { primary: "#E50010", isDark: true },
  "h-m":             { primary: "#E50010", isDark: true },
  "zara":            { primary: "#1A1A1A", isDark: true },
  "forever-21":      { primary: "#FFD700", secondary: "#1A1A1A", isDark: false },
  "foot-locker":     { primary: "#1A1A1A", secondary: "#CF0A2C", isDark: true },
  "dicks-sporting-goods": { primary: "#00703C", isDark: true },
  "patagonia":       { primary: "#1A2B49", isDark: true },
  "the-north-face":  { primary: "#1A1A1A", isDark: true },
  "columbia":        { primary: "#1A3C6A", isDark: true },
  "rei":             { primary: "#1A5632", isDark: true },

  // ── Beauty / Personal Care ──
  "sephora":         { primary: "#1A1A1A", secondary: "#E0004D", isDark: true },
  "ulta":            { primary: "#F26522", isDark: true },
  "bath-body-works": { primary: "#1A3E6F", isDark: true },
  "victorias-secret": { primary: "#D4006A", isDark: true },

  // ── Home / Furniture ──
  "home-depot":      { primary: "#F96302", isDark: true },
  "lowes":           { primary: "#004990", isDark: true },
  "ikea":            { primary: "#0058A3", secondary: "#FFDA1A", isDark: true },
  "wayfair":         { primary: "#7B189F", isDark: true },

  // ── Food / Delivery ──
  "starbucks":       { primary: "#00704A", isDark: true },
  "mcdonalds":       { primary: "#DA291C", secondary: "#FFC72C", isDark: true },
  "dominos":         { primary: "#006491", secondary: "#E31837", isDark: true },
  "pizza-hut":       { primary: "#EE3A23", isDark: true },
  "papa-johns":      { primary: "#1A6F30", isDark: true },
  "grubhub":         { primary: "#F63440", isDark: true },
  "doordash":        { primary: "#FF3008", isDark: true },
  "instacart":       { primary: "#43B02A", isDark: true },

  // ── Streaming / Entertainment ──
  "netflix":         { primary: "#E50914", secondary: "#1A1A1A", isDark: true },
  "disney-plus":     { primary: "#113CCF", isDark: true },
  "disney":          { primary: "#113CCF", isDark: true },
  "hulu":            { primary: "#1CE783", isDark: true },
  "hbo-max":         { primary: "#5822B4", isDark: true },
  "paramount-plus":  { primary: "#0064FF", isDark: true },
  "peacock":         { primary: "#1A1A1A", secondary: "#F4C542", isDark: true },
  "youtube":         { primary: "#FF0000", secondary: "#282828", isDark: true },

  // ── Gaming ──
  "gamestop":        { primary: "#1A1A1A", secondary: "#FF0000", isDark: true },
  "playstation":     { primary: "#003087", isDark: true },
  "xbox":            { primary: "#107C10", isDark: true },
  "nintendo":        { primary: "#E60012", isDark: true },
  "steam":           { primary: "#1B2838", secondary: "#2A475E", isDark: true },
  "epic-games":      { primary: "#1A1A1A", isDark: true },

  // ── Telecom ──
  "t-mobile":        { primary: "#E20074", isDark: true },
  "verizon":         { primary: "#CD040B", isDark: true },
  "att":             { primary: "#009FDB", isDark: true },
  "at-t":            { primary: "#009FDB", isDark: true },

  // ── Pharmacy / Health ──
  "cvs":             { primary: "#CC0000", isDark: true },
  "walgreens":       { primary: "#E31837", isDark: true },

  // ── Marketplace / E-commerce ──
  "ebay":            { primary: "#E53238", secondary: "#0064D2", isDark: true },
  "etsy":            { primary: "#F56400", isDark: true },
  "chewy":           { primary: "#1C49C2", isDark: true },
  "wish":            { primary: "#2FB7EC", isDark: true },
  "aliexpress":      { primary: "#E62E04", isDark: true },
  "shopify":         { primary: "#96BF48", secondary: "#2D3538", isDark: true },

  // ── Travel ──
  "airbnb":          { primary: "#FF5A5F", isDark: true },
  "booking":         { primary: "#003580", isDark: true },
  "expedia":         { primary: "#00355F", secondary: "#FBCE08", isDark: true },
  "hotels-com":      { primary: "#D32F2F", isDark: true },
  "southwest":       { primary: "#304CB2", secondary: "#FFBF27", isDark: true },
  "delta":           { primary: "#003A70", secondary: "#C8102E", isDark: true },
  "united":          { primary: "#002244", secondary: "#0066B2", isDark: true },

  // ── Auto / Rideshare ──
  "uber":            { primary: "#1A1A1A", isDark: true },
  "lyft":            { primary: "#FF00BF", isDark: true },

  // ── Finance / Services ──
  "paypal":          { primary: "#003087", secondary: "#009CDE", isDark: true },
  "venmo":           { primary: "#3D95CE", isDark: true },
  "cash-app":        { primary: "#00D632", isDark: true },

  // ── Groceries ──
  "whole-foods":     { primary: "#00674B", isDark: true },
  "trader-joes":     { primary: "#BA0C2F", isDark: true },
  "kroger":          { primary: "#0067A5", isDark: true },
};

// ─── Fallback Palette (12 curated colors) ──────────────────────────────────────

const FALLBACK_PALETTES: BrandColors[] = [
  { primary: "#1E3A5F", secondary: "#2C5282", isDark: true },  // Deep blue
  { primary: "#0D6B6E", secondary: "#14919B", isDark: true },  // Teal
  { primary: "#C04A3A", secondary: "#E8725B", isDark: true },  // Coral
  { primary: "#1B5E3B", secondary: "#2D8659", isDark: true },  // Forest green
  { primary: "#5B2D8E", secondary: "#7C4DBC", isDark: true },  // Royal purple
  { primary: "#A0522D", secondary: "#CD853F", isDark: true },  // Warm amber
  { primary: "#3B4252", secondary: "#4C566A", isDark: true },  // Slate
  { primary: "#9B2948", secondary: "#C04B6E", isDark: true },  // Rose
  { primary: "#2E3192", secondary: "#4A4DE7", isDark: true },  // Indigo
  { primary: "#0E6251", secondary: "#148F77", isDark: true },  // Emerald
  { primary: "#8B1A1A", secondary: "#B22222", isDark: true },  // Crimson
  { primary: "#1A5276", secondary: "#2E86C1", isDark: true },  // Ocean
];

// ─── Deterministic hash ────────────────────────────────────────────────────────

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ─── Slug normalization ────────────────────────────────────────────────────────

function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[''.+]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Main lookup ───────────────────────────────────────────────────────────────

export function getStoreBrandTheme(storeId: string, storeName: string): BrandTheme {
  // Try storeId directly
  let brand = BRAND_DATABASE[storeId];

  // Try normalized slug of storeName
  if (!brand) {
    const slug = normalizeSlug(storeName);
    brand = BRAND_DATABASE[slug];
  }

  // Try normalized slug of storeId
  if (!brand) {
    const slug = normalizeSlug(storeId);
    brand = BRAND_DATABASE[slug];
  }

  // Fallback: deterministic color from store name
  if (!brand) {
    const idx = hashString(storeName.toLowerCase()) % FALLBACK_PALETTES.length;
    brand = FALLBACK_PALETTES[idx];
  }

  const secondary = brand.secondary || brand.primary;
  const isVivid = isVividColor(brand.primary);

  // Build gradient
  let bgGradient: string;
  if (brand.secondary) {
    bgGradient = `linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)`;
  } else {
    // Lighten primary slightly for gradient endpoint
    bgGradient = `linear-gradient(135deg, ${brand.primary} 0%, ${lighten(brand.primary, 15)} 100%)`;
  }

  // Determine theme type
  let themeType: "bright" | "dark" | "default";
  if (isVivid) {
    themeType = "bright";
  } else if (brand.isDark) {
    themeType = "dark";
  } else {
    themeType = "default";
  }

  return {
    bg: brand.primary,
    bgGradient,
    textColor: brand.isDark ? "#fff" : "#0A0A0A",
    storeColor: brand.isDark
      ? (isVivid ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)")
      : "#BBBBBB",
    isDark: brand.isDark,
    themeType,
    glowColor: brand.glowColor,
  };
}

// ─── Color utilities ───────────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

function isVividColor(hex: string): boolean {
  try {
    const [, s, l] = hexToHsl(hex);
    // Vivid = high saturation + mid lightness (not too dark, not too light)
    return s > 50 && l > 25 && l < 65;
  } catch {
    return false;
  }
}

function lighten(hex: string, amount: number): string {
  try {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, r + amount);
    g = Math.min(255, g + amount);
    b = Math.min(255, b + amount);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  } catch {
    return hex;
  }
}
