import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { User } from "@/lib/models/User";
import { PLANS, type PlanId } from "@/lib/plans";

/** Aviso suave cuando se usa ≥ 90% del cupo mensual. */
export const AI_CREDIT_SOFT_RATIO = 0.9;

export type SellerAiCredits = {
  included: number;
  used: number;
  extra: number;
  remaining: number;
  periodKey: string;
  usagePercent: number;
  softWarned: boolean;
  depleted: boolean;
};

function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

function toStatus(input: {
  included: number;
  used: number;
  extra: number;
  periodKey: string;
}): SellerAiCredits {
  const total = Math.max(0, input.included + input.extra);
  const used = Math.max(0, input.used);
  const remaining = Math.max(0, total - used);
  const usagePercent =
    total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return {
    included: input.included,
    used,
    extra: input.extra,
    remaining,
    periodKey: input.periodKey,
    usagePercent,
    softWarned: total > 0 && used / total >= AI_CREDIT_SOFT_RATIO,
    depleted: remaining <= 0,
  };
}

/**
 * Si cambió el mes (YYYY-MM), reinicia `aiCreditsUsed` y sincroniza
 * la cuota incluida con el plan actual. Los extras no se borran.
 */
export async function ensureSellerCreditsPeriod(
  sellerId: string,
): Promise<void> {
  if (!sellerId || !isDatabaseConfigured()) return;

  const key = monthKey();
  await connectDB();
  const user = await User.findById(sellerId)
    .select("planId aiCreditsPeriodKey aiCreditsIncluded")
    .lean();
  if (!user) return;

  if (user.aiCreditsPeriodKey === key) return;

  const planId = (user.planId as PlanId) || "basico";
  const included = PLANS[planId]?.aiCreditsMonthly ?? PLANS.basico.aiCreditsMonthly;

  await User.findByIdAndUpdate(sellerId, {
    aiCreditsUsed: 0,
    aiCreditsPeriodKey: key,
    aiCreditsIncluded: included,
  });
}

export async function getSellerAiCredits(
  sellerId: string,
): Promise<SellerAiCredits> {
  const key = monthKey();

  if (!isDatabaseConfigured()) {
    return toStatus({
      included: PLANS.pro.aiCreditsMonthly,
      used: 128,
      extra: 50,
      periodKey: key,
    });
  }

  await ensureSellerCreditsPeriod(sellerId);
  await connectDB();
  const user = await User.findById(sellerId).lean();
  const planId = (user?.planId as PlanId) || "basico";
  const plan = PLANS[planId] ?? PLANS.basico;

  return toStatus({
    included: user?.aiCreditsIncluded ?? plan.aiCreditsMonthly,
    used: user?.aiCreditsUsed ?? 0,
    extra: user?.aiCreditsExtra ?? 0,
    periodKey: (user?.aiCreditsPeriodKey as string) || key,
  });
}

export async function assertCanConsumeAiCredit(
  sellerId: string,
): Promise<{ ok: true; credits: SellerAiCredits } | { ok: false; error: string; credits: SellerAiCredits }> {
  const credits = await getSellerAiCredits(sellerId);
  if (credits.depleted) {
    return {
      ok: false,
      credits,
      error:
        "Se agotaron tus créditos IA de este mes. Espera el próximo ciclo o pide un pack extra en Impulsos.",
    };
  }
  return { ok: true, credits };
}

/**
 * Descuenta 1 crédito de forma atómica. Falla si el cupo del mes está lleno.
 */
export async function consumeAiCredit(
  sellerId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!sellerId) {
    return { ok: false, error: "Falta vendedor." };
  }

  if (!isDatabaseConfigured()) {
    return { ok: true };
  }

  try {
    await ensureSellerCreditsPeriod(sellerId);
    await connectDB();

    const updated = await User.findOneAndUpdate(
      {
        _id: sellerId,
        $expr: {
          $lt: [
            "$aiCreditsUsed",
            { $add: ["$aiCreditsIncluded", "$aiCreditsExtra"] },
          ],
        },
      },
      { $inc: { aiCreditsUsed: 1 } },
      { new: true },
    );

    if (!updated) {
      return {
        ok: false,
        error:
          "Se agotaron tus créditos IA de este mes. Espera el próximo ciclo o pide un pack extra en Impulsos.",
      };
    }
    return { ok: true };
  } catch (error) {
    console.error("No se pudo descontar crédito IA:", error);
    return { ok: false, error: "No se pudo descontar el crédito IA." };
  }
}
