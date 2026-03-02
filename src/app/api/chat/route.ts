import { NextResponse } from "next/server";
import { systemPrompt } from "@/lib/systemPrompt";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is not configured with OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    let body: { messages?: unknown };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: '"messages" is required and must be a non-empty array.' },
        { status: 400 }
      );
    }

    const isValidMessages = messages.every(
      (msg) =>
        msg &&
        typeof msg === "object" &&
        "role" in msg &&
        "content" in msg &&
        typeof (msg as Record<string, unknown>).role === "string" &&
        typeof (msg as Record<string, unknown>).content === "string"
    );

    if (!isValidMessages) {
      return NextResponse.json(
        {
          error:
            'Each message must be an object with string "role" and "content".',
        },
        { status: 400 }
      );
    }

    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            ...(messages as ChatMessage[]),
          ],
          temperature: 0.4,
          max_tokens: 400,
        }),
      }
    );

    const data = (await openaiRes.json()) as OpenAIChatResponse;

    if (!openaiRes.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "OpenAI request failed." },
        { status: openaiRes.status }
      );
    }

    const raw = data?.choices?.[0]?.message?.content?.trim();

    if (!raw) {
      return NextResponse.json(
        { error: "No assistant reply received." },
        { status: 502 }
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON." },
        { status: 502 }
      );
    }

    // Strict structure validation
    if (
      typeof parsed.reply !== "string" ||
      typeof parsed.qualified !== "boolean" ||
      typeof parsed.confidence_score !== "number" ||
      typeof parsed.intent_type !== "string"
    ) {
      return NextResponse.json(
        { error: "AI response structure invalid." },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}