import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Part } from "@/lib/models/Part";
import { demoSellers } from "@/lib/admin/demo-admin";
import { demoParts } from "@/lib/demo-data";
import { findDemoUserById } from "@/lib/demo-users";
import { serializeSeller } from "@/lib/seller-profile";
import type { SellerInfo } from "@/lib/types";

export interface PublicStore extends SellerInfo {
  productCount: number;
}

export async function getPublicStores(): Promise<PublicStore[]> {
  if (!isDatabaseConfigured()) {
    return demoSellers
      .filter((s) => s.storeStatus === "active" || s.storeStatus === "pending")
      .map((s) => {
        const demo = findDemoUserById(s.id);
        const productCount = demoParts.filter((p) => {
          if (p.isArchived) return false;
          const sid = typeof p.seller === "string" ? p.seller : p.seller._id;
          return sid === s.id;
        }).length;
        const base = demo
          ? serializeSeller({
              _id: demo.id,
              name: demo.name,
              phone: demo.phone,
              whatsappPhone: demo.whatsappPhone,
              storeName: demo.storeName,
              storeLogo: demo.storeLogo,
              storeDescription: demo.storeDescription,
              storeSpecializations: demo.storeSpecializations,
              storeSector: demo.storeSector,
              businessHours: demo.businessHours,
              city: demo.city,
              province: demo.province,
            })
          : {
              _id: s.id,
              name: s.name,
              phone: s.phone,
              storeName: s.storeName,
              city: "Ambato",
              province: "Tungurahua",
            };
        return {
          ...base,
          productCount: productCount || s.productCount,
        };
      })
      .sort((a, b) => b.productCount - a.productCount);
  }

  try {
    await connectDB();
    const sellers = await User.find({
      role: { $in: ["vendedor", "admin"] },
      storeStatus: { $in: ["active", "pending"] },
    })
      .select(
        "name phone whatsappPhone storeName storeLogo storeDescription storeSpecializations storeSector businessHours city province",
      )
      .lean();

    const counts = await Part.aggregate<{ _id: unknown; count: number }>([
      { $match: { isArchived: { $ne: true } } },
      { $group: { _id: "$seller", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(
      counts.map((c) => [String(c._id), c.count as number]),
    );

    return sellers
      .map((s) => ({
        ...serializeSeller(s as Record<string, unknown>),
        productCount: countMap.get(String(s._id)) ?? 0,
      }))
      .sort((a, b) => b.productCount - a.productCount);
  } catch (error) {
    console.error("Error listando tiendas:", error);
    return getPublicStoresDemoFallback();
  }
}

function getPublicStoresDemoFallback(): PublicStore[] {
  return demoSellers
    .filter((s) => s.storeStatus === "active")
    .map((s) => {
      const demo = findDemoUserById(s.id);
      return {
        ...(demo
          ? serializeSeller({
              _id: demo.id,
              name: demo.name,
              phone: demo.phone,
              whatsappPhone: demo.whatsappPhone,
              storeName: demo.storeName,
              storeLogo: demo.storeLogo,
              storeDescription: demo.storeDescription,
              storeSpecializations: demo.storeSpecializations,
              storeSector: demo.storeSector,
              businessHours: demo.businessHours,
              city: demo.city,
              province: demo.province,
            })
          : {
              _id: s.id,
              name: s.name,
              phone: s.phone,
              storeName: s.storeName,
              city: "Ambato" as const,
              province: "Tungurahua" as const,
            }),
        productCount: s.productCount,
      };
    });
}
