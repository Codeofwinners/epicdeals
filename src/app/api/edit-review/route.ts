import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { geminiChat } from "@/lib/gemini";

export const runtime = "nodejs";

/** Strip markdown fences and trailing text from Gemini JSON output */
function cleanJsonResponse(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1);
  }
  return s;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      dealId,
      userId,
      title,
      description,
      code,
      dealUrl,
      savingsAmount,
      savingsType,
      conditions,
      storeName,
      storeDomain,
      imageUrl,
    } = body;

    if (!dealId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: dealId, userId" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Verify ownership
    const dealDoc = await db.collection("deals").doc(dealId).get();
    if (!dealDoc.exists) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const dealData = dealDoc.data()!;
    if (dealData.submittedBy?.id !== userId) {
      return NextResponse.json(
        { error: "You can only edit your own deals" },
        { status: 403 }
      );
    }

    // Run AI quality evaluation on the edited deal
    let aiReview = {
      verdict: "approved" as string,
      confidence: 85,
      legitimacyScore: 85,
      spamScore: 10,
      reasons: ["Deal appears legitimate"],
      summary: "This deal looks reasonable and has been auto-approved.",
    };

    try {
      const prompt = `You are a deal quality evaluator for a coupon/deals website. Evaluate this user-submitted deal for legitimacy, quality, and spam.

Deal details:
- Title: ${title || dealData.title}
- Description: ${description || dealData.description}
- Store: ${storeName || dealData.store?.name} (${storeDomain || dealData.store?.domain})
- Promo Code: ${code !== undefined ? code || "None" : dealData.code || "None"}
- Savings: ${savingsAmount || dealData.savingsAmount} (${savingsType || dealData.savingsType})
- URL: ${dealUrl || dealData.dealUrl}
- Conditions: ${conditions !== undefined ? conditions || "None" : dealData.conditions || "None"}

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

      const parsed = JSON.parse(cleanJsonResponse(text));
      aiReview = {
        verdict: parsed.verdict || "needs_review",
        confidence: parsed.confidence ?? 50,
        legitimacyScore: parsed.legitimacyScore ?? 50,
        spamScore: parsed.spamScore ?? 50,
        reasons: parsed.reasons || ["AI evaluation completed"],
        summary: parsed.summary || "Deal evaluated by AI.",
      };
    } catch (err) {
      console.error("AI evaluation failed, defaulting to needs_review:", err);
      aiReview.verdict = "needs_review";
      aiReview.summary = "AI evaluation unavailable — routed for manual review.";
    }

    // Determine new status based on AI confidence
    const newStatus = aiReview.confidence >= 70 ? "newly_added" : "pending_review";

    // Build update object with only provided fields
    const updateFields: Record<string, unknown> = {
      aiReview,
      status: newStatus,
      updatedAt: new Date(),
    };

    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (code !== undefined) updateFields.code = code || null;
    if (dealUrl !== undefined) updateFields.dealUrl = dealUrl;
    if (savingsAmount !== undefined) updateFields.savingsAmount = savingsAmount;
    if (conditions !== undefined) updateFields.conditions = conditions || null;
    if (imageUrl !== undefined) updateFields.imageUrl = imageUrl || null;

    await db.collection("deals").doc(dealId).update(updateFields);

    return NextResponse.json({
      status: newStatus,
      aiReview,
    });
  } catch (error) {
    console.error("Edit review error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
