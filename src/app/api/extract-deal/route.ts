import { NextResponse } from "next/server";
import { geminiImageAnalysis } from "@/lib/gemini";

export const runtime = "nodejs";

/** Strip markdown fences and trailing text from Gemini JSON output */
function cleanJsonResponse(raw: string): string {
  let s = raw.trim();
  // Remove ```json ... ``` or ``` ... ``` wrappers
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  // Find first { and last } to extract the JSON object
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
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing image data." },
        { status: 400 }
      );
    }

    const text = await geminiImageAnalysis({
      system:
        "You are a deal extraction assistant. Analyze screenshots of deals, coupons, promotions, and discount offers. Extract structured deal information from the image. Respond with valid JSON only.",
      prompt: `Analyze this screenshot and extract deal information. Return JSON with these fields:
{
  "title": "concise deal title (e.g. '40% Off Select Electronics')",
  "storeName": "store or brand name if visible",
  "storeDomain": "store website domain if visible (e.g. 'nike.com'), or null",
  "description": "brief description of the deal (1-2 sentences)",
  "savingsAmount": "the discount amount as shown (e.g. '20% OFF', '$10 OFF', 'Free Month')",
  "savingsType": "one of: percent_off, dollar_off, bogo, free_shipping, free_trial, cashback",
  "code": "promo/coupon code if visible, or null",
  "dealUrl": "URL if visible in the screenshot, or null",
  "conditions": "any conditions, restrictions, or fine print if visible, or null",
  "categoryGuess": "one of: electronics, fashion, food, software, travel, health-beauty, home, entertainment, sports, automotive"
}

If you cannot determine a field, set it to null. Always try your best to extract what's visible.`,
      imageBase64: image,
      json: true,
      temperature: 0.2,
      maxTokens: 800,
    });

    const extracted = JSON.parse(cleanJsonResponse(text));

    return NextResponse.json({ success: true, extracted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Extract deal error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
