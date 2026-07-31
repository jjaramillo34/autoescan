import mongoose from "mongoose";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { Part } from "@/lib/models/Part";
import { User } from "@/lib/models/User";
import { contactPhone } from "@/lib/phone";
import { buildStockAlertWhatsAppUrl } from "@/lib/whatsapp";
import { getStockStatus } from "@/lib/types";
import { demoParts } from "@/lib/demo-data";
import { DEMO_SELLER_ID } from "@/lib/constants";
import { findDemoUserById } from "@/lib/demo-users";

export interface StockAlertDigest {
  sellerId: string;
  storeName: string;
  phone: string;
  lowStockCount: number;
  outOfStockCount: number;
  items: {
    _id: string;
    title: string;
    partCode?: string;
    stockQuantity: number;
    price: number;
  }[];
  waUrl: string;
}

const COOLDOWN_MS = 20 * 60 * 60 * 1000; // 20 horas

function isLowOrOut(qty: number) {
  const s = getStockStatus(qty);
  return s === "ultimas" || s === "agotado";
}

/** Cron: marca digests para vendedores con stock crítico. */
export async function runStockAlertCron(): Promise<{
  scanned: number;
  flagged: number;
  digests: StockAlertDigest[];
}> {
  if (!isDatabaseConfigured()) {
    const demo = findDemoUserById(DEMO_SELLER_ID);
    const items = demoParts
      .filter((p) => {
        const sid = typeof p.seller === "string" ? p.seller : p.seller._id;
        return sid === DEMO_SELLER_ID && !p.isArchived && isLowOrOut(p.stockQuantity);
      })
      .slice(0, 8)
      .map((p) => ({
        _id: p._id,
        title: p.title,
        partCode: p.partCode,
        stockQuantity: p.stockQuantity,
        price: p.price,
      }));

    if (items.length === 0) {
      return { scanned: 1, flagged: 0, digests: [] };
    }

    const storeName = demo?.storeName || "Tienda demo";
    const phone = demo?.whatsappPhone || demo?.phone || "+593987654321";
    return {
      scanned: 1,
      flagged: 1,
      digests: [
        {
          sellerId: DEMO_SELLER_ID,
          storeName,
          phone,
          lowStockCount: items.filter((i) => i.stockQuantity > 0).length,
          outOfStockCount: items.filter((i) => i.stockQuantity <= 0).length,
          items,
          waUrl: buildStockAlertWhatsAppUrl({ phone, storeName, items }),
        },
      ],
    };
  }

  await connectDB();
  const sellers = await User.find({
    role: "vendedor",
    storeStatus: "active",
  })
    .select(
      "storeName name phone whatsappPhone lastStockAlertAt stockAlertPending",
    )
    .lean();

  const now = Date.now();
  const digests: StockAlertDigest[] = [];
  let flagged = 0;

  for (const seller of sellers) {
    const last = seller.lastStockAlertAt
      ? new Date(seller.lastStockAlertAt).getTime()
      : 0;
    if (last && now - last < COOLDOWN_MS) continue;

    const parts = await Part.find({
      seller: seller._id,
      isArchived: { $ne: true },
    })
      .select("title partCode stockQuantity price")
      .lean();

    const critical = parts
      .filter((p) => isLowOrOut(Number(p.stockQuantity ?? 0)))
      .sort(
        (a, b) => Number(a.stockQuantity ?? 0) - Number(b.stockQuantity ?? 0),
      );

    if (critical.length === 0) continue;

    const items = critical.slice(0, 8).map((p) => ({
      _id: String(p._id),
      title: String(p.title),
      partCode: p.partCode ? String(p.partCode) : "",
      stockQuantity: Number(p.stockQuantity ?? 0),
      price: Number(p.price ?? 0),
    }));

    const storeName = String(seller.storeName || seller.name || "Tienda");
    const phone = contactPhone({
      phone: seller.phone,
      whatsappPhone: seller.whatsappPhone,
    });

    await User.findByIdAndUpdate(seller._id, {
      lastStockAlertAt: new Date(),
      stockAlertPending: true,
    });

    flagged += 1;
    digests.push({
      sellerId: String(seller._id),
      storeName,
      phone,
      lowStockCount: items.filter((i) => i.stockQuantity > 0).length,
      outOfStockCount: items.filter((i) => i.stockQuantity <= 0).length,
      items,
      waUrl: buildStockAlertWhatsAppUrl({ phone, storeName, items }),
    });
  }

  return { scanned: sellers.length, flagged, digests };
}

export async function getSellerStockAlertBanner(sellerId: string): Promise<{
  pending: boolean;
  digest: StockAlertDigest | null;
} | null> {
  if (!sellerId) return null;

  if (!isDatabaseConfigured()) {
    const demo = findDemoUserById(DEMO_SELLER_ID);
    const items = demoParts
      .filter((p) => {
        const sid = typeof p.seller === "string" ? p.seller : p.seller._id;
        return (
          sid === sellerId && !p.isArchived && isLowOrOut(p.stockQuantity)
        );
      })
      .slice(0, 8)
      .map((p) => ({
        _id: p._id,
        title: p.title,
        partCode: p.partCode,
        stockQuantity: p.stockQuantity,
        price: p.price,
      }));
    if (items.length === 0) return { pending: false, digest: null };
    const storeName = demo?.storeName || "Tienda demo";
    const phone = demo?.whatsappPhone || demo?.phone || "+593987654321";
    return {
      pending: true,
      digest: {
        sellerId,
        storeName,
        phone,
        lowStockCount: items.filter((i) => i.stockQuantity > 0).length,
        outOfStockCount: items.filter((i) => i.stockQuantity <= 0).length,
        items,
        waUrl: buildStockAlertWhatsAppUrl({ phone, storeName, items }),
      },
    };
  }

  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(sellerId)) return null;

  const user = await User.findById(sellerId)
    .select(
      "storeName name phone whatsappPhone stockAlertPending lastStockAlertAt",
    )
    .lean();
  if (!user) return null;

  const parts = await Part.find({
    seller: sellerId,
    isArchived: { $ne: true },
  })
    .select("title partCode stockQuantity price")
    .lean();

  const critical = parts
    .filter((p) => isLowOrOut(Number(p.stockQuantity ?? 0)))
    .sort((a, b) => Number(a.stockQuantity ?? 0) - Number(b.stockQuantity ?? 0))
    .slice(0, 8)
    .map((p) => ({
      _id: String(p._id),
      title: String(p.title),
      partCode: p.partCode ? String(p.partCode) : "",
      stockQuantity: Number(p.stockQuantity ?? 0),
      price: Number(p.price ?? 0),
    }));

  if (critical.length === 0) {
    if (user.stockAlertPending) {
      await User.findByIdAndUpdate(sellerId, { stockAlertPending: false });
    }
    return { pending: false, digest: null };
  }

  const storeName = String(user.storeName || user.name || "Tienda");
  const phone = contactPhone({
    phone: user.phone,
    whatsappPhone: user.whatsappPhone,
  });

  if (!user.stockAlertPending) {
    return { pending: false, digest: null };
  }

  return {
    pending: true,
    digest: {
      sellerId,
      storeName,
      phone,
      lowStockCount: critical.filter((i) => i.stockQuantity > 0).length,
      outOfStockCount: critical.filter((i) => i.stockQuantity <= 0).length,
      items: critical,
      waUrl: buildStockAlertWhatsAppUrl({
        phone,
        storeName,
        items: critical,
      }),
    },
  };
}

export async function dismissSellerStockAlert(sellerId: string) {
  if (!isDatabaseConfigured() || !sellerId) return;
  await connectDB();
  await User.findByIdAndUpdate(sellerId, { stockAlertPending: false });
}
