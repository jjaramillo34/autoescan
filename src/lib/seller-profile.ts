import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { User } from "@/lib/models/User";
import {
  findDemoUserById,
  updateDemoUser,
  type DemoAuthUser,
} from "@/lib/demo-users";
import { isValidEcuadorMobile } from "@/lib/phone";
import type { SellerInfo } from "@/lib/types";
import type { SectorAmbato } from "@/lib/constants";

export interface StoreProfileInput {
  storeName: string;
  name: string;
  phone: string;
  whatsappPhone?: string;
  storeLogo?: string;
  storeDescription?: string;
  storeSpecializations?: string[];
  storeSector?: string;
  businessHours?: string;
  city?: string;
  province?: string;
}

export { contactPhone } from "@/lib/phone";

export function serializeSeller(doc: Record<string, unknown>): SellerInfo {
  return {
    _id: String(doc._id),
    name: String(doc.name ?? ""),
    phone: String(doc.phone ?? ""),
    whatsappPhone: doc.whatsappPhone ? String(doc.whatsappPhone) : "",
    storeName: doc.storeName ? String(doc.storeName) : null,
    storeLogo: doc.storeLogo ? String(doc.storeLogo) : "",
    storeDescription: doc.storeDescription
      ? String(doc.storeDescription)
      : "",
    storeSpecializations: Array.isArray(doc.storeSpecializations)
      ? (doc.storeSpecializations as string[]).map(String)
      : [],
    storeSector: doc.storeSector ? String(doc.storeSector) : "",
    businessHours: doc.businessHours ? String(doc.businessHours) : "",
    city: doc.city ? String(doc.city) : undefined,
    province: doc.province ? String(doc.province) : undefined,
  };
}

function serializeDemoUser(user: DemoAuthUser): SellerInfo {
  return {
    _id: user.id,
    name: user.name,
    phone: user.phone,
    whatsappPhone: user.whatsappPhone ?? "",
    storeName: user.storeName,
    storeLogo: user.storeLogo ?? "",
    storeDescription: user.storeDescription ?? "",
    storeSpecializations: user.storeSpecializations ?? [],
    storeSector: user.storeSector ?? "",
    businessHours: user.businessHours ?? "",
    city: user.city,
    province: user.province,
  };
}

export async function getSellerProfile(
  sellerId: string,
): Promise<SellerInfo | null> {
  if (!sellerId) return null;

  if (!isDatabaseConfigured()) {
    const demo = findDemoUserById(sellerId);
    return demo ? serializeDemoUser(demo) : null;
  }

  await connectDB();
  const seller = await User.findById(sellerId).lean();
  if (!seller) return null;
  return serializeSeller(seller as Record<string, unknown>);
}

export async function updateSellerProfile(
  sellerId: string,
  input: StoreProfileInput,
): Promise<SellerInfo | null> {
  const storeName = input.storeName.trim();
  const name = input.name.trim();
  const phone = input.phone.trim();
  const whatsappPhone = (input.whatsappPhone ?? "").trim();
  const storeLogo = (input.storeLogo ?? "").trim();
  const storeDescription = (input.storeDescription ?? "").trim();
  const storeSpecializations = (input.storeSpecializations ?? [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
  const storeSector = (input.storeSector ?? "").trim() as SectorAmbato | "";
  const businessHours = (input.businessHours ?? "").trim().slice(0, 120);
  const city = (input.city ?? "Ambato").trim() || "Ambato";
  const province = (input.province ?? "Tungurahua").trim() || "Tungurahua";

  if (!storeName || !name) {
    throw new Error("Nombre de la tienda y contacto son obligatorios.");
  }
  if (!isValidEcuadorMobile(phone)) {
    throw new Error("El teléfono debe ser formato +593XXXXXXXXX.");
  }
  if (whatsappPhone && !isValidEcuadorMobile(whatsappPhone)) {
    throw new Error("WhatsApp debe ser formato +593XXXXXXXXX.");
  }

  const patch = {
    storeName,
    name,
    phone,
    whatsappPhone,
    storeLogo,
    storeDescription,
    storeSpecializations,
    storeSector,
    businessHours,
    city,
    province,
  };

  if (!isDatabaseConfigured()) {
    const updated = updateDemoUser(sellerId, patch);
    return updated ? serializeDemoUser(updated) : null;
  }

  await connectDB();
  const updated = await User.findByIdAndUpdate(
    sellerId,
    { $set: patch },
    { new: true },
  ).lean();

  return updated
    ? serializeSeller(updated as Record<string, unknown>)
    : null;
}
