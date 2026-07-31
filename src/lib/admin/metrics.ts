import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Payment } from "@/lib/models/Payment";
import { AiUsage } from "@/lib/models/AiUsage";
import { AnalyticsEvent } from "@/lib/models/AnalyticsEvent";
import { Part } from "@/lib/models/Part";
import { PlatformSettings } from "@/lib/models/PlatformSettings";
import { PLANS, type PlanId } from "@/lib/plans";
import {
  demoAiLogs,
  demoAiSearches,
  demoBrands,
  demoModeration,
  demoPayments,
  demoSearches,
  demoSellers,
  demoWhatsappClicks,
  platformSettingsDemo,
  type AdminPartModeration,
  type AdminPaymentRow,
  type AdminSellerRow,
} from "@/lib/admin/demo-admin";

export interface FinancialDashboard {
  /** Annual Recurring Revenue (planes anuales). */
  arr: number;
  /** ARR / 12 — referencia. */
  mrr: number;
  activeSellers: number;
  pendingSellers: number;
  churnRate: number;
  geminiCostMonth: number;
  revenueMonth: number;
  marginPercent: number;
  aiAlert: boolean;
  aiAlertPercent: number;
  aiRequestsToday: number;
  aiRequestsMonth: number;
  whatsappClicks: number;
  aiSearches: number;
  conversionPhotoToWa: number;
}

function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

function dateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export async function getFinancialDashboard(): Promise<FinancialDashboard> {
  if (!isDatabaseConfigured()) {
    const arr = demoSellers
      .filter((s) => s.billingStatus === "active" && s.storeStatus === "active")
      .reduce((sum, s) => sum + PLANS[s.planId].priceUsdAnnual, 0);
    const mrr = Number((arr / 12).toFixed(2));

    const activeSellers = demoSellers.filter(
      (s) => s.storeStatus === "active",
    ).length;
    const pendingSellers = demoSellers.filter(
      (s) => s.storeStatus === "pending",
    ).length;
    const pastDue = demoSellers.filter(
      (s) => s.billingStatus === "past_due" || s.storeStatus === "paused",
    ).length;
    const churnRate =
      demoSellers.length > 0
        ? Math.round((pastDue / demoSellers.length) * 100)
        : 0;

    const month = monthKey();
    const today = dateKey();
    const geminiCostMonth = demoAiLogs
      .filter((l) => l.dateKey.startsWith(month))
      .reduce((s, l) => s + l.costUsd, 0);
    const aiRequestsMonth = demoAiLogs.filter((l) =>
      l.dateKey.startsWith(month),
    ).length;
    const aiRequestsToday = demoAiLogs.filter(
      (l) => l.dateKey === today,
    ).length;
    const revenueMonth = demoPayments
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + p.amountUsd, 0);

    const marginPercent =
      revenueMonth > 0
        ? Math.round(((revenueMonth - geminiCostMonth) / revenueMonth) * 100)
        : 0;

    const conversionPhotoToWa =
      demoAiSearches > 0
        ? Math.round((demoWhatsappClicks / demoAiSearches) * 100)
        : 0;

    return {
      arr,
      mrr,
      activeSellers,
      pendingSellers,
      churnRate,
      geminiCostMonth: Number(geminiCostMonth.toFixed(4)),
      revenueMonth,
      marginPercent,
      aiAlert:
        revenueMonth > 0 &&
        (geminiCostMonth / revenueMonth) * 100 >=
          platformSettingsDemo.aiCostAlertPercent,
      aiAlertPercent: platformSettingsDemo.aiCostAlertPercent,
      aiRequestsToday,
      aiRequestsMonth,
      whatsappClicks: demoWhatsappClicks,
      aiSearches: demoAiSearches,
      conversionPhotoToWa,
    };
  }

  await connectDB();
  const sellers = await User.find({ role: "vendedor" }).lean();
  const activeSellers = sellers.filter((s) => s.storeStatus === "active").length;
  const pendingSellers = sellers.filter(
    (s) => s.storeStatus === "pending",
  ).length;
  const churnPool = sellers.filter(
    (s) => s.billingStatus === "past_due" || s.billingStatus === "canceled",
  ).length;

  const arr = sellers
    .filter((s) => s.billingStatus === "active" && s.storeStatus === "active")
    .reduce((sum, s) => {
      const plan = PLANS[(s.planId as PlanId) || "basico"];
      return sum + plan.priceUsdAnnual;
    }, 0);
  const mrr = Number((arr / 12).toFixed(2));

  const mk = monthKey();
  const dk = dateKey();
  const [aiMonth, aiToday, payments, wa, aiSearch, settings] = await Promise.all([
    AiUsage.find({ monthKey: mk }),
    AiUsage.countDocuments({ dateKey: dk }),
    Payment.find({
      status: "paid",
      createdAt: { $gte: new Date(`${mk}-01T00:00:00.000Z`) },
    }),
    AnalyticsEvent.countDocuments({ type: "whatsapp_click" }),
    AnalyticsEvent.countDocuments({ type: "ai_search" }),
    PlatformSettings.findOne({ key: "default" }),
  ]);

  const geminiCostMonth = aiMonth.reduce((s, r) => s + (r.costUsd || 0), 0);
  const revenueMonth = payments.reduce((s, p) => s + p.amountUsd, 0);
  const alertPct =
    settings?.aiCostAlertPercent ?? platformSettingsDemo.aiCostAlertPercent;

  return {
    arr,
    mrr,
    activeSellers,
    pendingSellers,
    churnRate:
      sellers.length > 0 ? Math.round((churnPool / sellers.length) * 100) : 0,
    geminiCostMonth: Number(geminiCostMonth.toFixed(4)),
    revenueMonth,
    marginPercent:
      revenueMonth > 0
        ? Math.round(((revenueMonth - geminiCostMonth) / revenueMonth) * 100)
        : 0,
    aiAlert:
      revenueMonth > 0 && (geminiCostMonth / revenueMonth) * 100 >= alertPct,
    aiAlertPercent: alertPct,
    aiRequestsToday: aiToday,
    aiRequestsMonth: aiMonth.length,
    whatsappClicks: wa,
    aiSearches: aiSearch,
    conversionPhotoToWa:
      aiSearch > 0 ? Math.round((wa / aiSearch) * 100) : 0,
  };
}

export async function getAdminSellers(): Promise<AdminSellerRow[]> {
  if (!isDatabaseConfigured()) return demoSellers;

  await connectDB();
  const sellers = await User.find({ role: "vendedor" }).lean();
  const counts = await Part.aggregate([
    { $group: { _id: "$seller", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(
    counts.map((c) => [String(c._id), c.count as number]),
  );

  return sellers.map((s) => {
    const planId = (s.planId as PlanId) || "basico";
    return {
      id: String(s._id),
      name: s.name,
      email: s.email,
      storeName: s.storeName ?? "",
      phone: s.phone,
      storeStatus: (s.storeStatus as AdminSellerRow["storeStatus"]) || "pending",
      planId,
      billingStatus:
        (s.billingStatus as AdminSellerRow["billingStatus"]) || "trial",
      currentPeriodEnd: s.currentPeriodEnd
        ? new Date(s.currentPeriodEnd).toISOString()
        : "",
      productLimit: s.productLimit ?? PLANS[planId].productLimit,
      productCount: countMap.get(String(s._id)) ?? 0,
      aiCreditsIncluded: s.aiCreditsIncluded ?? PLANS[planId].aiCreditsMonthly,
      aiCreditsUsed: s.aiCreditsUsed ?? 0,
      aiCreditsExtra: s.aiCreditsExtra ?? 0,
      aiPriority: Boolean(s.aiPriority),
      featuredUntil: s.featuredUntil
        ? new Date(s.featuredUntil).toISOString()
        : undefined,
      revenueUsd: PLANS[planId].priceUsdAnnual,
      estimatedAiCostUsd: Number(
        (
          (s.aiCreditsUsed ?? 0) *
          (platformSettingsDemo.geminiCostPerRequest)
        ).toFixed(4),
      ),
    };
  });
}

export async function getAdminPayments(): Promise<AdminPaymentRow[]> {
  if (!isDatabaseConfigured()) return demoPayments;

  await connectDB();
  const payments = await Payment.find()
    .populate("seller", "storeName name")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return payments.map((p) => {
    const seller = p.seller as { storeName?: string; name?: string } | null;
    return {
      id: String(p._id),
      sellerName: seller?.storeName || seller?.name || "—",
      amountUsd: p.amountUsd,
      type: p.type,
      status: p.status,
      provider: p.provider,
      description: p.description ?? "",
      createdAt: p.createdAt
        ? new Date(p.createdAt as Date).toISOString()
        : new Date().toISOString(),
    };
  });
}

export async function getModerationQueue(): Promise<AdminPartModeration[]> {
  if (!isDatabaseConfigured()) return demoModeration;

  await connectDB();
  const parts = await Part.find({
    moderationStatus: { $in: ["pending", "reported"] },
  })
    .populate("seller", "storeName")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return parts.map((p) => {
    const seller = p.seller as { storeName?: string } | null;
    return {
      id: String(p._id),
      title: p.title,
      price: p.price,
      brand: p.brand,
      model: p.model,
      storeName: seller?.storeName ?? "—",
      moderationStatus: p.moderationStatus as AdminPartModeration["moderationStatus"],
      reportReason: p.reportReason ?? "",
      isFeatured: Boolean(p.isFeatured),
      images: Array.isArray(p.images) ? p.images.length : 0,
    };
  });
}

export async function getMarketplaceAnalytics() {
  if (!isDatabaseConfigured()) {
    return {
      topSearches: demoSearches,
      topVehicles: demoBrands,
      whatsappClicks: demoWhatsappClicks,
      aiSearches: demoAiSearches,
      conversionPhotoToWa:
        demoAiSearches > 0
          ? Math.round((demoWhatsappClicks / demoAiSearches) * 100)
          : 0,
    };
  }

  await connectDB();
  const [searches, vehicles, wa, ai] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: { type: { $in: ["search", "ai_search"] }, query: { $ne: "" } } },
      { $group: { _id: "$query", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { brand: { $ne: "" } } },
      {
        $group: {
          _id: { brand: "$brand", model: "$model" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    AnalyticsEvent.countDocuments({ type: "whatsapp_click" }),
    AnalyticsEvent.countDocuments({ type: "ai_search" }),
  ]);

  return {
    topSearches: searches.map((s) => ({
      query: String(s._id),
      count: s.count as number,
    })),
    topVehicles: vehicles.map((v) => ({
      brand: String(v._id.brand),
      model: String(v._id.model || "—"),
      count: v.count as number,
    })),
    whatsappClicks: wa,
    aiSearches: ai,
    conversionPhotoToWa: ai > 0 ? Math.round((wa / ai) * 100) : 0,
  };
}

export async function getAiControlData() {
  const dash = await getFinancialDashboard();
  const settings = isDatabaseConfigured()
    ? ((await (async () => {
        await connectDB();
        return (
          (await PlatformSettings.findOne({ key: "default" }).lean()) ??
          platformSettingsDemo
        );
      })()) as typeof platformSettingsDemo)
    : platformSettingsDemo;

  const sellers = await getAdminSellers();

  return {
    ...dash,
    settings,
    sellersCredits: sellers.map((s) => ({
      id: s.id,
      storeName: s.storeName,
      planId: s.planId,
      used: s.aiCreditsUsed,
      included: s.aiCreditsIncluded,
      extra: s.aiCreditsExtra,
      remaining: Math.max(
        0,
        s.aiCreditsIncluded + s.aiCreditsExtra - s.aiCreditsUsed,
      ),
    })),
    recentLogs: isDatabaseConfigured()
      ? await (async () => {
          await connectDB();
          const logs = await AiUsage.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();
          return logs.map((l) => ({
            id: String(l._id),
            dateKey: l.dateKey,
            costUsd: l.costUsd,
            success: l.success,
            pieza: l.pieza,
            ipHash: l.ipHash,
          }));
        })()
      : demoAiLogs.slice(0, 20),
  };
}
