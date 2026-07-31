"use server";

import { revalidatePath } from "next/cache";
import { requireSellerSession } from "@/lib/session";
import {
  requestPlanUpgrade,
  requestUpsell,
  type UpsellKey,
} from "@/lib/seller-billing";
import { PLAN_IDS, type PlanId } from "@/lib/plans";

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
    revalidatePath("/vendedor/impulsos");
    revalidatePath("/admin/billing");
    return { ok: true as const, ...result };
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
    revalidatePath("/vendedor/impulsos");
    revalidatePath("/admin/billing");
    return { ok: true as const, ...result };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error ? error.message : "No se pudo crear la solicitud.",
    };
  }
}
