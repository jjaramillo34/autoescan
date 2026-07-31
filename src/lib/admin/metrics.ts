import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Payment } from "@/lib/models/Payment";
import { AiUsage } from "@/lib/models/AiUsage";
import { AnalyticsEvent } from "@/lib/models/AnalyticsEvent";
import { Part } from "@/lib/models/Part";
import { PlatformSettings } from "@/lib/models/PlatformSettings";
import { PLAN_IDS, PLANS, type PlanId } from "@/lib/plans";
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
import {
  getDemoCatalogQuality,
  getDemoDemandBySector,
  getDemoDemandMap,
  getDemoFavoriteCount,
  getDemoMarketplaceHealth,
  getDemoOpsAlerts,
  getDemoStoreRanking,
} from "@/lib/demo-analytics";

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

export interface StoreRankingRow {
  sellerId: string;
  storeName: string;
  views: number;
  whatsapp: number;
  conversion: number;
  sector: string;
}

export interface SectorDemandRow {
  sector: string;
  views: number;
  whatsapp: number;
}

export interface DemandMapRow {
  sector: string;
  brand: string;
  model: string;
  count: number;
}

export interface MarketplaceHealth {
  activeStores: number;
  pendingStores: number;
  storesWithLogoPct: number;
  totalActiveParts: number;
  outOfStockPct: number;
  aiCreditsBurnedPct: number;
  favorites: number;
}

export interface CatalogQuality {
  withoutPhoto: number;
  withoutCode: number;
  priceOutliers: number;
  reported: number;
  pendingReview: number;
}

export interface OpsAlert {
  id: string;
  severity: "warning" | "danger" | "info";
  message: string;
}

function median(nums: number[]) {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function countPriceOutliers(
  parts: { category?: string; price?: number }[],
): number {
  const byCat = new Map<string, number[]>();
  for (const p of parts) {
    const cat = String(p.category || "Otro");
    const list = byCat.get(cat) ?? [];
    list.push(Number(p.price ?? 0));
    byCat.set(cat, list);
  }
  let outliers = 0;
  for (const p of parts) {
    const cat = String(p.category || "Otro");
    const prices = byCat.get(cat) ?? [];
    if (prices.length < 3) continue;
    const m = median(prices);
    if (m <= 0) continue;
    const price = Number(p.price ?? 0);
    if (price > m * 3.5 || price < m * 0.2) outliers += 1;
  }
  return outliers;
}

export async function getMarketplaceAnalytics() {
  if (!isDatabaseConfigured()) {
    const partViews = getDemoStoreRanking().reduce((s, r) => s + r.views, 0);
    const wa = demoWhatsappClicks;
    return {
      topSearches: demoSearches,
      topVehicles: demoBrands,
      whatsappClicks: wa,
      aiSearches: demoAiSearches,
      partViews,
      favorites: getDemoFavoriteCount(),
      conversionPhotoToWa:
        demoAiSearches > 0 ? Math.round((wa / demoAiSearches) * 100) : 0,
      conversionViewToWa:
        partViews > 0 ? Math.round((wa / partViews) * 100) : 0,
      storeRanking: getDemoStoreRanking(),
      demandBySector: getDemoDemandBySector(),
      demandMap: getDemoDemandMap(),
      health: getDemoMarketplaceHealth(),
      catalogQuality: getDemoCatalogQuality(),
      opsAlerts: getDemoOpsAlerts(),
    };
  }

  await connectDB();
  const since14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [
    searches,
    vehicles,
    wa,
    ai,
    partViews,
    favorites,
    storeAgg,
    sectorAgg,
    demandMapAgg,
    allSellers,
    activeParts,
    sellersWithWa14,
    pendingPayments,
    financial,
  ] = await Promise.all([
    AnalyticsEvent.aggregate([
      {
        $match: {
          type: { $in: ["search", "ai_search"] },
          query: { $ne: "" },
        },
      },
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
    AnalyticsEvent.countDocuments({ type: "part_view" }),
    AnalyticsEvent.countDocuments({ type: "favorite" }),
    AnalyticsEvent.aggregate<{
      _id: unknown;
      views: number;
      whatsapp: number;
    }>([
      {
        $match: {
          type: { $in: ["part_view", "whatsapp_click"] },
          sellerId: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$sellerId",
          views: {
            $sum: { $cond: [{ $eq: ["$type", "part_view"] }, 1, 0] },
          },
          whatsapp: {
            $sum: { $cond: [{ $eq: ["$type", "whatsapp_click"] }, 1, 0] },
          },
        },
      },
      { $sort: { whatsapp: -1, views: -1 } },
      { $limit: 15 },
    ]),
    AnalyticsEvent.aggregate<{
      _id: string;
      views: number;
      whatsapp: number;
    }>([
      {
        $match: {
          type: { $in: ["part_view", "whatsapp_click"] },
          location: { $nin: ["", null] },
        },
      },
      {
        $group: {
          _id: "$location",
          views: {
            $sum: { $cond: [{ $eq: ["$type", "part_view"] }, 1, 0] },
          },
          whatsapp: {
            $sum: { $cond: [{ $eq: ["$type", "whatsapp_click"] }, 1, 0] },
          },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 12 },
    ]),
    AnalyticsEvent.aggregate<{
      _id: { location: string; brand: string; model: string };
      count: number;
    }>([
      {
        $match: {
          type: { $in: ["part_view", "search", "ai_search", "whatsapp_click"] },
          location: { $nin: ["", null] },
          brand: { $nin: ["", null] },
        },
      },
      {
        $group: {
          _id: {
            location: "$location",
            brand: "$brand",
            model: "$model",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 16 },
    ]),
    User.find({ role: "vendedor" })
      .select(
        "storeName name storeStatus storeLogo storeSector city aiCreditsUsed aiCreditsIncluded aiCreditsExtra",
      )
      .lean(),
    Part.find({ isArchived: { $ne: true } })
      .select(
        "images partCode price stockQuantity category moderationStatus seller",
      )
      .lean(),
    AnalyticsEvent.distinct("sellerId", {
      type: "whatsapp_click",
      createdAt: { $gte: since14 },
      sellerId: { $ne: null },
    }),
    Payment.countDocuments({ status: "pending" }),
    getFinancialDashboard(),
  ]);

  const sellerIds = storeAgg
    .map((r) => String(r._id))
    .filter((id) => id && id !== "undefined" && id !== "null");
  const rankingSellers = sellerIds.length
    ? await User.find({ _id: { $in: sellerIds } })
        .select("storeName name storeSector city")
        .lean()
    : [];
  const sellerMap = new Map(
    rankingSellers.map((s) => [
      String(s._id),
      {
        storeName: String(s.storeName || s.name || "Tienda"),
        sector: String(s.storeSector || s.city || "—"),
      },
    ]),
  );

  const storeRanking: StoreRankingRow[] = storeAgg.map((r) => {
    const id = String(r._id);
    const meta = sellerMap.get(id);
    const views = r.views ?? 0;
    const whatsapp = r.whatsapp ?? 0;
    return {
      sellerId: id,
      storeName: meta?.storeName ?? "Tienda",
      views,
      whatsapp,
      conversion: views > 0 ? Math.round((whatsapp / views) * 100) : 0,
      sector: meta?.sector ?? "—",
    };
  });

  const demandBySector: SectorDemandRow[] = sectorAgg.map((r) => ({
    sector: String(r._id),
    views: r.views ?? 0,
    whatsapp: r.whatsapp ?? 0,
  }));

  const demandMap: DemandMapRow[] = demandMapAgg.map((r) => ({
    sector: String(r._id.location),
    brand: String(r._id.brand),
    model: String(r._id.model || "—"),
    count: r.count,
  }));

  const activeStores = allSellers.filter(
    (s) => s.storeStatus === "active",
  ).length;
  const pendingStores = allSellers.filter(
    (s) => s.storeStatus === "pending",
  ).length;
  const withLogo = allSellers.filter(
    (s) => s.storeStatus === "active" && Boolean(s.storeLogo),
  ).length;
  const outOfStock = activeParts.filter(
    (p) => Number(p.stockQuantity ?? 0) <= 0,
  ).length;
  const creditsIncluded = allSellers.reduce(
    (s, u) =>
      s + Number(u.aiCreditsIncluded ?? 0) + Number(u.aiCreditsExtra ?? 0),
    0,
  );
  const creditsUsed = allSellers.reduce(
    (s, u) => s + Number(u.aiCreditsUsed ?? 0),
    0,
  );

  const health: MarketplaceHealth = {
    activeStores,
    pendingStores,
    storesWithLogoPct:
      activeStores > 0 ? Math.round((withLogo / activeStores) * 100) : 0,
    totalActiveParts: activeParts.length,
    outOfStockPct:
      activeParts.length > 0
        ? Math.round((outOfStock / activeParts.length) * 100)
        : 0,
    aiCreditsBurnedPct:
      creditsIncluded > 0
        ? Math.round((creditsUsed / creditsIncluded) * 100)
        : 0,
    favorites,
  };

  const catalogQuality: CatalogQuality = {
    withoutPhoto: activeParts.filter(
      (p) => !Array.isArray(p.images) || p.images.length === 0,
    ).length,
    withoutCode: activeParts.filter(
      (p) => !String(p.partCode ?? "").trim(),
    ).length,
    priceOutliers: countPriceOutliers(activeParts),
    reported: activeParts.filter((p) => p.moderationStatus === "reported")
      .length,
    pendingReview: activeParts.filter(
      (p) => p.moderationStatus === "pending",
    ).length,
  };

  const waSellerIds = new Set(
    (sellersWithWa14 as unknown[]).map((id) => String(id)),
  );
  const partsBySeller = new Map<string, number>();
  for (const p of activeParts) {
    const sid = String(p.seller);
    partsBySeller.set(sid, (partsBySeller.get(sid) ?? 0) + 1);
  }
  const silentStores = allSellers.filter((s) => {
    if (s.storeStatus !== "active") return false;
    const id = String(s._id);
    return (partsBySeller.get(id) ?? 0) > 0 && !waSellerIds.has(id);
  }).length;

  const opsAlerts: OpsAlert[] = [];
  if (financial.aiAlert) {
    opsAlerts.push({
      id: "ai-cost",
      severity: "danger",
      message: `Costo Gemini del mes supera el ${financial.aiAlertPercent}% de ingresos`,
    });
  }
  if (silentStores > 0) {
    opsAlerts.push({
      id: "silent-stores",
      severity: "warning",
      message: `${silentStores} tienda${silentStores === 1 ? "" : "s"} con inventario sin WhatsApp en 14 días`,
    });
  }
  if (pendingPayments > 0) {
    opsAlerts.push({
      id: "pending-payments",
      severity: "info",
      message: `${pendingPayments} pago${pendingPayments === 1 ? "" : "s"} pendiente${pendingPayments === 1 ? "" : "s"} (planes/impulsos)`,
    });
  }
  if (catalogQuality.reported > 0) {
    opsAlerts.push({
      id: "reported",
      severity: "warning",
      message: `${catalogQuality.reported} producto${catalogQuality.reported === 1 ? "" : "s"} reportado${catalogQuality.reported === 1 ? "" : "s"} por revisar`,
    });
  }
  if (opsAlerts.length === 0) {
    opsAlerts.push({
      id: "ok",
      severity: "info",
      message: "Sin alertas operativas críticas por ahora",
    });
  }

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
    partViews,
    favorites,
    conversionPhotoToWa: ai > 0 ? Math.round((wa / ai) * 100) : 0,
    conversionViewToWa: partViews > 0 ? Math.round((wa / partViews) * 100) : 0,
    storeRanking,
    demandBySector,
    demandMap,
    health,
    catalogQuality,
    opsAlerts,
  };
}

export async function getAiControlData() {
  const { getGlobalGeminiBudget } = await import("@/lib/gemini-budget");
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

  const [sellers, globalBudget] = await Promise.all([
    getAdminSellers(),
    getGlobalGeminiBudget(),
  ]);

  return {
    ...dash,
    settings: {
      ...platformSettingsDemo,
      ...settings,
      geminiMonthlyBudgetUsd:
        settings.geminiMonthlyBudgetUsd ??
        platformSettingsDemo.geminiMonthlyBudgetUsd,
      geminiBudgetHardStop:
        settings.geminiBudgetHardStop ??
        platformSettingsDemo.geminiBudgetHardStop,
    },
    globalBudget,
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

export interface BillingCohorts {
  trial: number;
  activePaid: number;
  pastDue: number;
  canceled: number;
  /** trial → active (aproximado: activos / (trial+activos)). */
  trialToPaidPct: number;
  churnPct: number;
  pendingPayments: number;
  paidPayments30d: number;
  revenuePendingUsd: number;
  byPlan: { planId: PlanId; count: number; name: string }[];
  trialsExpiring7d: number;
}

export async function getBillingCohorts(): Promise<BillingCohorts> {
  if (!isDatabaseConfigured()) {
    const trial = demoSellers.filter((s) => s.billingStatus === "trial").length;
    const activePaid = demoSellers.filter(
      (s) => s.billingStatus === "active",
    ).length;
    const pastDue = demoSellers.filter(
      (s) => s.billingStatus === "past_due",
    ).length;
    const canceled = demoSellers.filter(
      (s) => s.billingStatus === "canceled",
    ).length;
    const pool = trial + activePaid;
    const pendingPayments = demoPayments.filter(
      (p) => p.status === "pending",
    ).length;
    const revenuePendingUsd = demoPayments
      .filter((p) => p.status === "pending")
      .reduce((s, p) => s + p.amountUsd, 0);
    const paidPayments30d = demoPayments.filter(
      (p) => p.status === "paid",
    ).length;

    const byPlanMap = new Map<PlanId, number>();
    for (const s of demoSellers) {
      byPlanMap.set(s.planId, (byPlanMap.get(s.planId) ?? 0) + 1);
    }

    return {
      trial,
      activePaid,
      pastDue,
      canceled,
      trialToPaidPct: pool > 0 ? Math.round((activePaid / pool) * 100) : 0,
      churnPct:
        demoSellers.length > 0
          ? Math.round(((pastDue + canceled) / demoSellers.length) * 100)
          : 0,
      pendingPayments,
      paidPayments30d,
      revenuePendingUsd,
      byPlan: PLAN_IDS.map((id) => ({
        planId: id,
        count: byPlanMap.get(id) ?? 0,
        name: PLANS[id].name,
      })),
      trialsExpiring7d: 1,
    };
  }

  await connectDB();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const [sellers, pendingPayments, paidPayments30d, pendingSum, trialsExpiring] =
    await Promise.all([
      User.find({ role: "vendedor" })
        .select("billingStatus planId currentPeriodEnd")
        .lean(),
      Payment.countDocuments({ status: "pending" }),
      Payment.countDocuments({ status: "paid", createdAt: { $gte: since30 } }),
      Payment.aggregate<{ total: number }>([
        { $match: { status: "pending" } },
        { $group: { _id: null, total: { $sum: "$amountUsd" } } },
      ]),
      User.countDocuments({
        role: "vendedor",
        billingStatus: "trial",
        currentPeriodEnd: { $gte: now, $lte: in7 },
      }),
    ]);

  const trial = sellers.filter((s) => s.billingStatus === "trial").length;
  const activePaid = sellers.filter((s) => s.billingStatus === "active").length;
  const pastDue = sellers.filter((s) => s.billingStatus === "past_due").length;
  const canceled = sellers.filter((s) => s.billingStatus === "canceled").length;
  const pool = trial + activePaid;

  const byPlanMap = new Map<PlanId, number>();
  for (const s of sellers) {
    const id = (s.planId as PlanId) || "basico";
    byPlanMap.set(id, (byPlanMap.get(id) ?? 0) + 1);
  }

  return {
    trial,
    activePaid,
    pastDue,
    canceled,
    trialToPaidPct: pool > 0 ? Math.round((activePaid / pool) * 100) : 0,
    churnPct:
      sellers.length > 0
        ? Math.round(((pastDue + canceled) / sellers.length) * 100)
        : 0,
    pendingPayments,
    paidPayments30d,
    revenuePendingUsd: Number(pendingSum[0]?.total ?? 0),
    byPlan: PLAN_IDS.map((id) => ({
      planId: id,
      count: byPlanMap.get(id) ?? 0,
      name: PLANS[id].name,
    })),
    trialsExpiring7d: trialsExpiring,
  };
}
