import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { User } from "@/lib/models/User";
import { PLANS, type PlanId } from "@/lib/plans";

/** Descuenta 1 crédito IA del vendedor. No bloquea si llega a 0 (solo tracking). */
export async function consumeAiCredit(sellerId: string): Promise<void> {
  if (!sellerId) return;

  if (!isDatabaseConfigured()) {
    return;
  }

  try {
    await connectDB();
    await User.findByIdAndUpdate(sellerId, { $inc: { aiCreditsUsed: 1 } });
  } catch (error) {
    console.error("No se pudo descontar crédito IA:", error);
  }
}

export async function getSellerAiCredits(sellerId: string) {
  if (!isDatabaseConfigured()) {
    return {
      included: PLANS.pro.aiCreditsMonthly,
      used: 128,
      extra: 50,
      remaining: PLANS.pro.aiCreditsMonthly + 50 - 128,
    };
  }

  await connectDB();
  const user = await User.findById(sellerId).lean();
  const planId = (user?.planId as PlanId) || "basico";
  const plan = PLANS[planId];
  const included = user?.aiCreditsIncluded ?? plan.aiCreditsMonthly;
  const used = user?.aiCreditsUsed ?? 0;
  const extra = user?.aiCreditsExtra ?? 0;
  return {
    included,
    used,
    extra,
    remaining: Math.max(0, included + extra - used),
  };
}
