import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { AiUsage } from "@/lib/models/AiUsage";
import { PlatformSettings } from "@/lib/models/PlatformSettings";
import {
  DEFAULT_GEMINI_COST_PER_REQUEST,
  DEFAULT_GEMINI_MONTHLY_BUDGET_USD,
} from "@/lib/plans";
import { platformSettingsDemo } from "@/lib/admin/demo-admin";

export type GlobalGeminiBudget = {
  spentUsd: number;
  budgetUsd: number;
  usagePercent: number;
  softWarned: boolean;
  hardStopped: boolean;
  hardStopEnabled: boolean;
  remainingUsd: number;
  costPerRequest: number;
};

function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

export async function getGlobalGeminiBudget(): Promise<GlobalGeminiBudget> {
  if (!isDatabaseConfigured()) {
    const spent = platformSettingsDemo.geminiCostPerRequest * 40;
    const budget =
      platformSettingsDemo.geminiMonthlyBudgetUsd ??
      DEFAULT_GEMINI_MONTHLY_BUDGET_USD;
    const usagePercent =
      budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
    return {
      spentUsd: Number(spent.toFixed(4)),
      budgetUsd: budget,
      usagePercent,
      softWarned: usagePercent >= 80,
      hardStopped: false,
      hardStopEnabled: platformSettingsDemo.geminiBudgetHardStop !== false,
      remainingUsd: Math.max(0, Number((budget - spent).toFixed(4))),
      costPerRequest: platformSettingsDemo.geminiCostPerRequest,
    };
  }

  await connectDB();
  const [settings, spentAgg] = await Promise.all([
    PlatformSettings.findOne({ key: "default" }).lean(),
    AiUsage.aggregate<{ total: number }>([
      { $match: { monthKey: monthKey() } },
      { $group: { _id: null, total: { $sum: "$costUsd" } } },
    ]),
  ]);

  const budget =
    settings?.geminiMonthlyBudgetUsd ?? DEFAULT_GEMINI_MONTHLY_BUDGET_USD;
  const spent = Number(spentAgg[0]?.total ?? 0);
  const hardStopEnabled = settings?.geminiBudgetHardStop !== false;
  const usagePercent =
    budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  return {
    spentUsd: Number(spent.toFixed(4)),
    budgetUsd: budget,
    usagePercent,
    softWarned: usagePercent >= 80,
    hardStopped: hardStopEnabled && spent >= budget,
    hardStopEnabled,
    remainingUsd: Math.max(0, Number((budget - spent).toFixed(4))),
    costPerRequest:
      settings?.geminiCostPerRequest ?? DEFAULT_GEMINI_COST_PER_REQUEST,
  };
}

/** Gate para búsquedas por foto (costo plataforma). */
export async function assertGlobalGeminiBudget(): Promise<
  { ok: true; budget: GlobalGeminiBudget } | { ok: false; error: string; budget: GlobalGeminiBudget }
> {
  const budget = await getGlobalGeminiBudget();
  if (budget.hardStopped) {
    return {
      ok: false,
      budget,
      error:
        "El cupo mensual de búsquedas por foto de AutoEscán se agotó. Intenta más tarde o mañana.",
    };
  }
  return { ok: true, budget };
}
