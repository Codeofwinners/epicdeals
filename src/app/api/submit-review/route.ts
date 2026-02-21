import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { geminiChat } from "@/lib/gemini";

export const runtime = "nodejs";

// ─── Helpers ────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[$%]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

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

// ─── Main handler ───────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      code,
      dealUrl,
      savingsType,
      savingsAmount,
      savingsValue,
      discountType,
      conditions,
      expiresAt,
      submittedBy,
      tags,
      // Store fields
      storeId,
      storeName,
      storeDomain,
      // Category
      category,
    } = body;

    // ── Validate required fields
    if (!title || !description || !dealUrl || !category) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, dealUrl, category" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // ── 1. Find or create store
    let store: { id: string; name: string; slug: string; domain: string; activeDeals: number; isFeatured: boolean };

    if (storeId) {
      // Existing store
      const storeDoc = await db.collection("stores").doc(storeId).get();
      if (!storeDoc.exists) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
      }
      const data = storeDoc.data()!;
      store = {
        id: storeDoc.id,
        name: data.name,
        slug: data.slug,
        domain: data.domain,
        activeDeals: data.activeDeals || 0,
        isFeatured: data.isFeatured || false,
      };
    } else if (storeName && storeDomain) {
      // Check if a store with this slug already exists
      const slug = slugify(storeName);
      const existing = await db
        .collection("stores")
        .where("slug", "==", slug)
        .limit(1)
        .get();

      if (!existing.empty) {
        const d = existing.docs[0];
        const data = d.data();
        store = {
          id: d.id,
          name: data.name,
          slug: data.slug,
          domain: data.domain,
          activeDeals: data.activeDeals || 0,
          isFeatured: data.isFeatured || false,
        };
      } else {
        // Create new store
        const newStoreData = {
          name: storeName,
          slug,
          domain: storeDomain.replace(/^https?:\/\//, "").replace(/\/+$/, ""),
          activeDeals: 0,
          isFeatured: false,
        };
        const ref = await db.collection("stores").add(newStoreData);
        store = { id: ref.id, ...newStoreData };
      }
    } else {
      return NextResponse.json(
        { error: "Provide either storeId (existing) or storeName + storeDomain (new)" },
        { status: 400 }
      );
    }

    const storeCreated = !storeId;

    // ── 2. Check for duplicates
    const dealsSnap = await db
      .collection("deals")
      .where("store.id", "==", store.id)
      .get();

    const now = Date.now();
    const duplicates: { id: string; title: string; reason: string }[] = [];

    for (const d of dealsSnap.docs) {
      const data = d.data();
      // Skip expired deals
      if (data.expiresAt && data.expiresAt.toDate().getTime() < now) continue;
      if (data.status === "expired") continue;

      // Check exact code match
      if (code && data.code && code.toLowerCase() === data.code.toLowerCase()) {
        duplicates.push({ id: d.id, title: data.title, reason: "Same promo code" });
        continue;
      }

      // Check exact URL match
      if (dealUrl && data.dealUrl && normalizeUrl(dealUrl) === normalizeUrl(data.dealUrl)) {
        duplicates.push({ id: d.id, title: data.title, reason: "Same deal URL" });
        continue;
      }

      // Check title overlap >= 70%
      if (title && data.title && wordOverlap(title, data.title) >= 0.7) {
        duplicates.push({ id: d.id, title: data.title, reason: "Very similar title" });
      }
    }

    if (duplicates.length > 0) {
      return NextResponse.json({
        status: "duplicate",
        matches: duplicates.slice(0, 5),
      });
    }

    // ── 3. AI quality evaluation
    let aiVerdict = "approved";
    let aiReview = {
      verdict: "approved",
      confidence: 85,
      legitimacyScore: 85,
      spamScore: 10,
      reasons: ["Deal appears legitimate"],
      summary: "This deal looks reasonable and has been auto-approved.",
    };

    try {
      const prompt = `You are a deal quality evaluator for a coupon/deals website. Evaluate this user-submitted deal for legitimacy, quality, and spam.

Deal details:
- Title: ${title}
- Description: ${description}
- Store: ${store.name} (${store.domain})
- Promo Code: ${code || "None"}
- Savings: ${savingsAmount} (${savingsType})
- URL: ${dealUrl}
- Conditions: ${conditions || "None"}

Evaluate and return JSON:
{
  "verdict": "approved" | "needs_review" | "rejected",
  "confidence": 0-100,
  "legitimacyScore": 0-100,
  "spamScore": 0-100,
  "reasons": ["reason1", "reason2"],
  "summary": "Brief one-sentence assessment"
}

Guidelines:
- confidence >= 70 → approved (legitimate, well-described deal)
- confidence 40-70 → needs_review (uncertain, needs human check)
- confidence < 40 → rejected (likely spam/scam)
- High spamScore (>60) for: unrealistic discounts (99% off), suspicious URLs, generic/spammy text
- Low legitimacyScore (<40) for: vague descriptions, no real store, too-good-to-be-true`;

      const text = await geminiChat({
        system:
          "You are a deal quality evaluator. Return valid JSON only. Be fair but catch obvious spam.",
        prompt,
        json: true,
        temperature: 0.2,
        maxTokens: 500,
      });

      const parsed = JSON.parse(text);
      aiReview = {
        verdict: parsed.verdict || "needs_review",
        confidence: parsed.confidence ?? 50,
        legitimacyScore: parsed.legitimacyScore ?? 50,
        spamScore: parsed.spamScore ?? 50,
        reasons: parsed.reasons || ["AI evaluation completed"],
        summary: parsed.summary || "Deal evaluated by AI.",
      };
      aiVerdict = aiReview.verdict;
    } catch (err) {
      console.error("AI evaluation failed, defaulting to needs_review:", err);
      aiVerdict = "needs_review";
      aiReview.verdict = "needs_review";
      aiReview.summary = "AI evaluation unavailable — routed for manual review.";
    }

    // ── 4. Determine deal status
    let dealStatus: string;
    if (aiVerdict === "approved") {
      dealStatus = "newly_added";
    } else {
      // Both needs_review and rejected go to pending_review for admin
      dealStatus = "pending_review";
    }

    // ── 5. Create the deal
    const dealSlug = `${slugify(title)}-${store.slug}`;
    const dealData: Record<string, unknown> = {
      title,
      description,
      slug: dealSlug,
      code: code || null,
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        domain: store.domain,
        activeDeals: store.activeDeals,
        isFeatured: store.isFeatured,
      },
      category,
      savingsType: savingsType || "percent_off",
      savingsAmount: savingsAmount || "",
      savingsValue: savingsValue || 0,
      discount: savingsAmount || "",
      discountType: discountType || (code ? "code" : "deal"),
      conditions: conditions || null,
      dealUrl,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      submittedBy: submittedBy || null,
      tags: tags || [],
      upvotes: 0,
      downvotes: 0,
      netVotes: 0,
      workedYes: 0,
      workedNo: 0,
      commentCount: 0,
      viewCount: 0,
      usedLastHour: 0,
      status: dealStatus,
      source: "user_submitted",
      isVerified: false,
      isTrending: false,
      isCommunityPick: false,
      createdAt: FieldValue.serverTimestamp(),
      lastVerifiedAt: FieldValue.serverTimestamp(),
      aiReview,
    };

    const dealRef = await db.collection("deals").add(dealData);

    // Increment store activeDeals count
    await db
      .collection("stores")
      .doc(store.id)
      .update({ activeDeals: FieldValue.increment(1) });

    return NextResponse.json({
      status: aiVerdict === "approved" ? "approved" : "needs_review",
      dealId: dealRef.id,
      aiVerdict,
      aiReview,
      storeCreated,
    });
  } catch (error) {
    console.error("Submit review error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
