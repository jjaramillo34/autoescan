import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { trackAnalyticsEvent } from "@/lib/tracking";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = (await request.json()) as {
      partId?: string;
      sellerId?: string;
      query?: string;
      brand?: string;
      model?: string;
      location?: string;
      sessionId?: string;
    };

    const sessionId =
      body.sessionId?.trim() ||
      request.headers.get("x-session-id")?.trim() ||
      "";

    await trackAnalyticsEvent({
      type: "whatsapp_click",
      partId: body.partId,
      sellerId: body.sellerId,
      query: body.query,
      brand: body.brand,
      model: body.model,
      location: body.location,
      userId: session?.user?.id,
      sessionId,
      meta: {
        authenticated: Boolean(session?.user?.id),
        role: session?.user?.role ?? "anon",
      },
    });

    return NextResponse.json({
      ok: true,
      authenticated: Boolean(session?.user?.id),
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
