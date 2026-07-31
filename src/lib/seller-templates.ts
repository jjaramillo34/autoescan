import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { Part } from "@/lib/models/Part";
import { User } from "@/lib/models/User";
import { demoParts } from "@/lib/demo-data";
import { findDemoUserById } from "@/lib/demo-users";
import type { TemplateProductOption } from "@/lib/whatsapp-templates";

export async function getSellerPartsForTemplates(sellerId: string): Promise<{
  storeName: string;
  products: TemplateProductOption[];
}> {
  if (!isDatabaseConfigured()) {
    const demo = findDemoUserById(sellerId);
    const products = demoParts
      .filter((p) => {
        const sid = typeof p.seller === "string" ? p.seller : p.seller._id;
        return sid === sellerId && !p.isArchived;
      })
      .slice(0, 40)
      .map((p) => ({
        id: p._id,
        title: p.title,
        partCode: p.partCode,
        price: p.price,
        brand: p.brand,
        model: p.model,
        location: p.location,
      }));
    return {
      storeName: demo?.storeName || "Tienda",
      products,
    };
  }

  await connectDB();
  const [user, parts] = await Promise.all([
    User.findById(sellerId).select("storeName name").lean(),
    Part.find({ seller: sellerId, isArchived: { $ne: true } })
      .sort({ updatedAt: -1 })
      .limit(60)
      .select("title partCode price brand model location")
      .lean(),
  ]);

  return {
    storeName: String(user?.storeName || user?.name || "Tienda"),
    products: parts.map((p) => ({
      id: String(p._id),
      title: String(p.title),
      partCode: p.partCode ? String(p.partCode) : "",
      price: Number(p.price ?? 0),
      brand: String(p.brand ?? ""),
      model: String(p.model ?? ""),
      location: String(p.location ?? ""),
    })),
  };
}
