import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { Payment } from "@/lib/models/Payment";
import { User } from "@/lib/models/User";
import { PLANS, UPSELLS, type PlanId } from "@/lib/plans";
import { demoPayments } from "@/lib/admin/demo-admin";

export async function fulfillPaidPayment(paymentId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!paymentId) return { ok: false, error: "Falta paymentId" };

  if (!isDatabaseConfigured()) {
    const row = demoPayments.find((p) => p.id === paymentId);
    if (!row) return { ok: false, error: "Pago no encontrado" };
    if (row.status === "paid") return { ok: true };
    row.status = "paid";
    return { ok: true };
  }

  await connectDB();
  const payment = await Payment.findById(paymentId);
  if (!payment) return { ok: false, error: "Pago no encontrado" };
  if (payment.status === "paid") return { ok: true };

  payment.status = "paid";
  payment.paidAt = new Date();
  await payment.save();

  const sellerId = String(payment.seller);
  const meta = (payment.meta ?? {}) as {
    planId?: PlanId;
    upsellKey?: keyof typeof UPSELLS;
  };

  if (payment.type === "subscription" && meta.planId && PLANS[meta.planId]) {
    const plan = PLANS[meta.planId];
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    await User.findByIdAndUpdate(sellerId, {
      planId: plan.id,
      billingStatus: "active",
      storeStatus: "active",
      productLimit: plan.productLimit,
      aiCreditsIncluded: plan.aiCreditsMonthly,
      aiPriority: plan.aiPriority,
      currentPeriodEnd: periodEnd,
    });
  }

  if (payment.type === "upsell_ai" || meta.upsellKey === "aiPriority") {
    const until = new Date();
    until.setDate(until.getDate() + 30);
    await User.findByIdAndUpdate(sellerId, {
      aiPriority: true,
      featuredUntil: until,
    });
  }

  if (payment.type === "upsell_banner" || meta.upsellKey === "bannerHome") {
    const until = new Date();
    until.setDate(until.getDate() + 7);
    await User.findByIdAndUpdate(sellerId, { homeBannerUntil: until });
  }

  if (
    payment.type === "upsell_destacado" ||
    meta.upsellKey === "destacado"
  ) {
    // Slots se gestionan al destacar productos; el pago queda registrado.
  }

  if (payment.type === "ai_credits") {
    await User.findByIdAndUpdate(sellerId, {
      $inc: { aiCreditsExtra: 100 },
    });
  }

  return { ok: true };
}
