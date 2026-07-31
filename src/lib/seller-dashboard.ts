import mongoose from "mongoose";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { AnalyticsEvent } from "@/lib/models/AnalyticsEvent";
import { Part } from "@/lib/models/Part";
import { User } from "@/lib/models/User";
import { findDemoUserById } from "@/lib/demo-users";
import { demoParts } from "@/lib/demo-data";
import {
  getDemoSellerInsights,
  getDemoViewStats,
  getDemoWhatsappStats,
} from "@/lib/demo-analytics";
import { getSellerAiCredits, type SellerAiCredits } from "@/lib/ai-credits";
import { PLANS, type PlanId } from "@/lib/plans";
import { DEMO_SELLER_ID } from "@/lib/constants";
import { getStockStatus } from "@/lib/types";
import { demoSearches } from "@/lib/admin/demo-admin";

export interface LowStockItem {
  _id: string;
  title: string;
  partCode?: string;
  stockQuantity: number;
  price: number;
}

export interface DailyTrendPoint {
  date: string;
  views: number;
  whatsapp: number;
}

export interface PeakHourRow {
  hour: number;
  clicks: number;
}

export interface DeadProductRow {
  partId: string;
  title: string;
  partCode?: string;
  views30: number;
  price: number;
  stockQuantity: number;
}

export interface DemandGapRow {
  query: string;
  marketCount: number;
}

export interface SellerInsights {
  daily: DailyTrendPoint[];
  peakHours: PeakHourRow[];
  deadProducts: DeadProductRow[];
  demandGaps: DemandGapRow[];
  whatsapp30Days: number;
  views30Days: number;
}

export interface SellerDashboardDTO {
  storeName: string;
  planId: PlanId;
  planName: string;
  productCount: number;
  productLimit: number;
  archivedCount: number;
  featuredSlots: number;
  featuredUsed: number;
  aiCredits: SellerAiCredits;
  whatsapp: {
    total: number;
    last7Days: number;
    topParts: { partId: string; title: string; clicks: number }[];
  };
  views: {
    total: number;
    last7Days: number;
    /** % de vistas de producto que terminan en click WhatsApp (7 días). */
    conversionViewToWa: number;
  };
  insights: SellerInsights;
  lowStock: LowStockItem[];
  outOfStockCount: number;
  disponibles: number;
}

function emptyInsights(): SellerInsights {
  return {
    daily: [],
    peakHours: [],
    deadProducts: [],
    demandGaps: [],
    whatsapp30Days: 0,
    views30Days: 0,
  };
}

function emptyDashboard(storeName: string): SellerDashboardDTO {
  const plan = PLANS.basico;
  return {
    storeName,
    planId: "basico",
    planName: plan.name,
    productCount: 0,
    productLimit: plan.productLimit,
    archivedCount: 0,
    featuredSlots: plan.featuredSlots,
    featuredUsed: 0,
    aiCredits: {
      included: PLANS.basico.aiCreditsMonthly,
      used: 0,
      extra: 0,
      remaining: PLANS.basico.aiCreditsMonthly,
      periodKey: new Date().toISOString().slice(0, 7),
      usagePercent: 0,
      softWarned: false,
      depleted: false,
    },
    whatsapp: { total: 0, last7Days: 0, topParts: [] },
    views: { total: 0, last7Days: 0, conversionViewToWa: 0 },
    insights: emptyInsights(),
    lowStock: [],
    outOfStockCount: 0,
    disponibles: 0,
  };
}

function isFeaturedActive(part: {
  isFeatured?: boolean | null;
  featuredUntil?: Date | string | null;
}) {
  if (!part.isFeatured) return false;
  if (!part.featuredUntil) return true;
  return new Date(part.featuredUntil) > new Date();
}

function toLowStock(p: {
  _id: unknown;
  title?: string;
  partCode?: string;
  stockQuantity?: number;
  price?: number;
}): LowStockItem {
  return {
    _id: String(p._id),
    title: String(p.title ?? ""),
    partCode: p.partCode ? String(p.partCode) : "",
    stockQuantity: Number(p.stockQuantity ?? 0),
    price: Number(p.price ?? 0),
  };
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildDailySeries(
  days: number,
  rows: { day: string; views: number; whatsapp: number }[],
): DailyTrendPoint[] {
  const map = new Map(rows.map((r) => [r.day, r]));
  const out: DailyTrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = dayKey(d);
    const row = map.get(key);
    out.push({
      date: key,
      views: row?.views ?? 0,
      whatsapp: row?.whatsapp ?? 0,
    });
  }
  return out;
}

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function inventoryMatchesQuery(
  query: string,
  parts: {
    title?: string;
    partCode?: string;
    partBrand?: string;
    description?: string;
    brand?: string;
    model?: string;
  }[],
) {
  const q = normalize(query);
  if (!q) return true;
  const tokens = q.split(/\s+/).filter((t) => t.length >= 3);
  const haystack = parts.map((p) =>
    normalize(
      [p.title, p.partCode, p.partBrand, p.description, p.brand, p.model]
        .filter(Boolean)
        .join(" "),
    ),
  );
  return haystack.some((h) => {
    if (h.includes(q)) return true;
    return tokens.length > 0 && tokens.every((t) => h.includes(t));
  });
}

function findDemandGaps(
  topSearches: { query: string; count: number }[],
  activeParts: {
    title?: string;
    partCode?: string;
    partBrand?: string;
    description?: string;
    brand?: string;
    model?: string;
  }[],
): DemandGapRow[] {
  return topSearches
    .filter((s) => !inventoryMatchesQuery(s.query, activeParts))
    .slice(0, 6)
    .map((s) => ({ query: s.query, marketCount: s.count }));
}

export async function getSellerDashboard(
  sellerId: string,
): Promise<SellerDashboardDTO> {
  if (!sellerId) return emptyDashboard("Tienda");

  if (!isDatabaseConfigured()) {
    return getDemoDashboard(sellerId);
  }

  try {
    await connectDB();
    const user = await User.findById(sellerId).lean();
    if (!user) return emptyDashboard("Tienda");

    const planId = (user.planId as PlanId) || "basico";
    const plan = PLANS[planId] ?? PLANS.basico;

    const parts = await Part.find({ seller: sellerId }).lean();
    const aiCredits = await getSellerAiCredits(sellerId);
    const active = parts.filter((p) => !p.isArchived);
    const featuredUsed = active.filter((p) => isFeaturedActive(p)).length;
    const lowStock = active
      .filter((p) => getStockStatus(p.stockQuantity) === "ultimas")
      .sort((a, b) => a.stockQuantity - b.stockQuantity)
      .slice(0, 8)
      .map(toLowStock);

    const outOfStockCount = active.filter(
      (p) => getStockStatus(p.stockQuantity) === "agotado",
    ).length;
    const disponibles = active.filter(
      (p) => getStockStatus(p.stockQuantity) === "disponible",
    ).length;

    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sellerOid = new mongoose.Types.ObjectId(sellerId);

    const [
      totalWa,
      last7Days,
      topAgg,
      totalViews,
      views7,
      dailyAgg,
      peakAgg,
      clicks30ByPart,
      views30ByPart,
      wa30,
      views30,
      topSearches,
    ] = await Promise.all([
      AnalyticsEvent.countDocuments({
        type: "whatsapp_click",
        sellerId: sellerOid,
      }),
      AnalyticsEvent.countDocuments({
        type: "whatsapp_click",
        sellerId: sellerOid,
        createdAt: { $gte: since7 },
      }),
      AnalyticsEvent.aggregate<{
        _id: mongoose.Types.ObjectId;
        clicks: number;
      }>([
        {
          $match: {
            type: "whatsapp_click",
            sellerId: sellerOid,
            partId: { $ne: null },
          },
        },
        { $group: { _id: "$partId", clicks: { $sum: 1 } } },
        { $sort: { clicks: -1 } },
        { $limit: 5 },
      ]),
      AnalyticsEvent.countDocuments({
        type: "part_view",
        sellerId: sellerOid,
      }),
      AnalyticsEvent.countDocuments({
        type: "part_view",
        sellerId: sellerOid,
        createdAt: { $gte: since7 },
      }),
      AnalyticsEvent.aggregate<{
        _id: string;
        views: number;
        whatsapp: number;
      }>([
        {
          $match: {
            sellerId: sellerOid,
            type: { $in: ["part_view", "whatsapp_click"] },
            createdAt: { $gte: since30 },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "America/Guayaquil",
              },
            },
            views: {
              $sum: { $cond: [{ $eq: ["$type", "part_view"] }, 1, 0] },
            },
            whatsapp: {
              $sum: { $cond: [{ $eq: ["$type", "whatsapp_click"] }, 1, 0] },
            },
          },
        },
      ]),
      AnalyticsEvent.aggregate<{ _id: number; clicks: number }>([
        {
          $match: {
            sellerId: sellerOid,
            type: "whatsapp_click",
            createdAt: { $gte: since30 },
          },
        },
        {
          $group: {
            _id: {
              $hour: { date: "$createdAt", timezone: "America/Guayaquil" },
            },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { clicks: -1 } },
      ]),
      AnalyticsEvent.aggregate<{
        _id: mongoose.Types.ObjectId;
        clicks: number;
      }>([
        {
          $match: {
            type: "whatsapp_click",
            sellerId: sellerOid,
            partId: { $ne: null },
            createdAt: { $gte: since30 },
          },
        },
        { $group: { _id: "$partId", clicks: { $sum: 1 } } },
      ]),
      AnalyticsEvent.aggregate<{
        _id: mongoose.Types.ObjectId;
        views: number;
      }>([
        {
          $match: {
            type: "part_view",
            sellerId: sellerOid,
            partId: { $ne: null },
            createdAt: { $gte: since30 },
          },
        },
        { $group: { _id: "$partId", views: { $sum: 1 } } },
      ]),
      AnalyticsEvent.countDocuments({
        type: "whatsapp_click",
        sellerId: sellerOid,
        createdAt: { $gte: since30 },
      }),
      AnalyticsEvent.countDocuments({
        type: "part_view",
        sellerId: sellerOid,
        createdAt: { $gte: since30 },
      }),
      AnalyticsEvent.aggregate<{ _id: string; count: number }>([
        {
          $match: {
            type: { $in: ["search", "ai_search"] },
            query: { $ne: "" },
            createdAt: { $gte: since30 },
          },
        },
        { $group: { _id: "$query", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 25 },
      ]),
    ]);

    const titleMap = new Map(
      parts.map((p) => [String(p._id), String(p.title)]),
    );
    const clicksMap = new Map(
      clicks30ByPart.map((r) => [String(r._id), r.clicks]),
    );
    const viewsMap = new Map(
      views30ByPart.map((r) => [String(r._id), r.views]),
    );

    const deadProducts: DeadProductRow[] = active
      .filter((p) => (clicksMap.get(String(p._id)) ?? 0) === 0)
      .map((p) => ({
        partId: String(p._id),
        title: String(p.title),
        partCode: p.partCode ? String(p.partCode) : "",
        views30: viewsMap.get(String(p._id)) ?? 0,
        price: Number(p.price ?? 0),
        stockQuantity: Number(p.stockQuantity ?? 0),
      }))
      .sort((a, b) => b.views30 - a.views30)
      .slice(0, 8);

    const demandGaps = findDemandGaps(
      topSearches.map((s) => ({
        query: String(s._id),
        count: s.count,
      })),
      active,
    );

    const peakHours: PeakHourRow[] = [...Array(24)].map((_, hour) => ({
      hour,
      clicks: peakAgg.find((p) => p._id === hour)?.clicks ?? 0,
    }));

    return {
      storeName: user.storeName || user.name,
      planId,
      planName: plan.name,
      productCount: active.length,
      productLimit: user.productLimit ?? plan.productLimit,
      archivedCount: parts.length - active.length,
      featuredSlots: plan.featuredSlots,
      featuredUsed,
      aiCredits,
      whatsapp: {
        total: totalWa,
        last7Days,
        topParts: topAgg.map((t) => ({
          partId: String(t._id),
          title: titleMap.get(String(t._id)) || "Producto",
          clicks: t.clicks,
        })),
      },
      views: {
        total: totalViews,
        last7Days: views7,
        conversionViewToWa:
          views7 > 0 ? Math.round((last7Days / views7) * 100) : 0,
      },
      insights: {
        daily: buildDailySeries(
          30,
          dailyAgg.map((d) => ({
            day: d._id,
            views: d.views,
            whatsapp: d.whatsapp,
          })),
        ),
        peakHours,
        deadProducts,
        demandGaps,
        whatsapp30Days: wa30,
        views30Days: views30,
      },
      lowStock,
      outOfStockCount,
      disponibles,
    };
  } catch (error) {
    console.error("Error dashboard vendedor:", error);
    return getDemoDashboard(sellerId);
  }
}

function getDemoDashboard(sellerId: string): SellerDashboardDTO {
  const demo = findDemoUserById(sellerId);
  const planId: PlanId = sellerId === DEMO_SELLER_ID ? "pro" : "basico";
  const plan = PLANS[planId];
  const parts = demoParts.filter((p) => {
    const sid = typeof p.seller === "string" ? p.seller : p.seller._id;
    return sid === sellerId;
  });
  const active = parts.filter((p) => !p.isArchived);
  const featuredUsed = active.filter((p) => p.isFeatured).length;
  const wa = getDemoWhatsappStats(sellerId);
  const views = getDemoViewStats(sellerId);
  const insightsBase = getDemoSellerInsights(sellerId);

  const included = plan.aiCreditsMonthly;
  const used = sellerId === DEMO_SELLER_ID ? 128 : 12;
  const extra = sellerId === DEMO_SELLER_ID ? 50 : 0;
  const remaining = Math.max(0, included + extra - used);
  const usagePercent =
    included + extra > 0
      ? Math.min(100, Math.round((used / (included + extra)) * 100))
      : 0;
  const titleMap = new Map(parts.map((p) => [p._id, p.title]));
  const clicked = new Set(wa.topPartIds);

  const deadProducts: DeadProductRow[] = active
    .filter((p) => !clicked.has(p._id))
    .slice(0, 8)
    .map((p, i) => ({
      partId: p._id,
      title: p.title,
      partCode: p.partCode,
      views30: (i * 3) % 7,
      price: p.price,
      stockQuantity: p.stockQuantity,
    }));

  const demandGaps = findDemandGaps(demoSearches, active);

  return {
    storeName: demo?.storeName || "Tienda demo",
    planId,
    planName: plan.name,
    productCount: active.length,
    productLimit: plan.productLimit,
    archivedCount: parts.length - active.length,
    featuredSlots: plan.featuredSlots,
    featuredUsed,
    aiCredits: {
      included,
      used,
      extra,
      remaining,
      periodKey: new Date().toISOString().slice(0, 7),
      usagePercent,
      softWarned: usagePercent >= 90,
      depleted: remaining <= 0,
    },
    whatsapp: {
      total: wa.total,
      last7Days: wa.last7Days,
      topParts: wa.topPartIds.map((id) => ({
        partId: id,
        title: titleMap.get(id) || "Producto",
        clicks: wa.clicksByPart[id] ?? 0,
      })),
    },
    views,
    insights: {
      ...insightsBase,
      deadProducts,
      demandGaps,
    },
    lowStock: active
      .filter((p) => getStockStatus(p.stockQuantity) === "ultimas")
      .slice(0, 8)
      .map(toLowStock),
    outOfStockCount: active.filter(
      (p) => getStockStatus(p.stockQuantity) === "agotado",
    ).length,
    disponibles: active.filter(
      (p) => getStockStatus(p.stockQuantity) === "disponible",
    ).length,
  };
}
