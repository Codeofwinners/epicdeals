import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function callOpenAI(payload: Record<string, unknown>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in .env.local");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${text}`);
  }

  return response.json();
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

    const completion = await callOpenAI({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a deal extraction assistant. Analyze screenshots of deals, coupons, promotions, and discount offers. Extract structured deal information from the image. Respond with valid JSON only.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this screenshot and extract deal information. Return JSON with these fields:
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
            },
            {
              type: "image_url",
              image_url: {
                url: image,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_completion_tokens: 800,
    });

    const text = completion.choices?.[0]?.message?.content || "{}";
    const extracted = JSON.parse(text);

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
