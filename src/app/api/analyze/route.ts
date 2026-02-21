import { NextResponse } from "next/server";
import { geminiChat, geminiMultiTurn } from "@/lib/gemini";

export const runtime = "nodejs";

type DealItem = {
  id?: string;
  title: string;
  price: number;
  originalPrice?: number;
  condition?: string;
  sellerRating?: string;
  freeShipping?: boolean;
  shippingCost?: number;
};

type ChatMessage = { role: "user" | "assistant"; content: string };

const CONDITION_MULTIPLIERS: Record<string, number> = {
  "Certified - Refurbished": 1.3,
  "Excellent - Refurbished": 1.35,
  "Very Good - Refurbished": 1.4,
  "Good - Refurbished": 1.5,
  CERTIFIED_REFURBISHED: 1.3,
  EXCELLENT_REFURBISHED: 1.35,
  VERY_GOOD_REFURBISHED: 1.4,
  GOOD_REFURBISHED: 1.5,
};

function estimateMarketValue(item: DealItem) {
  if (item.originalPrice && item.originalPrice > 0) {
    return item.originalPrice;
  }

  const multiplier = CONDITION_MULTIPLIERS[item.condition || ""] || 1.35;
  if (!Number.isFinite(item.price) || item.price <= 0) return null;
  return Math.round(item.price * multiplier);
}

function calcSavingsPercent(price: number, marketValue: number | null) {
  if (!marketValue || !Number.isFinite(price) || price <= 0) return 0;
  return Math.max(0, Math.round(((marketValue - price) / marketValue) * 100));
}

function classifyDeal(savingsPercent: number) {
  if (savingsPercent >= 40) return "Epic";
  if (savingsPercent >= 20) return "Good";
  return "Fair";
}

async function analyzeDeal(item: DealItem) {
  const estimatedMarket = estimateMarketValue(item);

  const prompt = `You are a pricing analyst. Estimate the typical market value for this product and provide a brief insight.

Listing:
- Title: ${item.title}
- Price: $${item.price}
- Condition: ${item.condition || "Unknown"}
- Original price (if shown): ${item.originalPrice ? `$${item.originalPrice}` : "Not listed"}
- Seller rating: ${item.sellerRating || "N/A"}
- Free shipping: ${item.freeShipping ? "Yes" : "No"}

Return JSON only in this format:
{
  "marketValue": 0,
  "marketValueSource": "new|refurb|recent retail",
  "priceTrend": "falling|stable|rising|uncertain",
  "confidence": "low|medium|high",
  "keyReason": "One sentence insight grounded in pricing context."
}`;

  let aiResult: {
    marketValue?: number;
    marketValueSource?: string;
    priceTrend?: string;
    confidence?: string;
    keyReason?: string;
  } = {};

  try {
    const text = await geminiChat({
      system:
        "You are a careful pricing analyst. Base estimates on typical retail or refurb market values. Respond with valid JSON only.",
      prompt,
      json: true,
      temperature: 0.2,
      maxTokens: 600,
    });

    aiResult = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    aiResult = { keyReason: `Fallback estimate used. (${message})` };
  }

  const marketValue =
    Number(aiResult.marketValue) && Number(aiResult.marketValue) > 0
      ? Number(aiResult.marketValue)
      : estimatedMarket;

  const savingsPercent = calcSavingsPercent(item.price, marketValue || null);
  const rating = classifyDeal(savingsPercent);

  return {
    rating,
    marketValue,
    marketValueSource: aiResult.marketValueSource || (item.originalPrice ? "recent retail" : "refurb"),
    priceTrend: aiResult.priceTrend || "uncertain",
    confidence: aiResult.confidence || "medium",
    keyReason:
      aiResult.keyReason ||
      "Compared against typical market value for similar refurbished listings.",
    savingsPercent,
  };
}

async function runChat(item: DealItem, question: string, history: ChatMessage[]) {
  const contextMessage = `Item context:\nTitle: ${item.title}\nPrice: $${item.price}\nCondition: ${
    item.condition || "Unknown"
  }\nOriginal price: ${item.originalPrice ? `$${item.originalPrice}` : "Not listed"}\nSeller rating: ${
    item.sellerRating || "N/A"
  }\nFree shipping: ${item.freeShipping ? "Yes" : "No"}`;

  // Convert OpenAI-style history to Gemini format
  const geminiHistory: { role: "user" | "model"; content: string }[] = [
    { role: "user", content: contextMessage },
    ...history.map((h) => ({
      role: (h.role === "assistant" ? "model" : "user") as "user" | "model",
      content: h.content,
    })),
  ];

  return geminiMultiTurn({
    system:
      "You are a Deal Expert. Answer questions about refurbished listings with concise, practical advice. If information is missing, say what would help.",
    history: geminiHistory,
    question,
    temperature: 0.3,
    maxTokens: 700,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode = body.mode || "insight";
    const item: DealItem | undefined = body.item;

    if (!item || !item.title || !Number.isFinite(item.price)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid item details." },
        { status: 400 },
      );
    }

    if (mode === "chat") {
      const question = String(body.question || "").trim();
      if (!question) {
        return NextResponse.json(
          { success: false, error: "Missing question." },
          { status: 400 },
        );
      }

      const history = Array.isArray(body.history) ? (body.history as ChatMessage[]) : [];
      const answer = await runChat(item, question, history);
      return NextResponse.json({ success: true, answer });
    }

    const analysis = await analyzeDeal(item);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
