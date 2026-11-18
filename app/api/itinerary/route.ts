import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

type Body = {
  destination?: string;
  days?: number;
  startDate?: string;
  travelers?: string;
  budget?: string;
  pace?: string;
  interests?: string[];
  notes?: string;
};

const clean = (v: unknown, max = 200) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing GROQ_API_KEY. Add it to .env.local and restart." },
      { status: 500 }
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const destination = clean(body.destination, 100);
  const days = Math.round(Number(body.days));
  if (!destination) {
    return NextResponse.json({ error: "Please enter a destination." }, { status: 400 });
  }
  if (!Number.isFinite(days) || days < 1 || days > 14) {
    return NextResponse.json({ error: "Trip length must be 1–14 days." }, { status: 400 });
  }

  const interests = Array.isArray(body.interests)
    ? body.interests.map((i) => clean(i, 40)).filter(Boolean).slice(0, 10)
    : [];

  const details = [
    `Destination: ${destination}`,
    `Number of days: ${days}`,
    body.startDate && `Start date: ${clean(body.startDate, 20)}`,
    `Travelers: ${clean(body.travelers, 40) || "not specified"}`,
    `Budget level: ${clean(body.budget, 40) || "moderate"}`,
    `Pace: ${clean(body.pace, 40) || "balanced"}`,
    interests.length && `Interests: ${interests.join(", ")}`,
    clean(body.notes, 500) && `Extra notes: ${clean(body.notes, 500)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const system = `You are an expert travel planner. Build realistic, specific day-by-day itineraries using real place names, sensible geographic grouping, and realistic travel times.
Respond ONLY with valid JSON matching this exact shape:
{
  "title": string,
  "summary": string (2-3 sentences),
  "bestTimeToVisit": string,
  "estimatedBudget": string (total per person, local currency and USD),
  "gettingAround": string,
  "days": [
    {
      "day": number,
      "title": string,
      "morning": { "activity": string, "details": string },
      "afternoon": { "activity": string, "details": string },
      "evening": { "activity": string, "details": string },
      "food": [string, string],
      "tip": string
    }
  ],
  "packingList": [string],
  "travelTips": [string]
}
The "days" array must contain exactly the requested number of days. Keep each "details" under 40 words.`;

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        max_tokens: 12000,
        ...(MODEL.startsWith("openai/gpt-oss") && { reasoning_effort: "low" }),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Plan this trip:\n${details}` },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Groq error", res.status, text);
      const msg =
        res.status === 401
          ? "Invalid Groq API key."
          : res.status === 429
          ? "Rate limit reached. Please wait a moment and try again."
          : "The AI service returned an error. Please try again.";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "Empty response from AI." }, { status: 502 });
    }

    let itinerary;
    try {
      itinerary = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "AI returned malformed data. Please try again." },
        { status: 502 }
      );
    }
    if (!Array.isArray(itinerary?.days)) {
      return NextResponse.json(
        { error: "AI response was incomplete. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ itinerary, model: MODEL });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not reach the AI service." }, { status: 502 });
  }
}
