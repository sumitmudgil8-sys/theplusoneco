import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type Body = {
  essay?: string;
  answers?: {
    name?: string;
    city?: string;
    comfort?: string;
    experience?: string;
    availability?: string;
  };
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();

    if (!body.essay || !body.answers) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { essay, answers } = body;

    const prompt = `
You are evaluating a candidate for a structured social companionship service.

This is NOT a corporate executive placement role.

The purpose of evaluation is to assess:

- Basic emotional intelligence
- Clear written English
- Social awareness
- Professional tone
- Absence of red flags

Do NOT score based on elite executive polish.
Do NOT penalize for lack of sophistication.
Do NOT expect corporate-level nuance.

A score of:
8–10 = Strong emotional awareness and clear communication
6–7 = Suitable candidate
5 or below = Weak communication, poor judgment, or concerning tone

Return ONLY valid JSON:
{
  "score": number,
  "reasoning": "short explanation"
}

Candidate Info:
City: ${answers.city}
Comfort level: ${answers.comfort}
Experience: ${answers.experience}
Availability: ${answers.availability}

Essay:
${essay}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // cost efficient + fast
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are a strict evaluator for a premium professional network.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;

    if (!raw) {
      return NextResponse.json({ score: 0 });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ score: 0 });
    }

    const score =
      typeof parsed.score === "number"
        ? Math.max(0, Math.min(10, parsed.score))
        : 0;

    return NextResponse.json({
      score,
      reasoning: parsed.reasoning ?? "",
    });
  } catch (error) {
    console.error("Evaluation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}