import { NextResponse } from "next/server";

type SubmitBody = {
  fullName?: unknown;
  whatsappNumber?: unknown;
  city?: unknown;
  occasionType?: unknown;
  referralSource?: unknown;
};

export async function POST(req: Request) {
  try {
    let body: SubmitBody;

    try {
      body = (await req.json()) as SubmitBody;
      console.log("Incoming body:", body);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";
    const whatsappNumber =
      typeof body.whatsappNumber === "string"
        ? body.whatsappNumber.trim()
        : "";
    const city =
      typeof body.city === "string" ? body.city.trim() : "";
    const occasionType =
      typeof body.occasionType === "string"
        ? body.occasionType.trim()
        : "";
    const referralSource =
      typeof body.referralSource === "string"
        ? body.referralSource.trim()
        : "";

    if (!fullName || !whatsappNumber || !city || !occasionType) {
      return NextResponse.json(
        {
          error:
            "fullName, whatsappNumber, city, and occasionType are required.",
        },
        { status: 400 }
      );
    }

    const scriptUrl = process.env.CLIENT_SHEET_URL;

    if (!scriptUrl) {
      console.error("CLIENT_SHEET_URL missing");
      return NextResponse.json(
        { error: "Server misconfiguration." },
        { status: 500 }
      );
    }

    const scriptRes = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        whatsappNumber,
        city,
        occasionType,
        referralSource,
      }),
    });

    if (!scriptRes.ok) {
      console.error("Webhook failed:", scriptRes.status);
      return NextResponse.json(
        { error: "Unable to forward submission right now." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submit route error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}