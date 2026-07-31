"use server";

import { revalidatePath } from "next/cache";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Part } from "@/lib/models/Part";
import { Payment } from "@/lib/models/Payment";
import { PlatformSettings } from "@/lib/models/PlatformSettings";
import { requireAdminSession } from "@/lib/session";
import { PLANS, type BillingStatus, type PlanId, type StoreStatus } from "@/lib/plans";
import { updateDemoSeller, platformSettingsDemo } from "@/lib/admin/demo-admin";

async function guard() {
  const session = await requireAdminSession();
  if (!session) throw new Error("No autorizado");
  return session;
}

export async function updateSellerAdminAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  const storeStatus = String(formData.get("storeStatus") ?? "") as StoreStatus;
  const planId = String(formData.get("planId") ?? "") as PlanId;
  const billingStatus = String(
    formData.get("billingStatus") ?? "",
  ) as BillingStatus;

  if (!id) return { ok: false as const, error: "Falta ID" };

  const plan = PLANS[planId] ?? PLANS.basico;

  if (!isDatabaseConfigured()) {
    updateDemoSeller(id, {
      storeStatus,
      planId,
      billingStatus,
      productLimit: plan.productLimit,
      aiCreditsIncluded: plan.aiCreditsMonthly,
      aiPriority: plan.aiPriority,
    });
    revalidatePath("/admin");
    revalidatePath("/admin/vendedores");
    return { ok: true as const };
  }

  await connectDB();
  await User.findByIdAndUpdate(id, {
    storeStatus,
    planId,
    billingStatus,
    productLimit: plan.productLimit,
    aiCreditsIncluded: plan.aiCreditsMonthly,
    aiPriority: plan.aiPriority,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/vendedores");
  return { ok: true as const };
}

export async function moderatePartAction(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as
    | "approved"
    | "rejected"
    | "reported";
  const moderationReason = String(formData.get("moderationReason") ?? "").trim();

  if (!isDatabaseConfigured()) {
    const { demoModeration } = await import("@/lib/admin/demo-admin");
    const row = demoModeration.find((p) => p.id === id);
    if (row) {
      row.moderationStatus = status;
      row.moderationReason =
        status === "rejected"
          ? moderationReason || "No cumple las normas del catálogo."
          : "";
      if (status === "approved") row.reportReason = "";
    }
    revalidatePath("/admin/moderacion");
    revalidatePath("/vendedor/inventario");
    return;
  }

  await connectDB();
  await Part.findByIdAndUpdate(id, {
    moderationStatus: status,
    ...(status === "approved"
      ? { reportReason: "", moderationReason: "" }
      : {}),
    ...(status === "rejected"
      ? {
          moderationReason:
            moderationReason || "No cumple las normas del catálogo.",
          isFeatured: false,
        }
      : {}),
  });
  revalidatePath("/admin/moderacion");
  revalidatePath("/admin/analytics");
  revalidatePath("/vendedor/inventario");
  revalidatePath("/");
}

export async function togglePartFeaturedAction(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  const featured = String(formData.get("featured") ?? "") === "true";

  if (!isDatabaseConfigured()) {
    revalidatePath("/admin/impulsos");
    revalidatePath("/admin/moderacion");
    return;
  }

  await connectDB();
  const until = new Date();
  until.setDate(until.getDate() + 30);
  await Part.findByIdAndUpdate(id, {
    isFeatured: featured,
    featuredUntil: featured ? until : null,
  });
  revalidatePath("/admin/impulsos");
  revalidatePath("/admin/moderacion");
  revalidatePath("/");
}

export async function savePlatformSettingsAction(
  formData: FormData,
): Promise<void> {
  await guard();
  const geminiCostPerRequest = Number(formData.get("geminiCostPerRequest"));
  const aiCostAlertPercent = Number(formData.get("aiCostAlertPercent"));
  const aiRateLimitPerIpHour = Number(formData.get("aiRateLimitPerIpHour"));
  const hasBudget = formData.has("geminiMonthlyBudgetUsd");
  const geminiMonthlyBudgetUsd = hasBudget
    ? Number(formData.get("geminiMonthlyBudgetUsd"))
    : undefined;
  const hasHardStop = formData.has("geminiBudgetHardStop");
  const geminiBudgetHardStop = hasHardStop
    ? String(formData.get("geminiBudgetHardStop")) === "true" ||
      String(formData.get("geminiBudgetHardStop")) === "on" ||
      String(formData.get("geminiBudgetHardStop")) === "1"
    : undefined;
  const billingProvider = String(formData.get("billingProvider") ?? "manual");
  const homeBannerText = String(formData.get("homeBannerText") ?? "");
  const hasSellerField = formData.has("homeBannerSellerId");
  const homeBannerSellerId = hasSellerField
    ? String(formData.get("homeBannerSellerId") ?? "")
    : undefined;

  if (!isDatabaseConfigured()) {
    platformSettingsDemo.geminiCostPerRequest = geminiCostPerRequest;
    platformSettingsDemo.aiCostAlertPercent = aiCostAlertPercent;
    platformSettingsDemo.aiRateLimitPerIpHour = aiRateLimitPerIpHour;
    if (geminiMonthlyBudgetUsd !== undefined && Number.isFinite(geminiMonthlyBudgetUsd)) {
      platformSettingsDemo.geminiMonthlyBudgetUsd = geminiMonthlyBudgetUsd;
    }
    if (geminiBudgetHardStop !== undefined) {
      platformSettingsDemo.geminiBudgetHardStop = geminiBudgetHardStop;
    }
    platformSettingsDemo.billingProvider =
      billingProvider as typeof platformSettingsDemo.billingProvider;
    platformSettingsDemo.homeBannerText = homeBannerText;
    if (homeBannerSellerId !== undefined) {
      platformSettingsDemo.homeBannerSellerId = homeBannerSellerId;
    }
    revalidatePath("/");
    revalidatePath("/admin/ia");
    revalidatePath("/admin/impulsos");
    revalidatePath("/admin/billing");
    return;
  }

  await connectDB();
  await PlatformSettings.findOneAndUpdate(
    { key: "default" },
    {
      geminiCostPerRequest,
      aiCostAlertPercent,
      aiRateLimitPerIpHour,
      billingProvider,
      homeBannerText,
      ...(geminiMonthlyBudgetUsd !== undefined &&
      Number.isFinite(geminiMonthlyBudgetUsd)
        ? { geminiMonthlyBudgetUsd }
        : {}),
      ...(geminiBudgetHardStop !== undefined
        ? { geminiBudgetHardStop }
        : {}),
      ...(homeBannerSellerId !== undefined ? { homeBannerSellerId } : {}),
    },
    { upsert: true },
  );

  revalidatePath("/");
  revalidatePath("/admin/ia");
  revalidatePath("/admin/impulsos");
  revalidatePath("/admin/billing");
}

export async function markPaymentPaidAction(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  const { fulfillPaidPayment } = await import("@/lib/billing-fulfill");
  await fulfillPaidPayment(id);
  revalidatePath("/admin/billing");
  revalidatePath("/admin/vendedores");
  revalidatePath("/vendedor/impulsos");
}

/** Simula webhook de cobro fallido → pausa tienda. */
export async function simulatePastDueWebhookAction(formData: FormData) {
  await guard();
  const sellerId = String(formData.get("sellerId") ?? "");

  if (!isDatabaseConfigured()) {
    updateDemoSeller(sellerId, {
      billingStatus: "past_due",
      storeStatus: "paused",
    });
    revalidatePath("/admin/vendedores");
    revalidatePath("/admin/billing");
    return { ok: true as const };
  }

  await connectDB();
  await User.findByIdAndUpdate(sellerId, {
    billingStatus: "past_due",
    storeStatus: "paused",
  });
  revalidatePath("/admin/vendedores");
  revalidatePath("/admin/billing");
  return { ok: true as const };
}
