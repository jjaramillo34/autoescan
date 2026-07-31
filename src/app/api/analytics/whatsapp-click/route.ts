import { NextResponse } from "next/server";
import { trackAnalyticsEvent } from "@/lib/tracking";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      partId?: string;
      sellerId?: string;
      query?: string;
      brand?: string;
      model?: string;
      location?: string;
    };

    await trackAnalyticsEvent({
      type: "whatsapp_click",
      partId: body.partId,
      sellerId: body.sellerId,
      query: body.query,
      brand: body.brand,
      model: body.model,
      location: body.location,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
