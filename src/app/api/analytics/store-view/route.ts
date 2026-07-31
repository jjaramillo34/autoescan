import { NextResponse } from "next/server";
import { trackAnalyticsEvent } from "@/lib/tracking";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sellerId?: string;
      location?: string;
      query?: string;
    };

    if (!body.sellerId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await trackAnalyticsEvent({
      type: "store_view",
      sellerId: body.sellerId,
      location: body.location,
      query: body.query,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
