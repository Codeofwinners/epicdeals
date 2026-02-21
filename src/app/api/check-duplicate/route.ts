import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.origin + u.pathname.replace(/\/+$/, "").toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

export async function POST(request: Request) {
  try {
    const { storeId, title, code, dealUrl } = await request.json();

    if (!storeId) {
      return NextResponse.json({ matches: [] });
    }

    const db = getAdminDb();
    const snap = await db
      .collection("deals")
      .where("store.id", "==", storeId)
      .get();

    const now = Date.now();
    const matches: { id: string; title: string; reason: string }[] = [];

    for (const d of snap.docs) {
      if (matches.length >= 5) break;

      const data = d.data();
      // Skip expired
      if (data.expiresAt && data.expiresAt.toDate().getTime() < now) continue;
      if (data.status === "expired") continue;

      // Exact code match
      if (code && data.code && code.toLowerCase() === data.code.toLowerCase()) {
        matches.push({ id: d.id, title: data.title, reason: "Same promo code" });
        continue;
      }

      // Exact URL match
      if (dealUrl && data.dealUrl && normalizeUrl(dealUrl) === normalizeUrl(data.dealUrl)) {
        matches.push({ id: d.id, title: data.title, reason: "Same deal URL" });
        continue;
      }

      // Title overlap >= 70%
      if (title && data.title && wordOverlap(title, data.title) >= 0.7) {
        matches.push({ id: d.id, title: data.title, reason: "Very similar title" });
      }
    }

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Check duplicate error:", error);
    return NextResponse.json({ matches: [] });
  }
}
