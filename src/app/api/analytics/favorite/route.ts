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
      saved?: boolean;
    };

    // Solo contamos el “guardar”, no el quitar.
    if (!body.partId || body.saved === false) {
      return NextResponse.json({ ok: true });
    }

    await trackAnalyticsEvent({
      type: "favorite",
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
