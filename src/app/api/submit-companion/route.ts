export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const requiredFields = [
      "fullName",
      "age",
      "city",
      "phone",
      "languages",
      "education",
      "whyFit",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }
    }

    const res = await fetch(process.env.COMPANION_SHEET_WEBHOOK!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Sheet submission failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Submission error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}