import mongoose from "mongoose";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { AnalyticsEvent } from "@/lib/models/AnalyticsEvent";
import { Part } from "@/lib/models/Part";
import { User } from "@/lib/models/User";
import { findDemoUserById } from "@/lib/demo-users";
import { demoParts } from "@/lib/demo-data";
import { getDemoWhatsappStats } from "@/lib/demo-analytics";
import { PLANS, type PlanId } from "@/lib/plans";
import { DEMO_SELLER_ID } from "@/lib/constants";
import { getStockStatus } from "@/lib/types";

export interface LowStockItem {
  _id: string;
  title: string;
  partCode?: string;
  stockQuantity: number;
  price: number;
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
  aiCredits: {
    included: number;
    used: number;
    extra: number;
    remaining: number;
  };
  whatsapp: {
    total: number;
    last7Days: number;
    topParts: { partId: string; title: string; clicks: number }[];
  };
  lowStock: LowStockItem[];
  outOfStockCount: number;
  disponibles: number;
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
    aiCredits: { included: 80, used: 0, extra: 0, remaining: 80 },
    whatsapp: { total: 0, last7Days: 0, topParts: [] },
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
    const included = user.aiCreditsIncluded ?? plan.aiCreditsMonthly;
    const used = user.aiCreditsUsed ?? 0;
    const extra = user.aiCreditsExtra ?? 0;

    const parts = await Part.find({ seller: sellerId }).lean();
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
    const sellerOid = new mongoose.Types.ObjectId(sellerId);

    const [totalWa, last7Days, topAgg] = await Promise.all([
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
    ]);

    const titleMap = new Map(
      parts.map((p) => [String(p._id), String(p.title)]),
    );

    return {
      storeName: user.storeName || user.name,
      planId,
      planName: plan.name,
      productCount: active.length,
      productLimit: user.productLimit ?? plan.productLimit,
      archivedCount: parts.length - active.length,
      featuredSlots: plan.featuredSlots,
      featuredUsed,
      aiCredits: {
        included,
        used,
        extra,
        remaining: Math.max(0, included + extra - used),
      },
      whatsapp: {
        total: totalWa,
        last7Days,
        topParts: topAgg.map((t) => ({
          partId: String(t._id),
          title: titleMap.get(String(t._id)) || "Producto",
          clicks: t.clicks,
        })),
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

  const included = plan.aiCreditsMonthly;
  const used = sellerId === DEMO_SELLER_ID ? 128 : 12;
  const extra = sellerId === DEMO_SELLER_ID ? 50 : 0;
  const titleMap = new Map(parts.map((p) => [p._id, p.title]));

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
      remaining: Math.max(0, included + extra - used),
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
