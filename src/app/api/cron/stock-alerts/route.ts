import { NextResponse } from "next/server";
import { runStockAlertCron } from "@/lib/stock-alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/** Vercel Cron / scheduler diario: marca digests de stock bajo por vendedor. */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await runStockAlertCron();
    return NextResponse.json({
      ok: true,
      scanned: result.scanned,
      flagged: result.flagged,
      sellers: result.digests.map((d) => ({
        sellerId: d.sellerId,
        storeName: d.storeName,
        lowStockCount: d.lowStockCount,
        outOfStockCount: d.outOfStockCount,
      })),
    });
  } catch (error) {
    console.error("Cron stock-alerts:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
