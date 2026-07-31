"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireSellerSession } from "@/lib/session";
import {
  requestPlanUpgrade,
  requestUpsell,
  type UpsellKey,
} from "@/lib/seller-billing";
import { PLAN_IDS, type PlanId } from "@/lib/plans";
import { fulfillPaidPayment } from "@/lib/billing-fulfill";
import {
  billingAllowSimulate,
  createStripeCheckoutSession,
  isStripeConfigured,
} from "@/lib/stripe-checkout";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { Payment } from "@/lib/models/Payment";

async function originFromHeaders() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  if (!host) return process.env.AUTH_URL || "http://localhost:3000";
  return `${proto}://${host}`;
}

async function checkoutForPayment(input: {
  paymentId: string;
  amountUsd: number;
  description: string;
  sellerEmail?: string | null;
}) {
  const origin = await originFromHeaders();
  const localCheckout = `${origin}/vendedor/checkout/${input.paymentId}`;

  if (isStripeConfigured()) {
    const session = await createStripeCheckoutSession({
      paymentId: input.paymentId,
      amountUsd: input.amountUsd,
      description: input.description,
      sellerEmail: input.sellerEmail || undefined,
      successUrl: `${origin}/vendedor/checkout/${input.paymentId}?ok=1`,
      cancelUrl: localCheckout,
    });
    if ("url" in session) {
      if (isDatabaseConfigured()) {
        await connectDB();
        await Payment.findByIdAndUpdate(input.paymentId, {
          provider: "stripe",
          providerRef: session.sessionId,
          invoiceUrl: session.url,
        });
      }
      return { checkoutUrl: session.url, provider: "stripe" as const };
    }
  }

  return { checkoutUrl: localCheckout, provider: "manual" as const };
}

export async function requestPlanAction(planId: string) {
  const session = await requireSellerSession();
  if (!session) {
    return { ok: false as const, error: "Debes iniciar sesión como vendedor." };
  }
  if (!PLAN_IDS.includes(planId as PlanId)) {
    return { ok: false as const, error: "Plan no válido." };
  }

  try {
    const result = await requestPlanUpgrade(
      session.user.id,
      planId as PlanId,
    );
    const checkout = await checkoutForPayment({
      paymentId: result.payment.id,
      amountUsd: result.payment.amountUsd,
      description: result.payment.description,
      sellerEmail: session.user.email,
    });
    revalidatePath("/vendedor/impulsos");
    revalidatePath("/admin/billing");
    return { ok: true as const, ...result, ...checkout };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error ? error.message : "No se pudo crear la solicitud.",
    };
  }
}

export async function requestUpsellAction(upsellKey: string) {
  const session = await requireSellerSession();
  if (!session) {
    return { ok: false as const, error: "Debes iniciar sesión como vendedor." };
  }

  const allowed: UpsellKey[] = ["destacado", "aiPriority", "bannerHome"];
  if (!allowed.includes(upsellKey as UpsellKey)) {
    return { ok: false as const, error: "Impulso no válido." };
  }

  try {
    const result = await requestUpsell(
      session.user.id,
      upsellKey as UpsellKey,
    );
    const checkout = await checkoutForPayment({
      paymentId: result.payment.id,
      amountUsd: result.payment.amountUsd,
      description: result.payment.description,
      sellerEmail: session.user.email,
    });
    revalidatePath("/vendedor/impulsos");
    revalidatePath("/admin/billing");
    return { ok: true as const, ...result, ...checkout };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error ? error.message : "No se pudo crear la solicitud.",
    };
  }
}

export async function simulatePayAction(paymentId: string) {
  const session = await requireSellerSession();
  if (!session) {
    return { ok: false as const, error: "No autorizado." };
  }
  if (!billingAllowSimulate()) {
    return {
      ok: false as const,
      error: "La simulación de pago solo está habilitada en desarrollo.",
    };
  }

  if (isDatabaseConfigured()) {
    await connectDB();
    const payment = await Payment.findById(paymentId).lean();
    if (!payment || String(payment.seller) !== session.user.id) {
      return { ok: false as const, error: "Pago no encontrado." };
    }
  }

  const result = await fulfillPaidPayment(paymentId);
  if (!result.ok) {
    return { ok: false as const, error: result.error || "No se pudo confirmar." };
  }
  revalidatePath("/vendedor/impulsos");
  revalidatePath("/vendedor");
  revalidatePath("/admin/billing");
  return { ok: true as const };
}
