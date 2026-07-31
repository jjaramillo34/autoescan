import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { Part } from "@/lib/models/Part";
import { demoParts } from "@/lib/demo-data";

export interface PriceCompareOffer {
  partId: string;
  storeName: string;
  sellerId: string;
  title: string;
  price: number;
  stockQuantity: number;
  location: string;
  partBrand?: string;
}

export interface PriceCompareGroup {
  partCode: string;
  offers: PriceCompareOffer[];
  minPrice: number;
  maxPrice: number;
  spreadPct: number;
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function buildGroups(
  rows: {
    partId: string;
    partCode: string;
    title: string;
    price: number;
    stockQuantity: number;
    location: string;
    partBrand?: string;
    storeName: string;
    sellerId: string;
  }[],
): PriceCompareGroup[] {
  const map = new Map<string, PriceCompareOffer[]>();

  for (const r of rows) {
    const code = normalizeCode(r.partCode);
    if (!code) continue;
    const list = map.get(code) ?? [];
    list.push({
      partId: r.partId,
      storeName: r.storeName,
      sellerId: r.sellerId,
      title: r.title,
      price: r.price,
      stockQuantity: r.stockQuantity,
      location: r.location,
      partBrand: r.partBrand,
    });
    map.set(code, list);
  }

  return [...map.entries()]
    .map(([partCode, offers]) => {
      const prices = offers.map((o) => o.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const spreadPct =
        minPrice > 0
          ? Math.round(((maxPrice - minPrice) / minPrice) * 100)
          : 0;
      return {
        partCode,
        offers: offers.sort((a, b) => a.price - b.price),
        minPrice,
        maxPrice,
        spreadPct,
      };
    })
    .filter((g) => g.offers.length >= 2)
    .sort((a, b) => b.spreadPct - a.spreadPct || b.offers.length - a.offers.length);
}

export async function getPriceComparisons(): Promise<PriceCompareGroup[]> {
  if (!isDatabaseConfigured()) {
    const rows = demoParts
      .filter((p) => !p.isArchived && p.partCode)
      .map((p) => {
        const seller =
          typeof p.seller === "string"
            ? { _id: p.seller, storeName: "Tienda demo" }
            : p.seller;
        return {
          partId: p._id,
          partCode: p.partCode || "",
          title: p.title,
          price: p.price,
          stockQuantity: p.stockQuantity,
          location: p.location,
          partBrand: p.partBrand,
          storeName: seller.storeName || "Tienda",
          sellerId: seller._id,
        };
      });

    // Demo: duplicar un par de códigos con precio distinto para ver el comparador.
    if (rows.length >= 2) {
      const base = rows[0];
      rows.push({
        ...base,
        partId: `${base.partId}-alt`,
        price: Number((base.price * 1.18).toFixed(2)),
        storeName: "AutoPartes Ficoa",
        sellerId: "000000000000000000000002",
        location: "Ficoa",
      });
      const base2 = rows[1];
      rows.push({
        ...base2,
        partId: `${base2.partId}-alt`,
        price: Number((base2.price * 0.92).toFixed(2)),
        storeName: "Repuestos Huachi",
        sellerId: "000000000000000000000003",
        location: "Huachi Chico",
      });
    }

    return buildGroups(rows);
  }

  await connectDB();
  const parts = await Part.find({
    isArchived: { $ne: true },
    partCode: { $nin: ["", null] },
  })
    .populate("seller", "storeName name storeStatus")
    .select("title partCode partBrand price stockQuantity location seller")
    .lean();

  const rows = parts
    .filter((p) => {
      const seller = p.seller as
        | { storeStatus?: string; storeName?: string; name?: string; _id?: unknown }
        | string
        | null;
      if (!seller || typeof seller === "string") return true;
      return seller.storeStatus !== "banned" && seller.storeStatus !== "paused";
    })
    .map((p) => {
      const seller = p.seller as
        | { _id?: unknown; storeName?: string; name?: string }
        | string;
      const sellerObj = typeof seller === "string" ? null : seller;
      return {
        partId: String(p._id),
        partCode: String(p.partCode ?? ""),
        title: String(p.title),
        price: Number(p.price ?? 0),
        stockQuantity: Number(p.stockQuantity ?? 0),
        location: String(p.location ?? ""),
        partBrand: p.partBrand ? String(p.partBrand) : "",
        storeName: String(
          sellerObj?.storeName || sellerObj?.name || "Tienda",
        ),
        sellerId: String(sellerObj?._id ?? seller ?? ""),
      };
    });

  return buildGroups(rows);
}
