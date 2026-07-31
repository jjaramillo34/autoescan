import { PLANS, UPSELLS, type PlanId } from "@/lib/plans";

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function billingAllowSimulate() {
  return (
    process.env.BILLING_ALLOW_SIMULATE === "1" ||
    process.env.NODE_ENV !== "production"
  );
}

/** Crea Checkout Session vía API REST (sin SDK). */
export async function createStripeCheckoutSession(input: {
  paymentId: string;
  amountUsd: number;
  description: string;
  sellerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; sessionId: string } | { error: string }> {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) return { error: "Stripe no configurado" };

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", input.successUrl);
  params.set("cancel_url", input.cancelUrl);
  params.set("client_reference_id", input.paymentId);
  params.set("metadata[paymentId]", input.paymentId);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set(
    "line_items[0][price_data][unit_amount]",
    String(Math.round(input.amountUsd * 100)),
  );
  params.set(
    "line_items[0][price_data][product_data][name]",
    input.description.slice(0, 120),
  );
  if (input.sellerEmail) params.set("customer_email", input.sellerEmail);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = (await res.json()) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };

  if (!res.ok || !data.url || !data.id) {
    return {
      error: data.error?.message || "No se pudo crear la sesión de Stripe",
    };
  }

  return { url: data.url, sessionId: data.id };
}

export function planCheckoutLabel(planId: PlanId) {
  return `Plan ${PLANS[planId].name} anual`;
}

export function upsellCheckoutLabel(key: keyof typeof UPSELLS) {
  return UPSELLS[key].name;
}
