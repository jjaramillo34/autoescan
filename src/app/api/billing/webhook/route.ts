import { NextResponse } from "next/server";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { fulfillPaidPayment } from "@/lib/billing-fulfill";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { Payment } from "@/lib/models/Payment";

export const runtime = "nodejs";

function verifyStripeSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k, v];
    }),
  );
  const timestamp = parts.t;
  const sig = parts.v1;
  if (!timestamp || !sig) return false;

  const signed = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signed).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

/** Webhook Stripe (checkout.session.completed). Payphone puede mapearse después. */
export async function POST(request: Request) {
  const payload = await request.text();
  const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (stripeSecret) {
    const ok = verifyStripeSignature(
      payload,
      request.headers.get("stripe-signature"),
      stripeSecret,
    );
    if (!ok) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET no configurado" },
      { status: 500 },
    );
  }

  let event: {
    type?: string;
    data?: { object?: { client_reference_id?: string; metadata?: { paymentId?: string }; id?: string } };
  };
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const obj = event.data?.object;
    const paymentId =
      obj?.metadata?.paymentId || obj?.client_reference_id || "";
    if (paymentId) {
      if (isDatabaseConfigured() && obj?.id) {
        await connectDB();
        await Payment.findByIdAndUpdate(paymentId, {
          provider: "stripe",
          providerRef: obj.id,
        });
      }
      await fulfillPaidPayment(paymentId);
    }
  }

  // Evitar cache fingerprint vacío
  void createHash("sha256").update(payload).digest("hex");

  return NextResponse.json({ received: true });
}
