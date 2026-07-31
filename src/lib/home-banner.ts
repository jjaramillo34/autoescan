import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { User } from "@/lib/models/User";
import { PlatformSettings } from "@/lib/models/PlatformSettings";
import {
  demoSellers,
  platformSettingsDemo,
} from "@/lib/admin/demo-admin";
import { DEMO_SELLER_ID } from "@/lib/constants";
import { findDemoUserById } from "@/lib/demo-users";
import { contactPhone } from "@/lib/phone";

export interface HomeBannerDTO {
  text: string;
  storeName: string;
  sellerId: string;
  phone: string;
  location: string;
  logoUrl?: string;
  tagline: string;
  until?: string;
}

export async function getHomeBanner(): Promise<HomeBannerDTO | null> {
  if (!isDatabaseConfigured()) {
    if (!platformSettingsDemo.homeBannerText) return null;
    const seller =
      demoSellers.find(
        (s) => s.id === platformSettingsDemo.homeBannerSellerId,
      ) ?? demoSellers[0];
    const demoUser = findDemoUserById(seller?.id ?? DEMO_SELLER_ID);

    return {
      text: platformSettingsDemo.homeBannerText,
      storeName: seller?.storeName ?? "Tienda destacada",
      sellerId: seller?.id ?? DEMO_SELLER_ID,
      phone: demoUser
        ? contactPhone(demoUser)
        : (seller?.phone ?? "+593987654321"),
      location: demoUser?.storeSector
        ? `${demoUser.storeSector}, Ambato`
        : "Ambato, Tungurahua",
      logoUrl: demoUser?.storeLogo || undefined,
      tagline: "Anuncio destacado · Envíos en Tungurahua",
      until: platformSettingsDemo.homeBannerUntil,
    };
  }

  await connectDB();
  const settings = await PlatformSettings.findOne({ key: "default" }).lean();
  if (!settings?.homeBannerText) return null;

  if (settings.homeBannerUntil && new Date(settings.homeBannerUntil) < new Date()) {
    return null;
  }

  const sellerId = settings.homeBannerSellerId || DEMO_SELLER_ID;
  const seller = await User.findById(sellerId).lean();

  return {
    text: settings.homeBannerText,
    storeName: seller?.storeName || seller?.name || "Tienda destacada",
    sellerId,
    phone: seller
      ? contactPhone({
          phone: seller.phone,
          whatsappPhone: seller.whatsappPhone ?? "",
        })
      : "+593987654321",
    location: seller?.storeSector
      ? `${seller.storeSector}, ${seller.city || "Ambato"}`
      : `${seller?.city || "Ambato"}, ${seller?.province || "Tungurahua"}`,
    logoUrl: seller?.storeLogo || undefined,
    tagline: "Anuncio destacado en AutoEscán",
    until: settings.homeBannerUntil
      ? new Date(settings.homeBannerUntil).toISOString()
      : undefined,
  };
}
