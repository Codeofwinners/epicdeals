// ─── Google Gemini 2.5 Flash API Helper ──────────────────────────────────────
// Replaces OpenAI calls across all API routes.
// Docs: https://ai.google.dev/gemini-api/docs/models

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY in .env.local");
  return key;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiRequest {
  contents: GeminiContent[];
  systemInstruction?: { parts: { text: string }[] };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
}

// ─── Core Call ────────────────────────────────────────────────────────────────

export async function callGemini(opts: {
  system?: string;
  messages: { role: "user" | "model"; content: string | GeminiPart[] }[];
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  const apiKey = getApiKey();
  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  // Build contents
  const contents: GeminiContent[] = opts.messages.map((m) => ({
    role: m.role,
    parts: typeof m.content === "string" ? [{ text: m.content }] : m.content,
  }));

  const body: GeminiRequest = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.2,
      maxOutputTokens: opts.maxTokens ?? 1024,
    },
  };

  if (opts.system) {
    body.systemInstruction = { parts: [{ text: opts.system }] };
  }

  if (opts.json) {
    body.generationConfig!.responseMimeType = "application/json";
  }

  const controller = new AbortController();
  const timeout = opts.timeoutMs
    ? setTimeout(() => controller.abort(), opts.timeoutMs)
    : null;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${text}`);
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

// ─── Convenience: Text completion (like a simple chat) ───────────────────────

export async function geminiChat(opts: {
  system: string;
  prompt: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  return callGemini({
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
    json: opts.json,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
  });
}

// ─── Convenience: Image analysis ─────────────────────────────────────────────

export async function geminiImageAnalysis(opts: {
  system: string;
  prompt: string;
  imageBase64: string;
  mimeType?: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  // Strip data URL prefix if present (e.g. "data:image/jpeg;base64,...")
  let base64 = opts.imageBase64;
  let mime = opts.mimeType || "image/jpeg";

  const dataUrlMatch = base64.match(/^data:(image\/\w+);base64,(.+)$/);
  if (dataUrlMatch) {
    mime = dataUrlMatch[1];
    base64 = dataUrlMatch[2];
  }

  return callGemini({
    system: opts.system,
    messages: [
      {
        role: "user",
        content: [
          { text: opts.prompt },
          { inlineData: { mimeType: mime, data: base64 } },
        ],
      },
    ],
    json: opts.json,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
  });
}

// ─── Convenience: Multi-turn chat ────────────────────────────────────────────

export async function geminiMultiTurn(opts: {
  system: string;
  history: { role: "user" | "model"; content: string }[];
  question: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const messages = [
    ...opts.history.map((h) => ({
      role: h.role as "user" | "model",
      content: h.content,
    })),
    { role: "user" as const, content: opts.question },
  ];

  return callGemini({
    system: opts.system,
    messages,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
  });
}
