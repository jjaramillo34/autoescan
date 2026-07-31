import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { Part } from "@/lib/models/Part";
import { User } from "@/lib/models/User";
import {
  addDemoPart,
  demoParts,
  getDemoSeller,
  removeDemoPart,
  updateDemoPart,
} from "@/lib/demo-data";
import { findDemoUserById } from "@/lib/demo-users";
import {
  CATALOG_PAGE_SIZE,
  DEMO_SELLER_ID,
  type Categoria,
  type SectorAmbato,
} from "@/lib/constants";
import { serializeSeller } from "@/lib/seller-profile";
import type {
  PaginatedParts,
  PartDTO,
  PartFilters,
  PartSort,
  SellerInfo,
} from "@/lib/types";

const SELLER_POPULATE =
  "name phone whatsappPhone storeName storeLogo storeDescription storeSpecializations storeSector businessHours city province storeStatus aiPriority";

function serializePart(doc: Record<string, unknown>): PartDTO {
  const seller = doc.seller as Record<string, unknown> | string | undefined;

  let sellerDto: PartDTO["seller"];
  if (seller && typeof seller === "object" && "_id" in seller) {
    sellerDto = serializeSeller(seller);
  } else {
    sellerDto = seller ? String(seller) : DEMO_SELLER_ID;
  }

  return {
    _id: String(doc._id),
    title: String(doc.title),
    description: String(doc.description ?? ""),
    brand: String(doc.brand),
    model: String(doc.model),
    yearRange: String(doc.yearRange),
    category: String(doc.category),
    partBrand: doc.partBrand ? String(doc.partBrand) : "",
    partCode: doc.partCode ? String(doc.partCode) : "",
    price: Number(doc.price),
    stockQuantity: Number(doc.stockQuantity),
    images: Array.isArray(doc.images) ? (doc.images as string[]) : [],
    location: String(doc.location),
    seller: sellerDto,
    isArchived: Boolean(doc.isArchived),
    isFeatured: Boolean(doc.isFeatured),
    moderationStatus: (doc.moderationStatus as PartDTO["moderationStatus"]) ||
      "approved",
    moderationReason: doc.moderationReason
      ? String(doc.moderationReason)
      : "",
    createdAt: doc.createdAt
      ? new Date(doc.createdAt as string).toISOString()
      : undefined,
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt as string).toISOString()
      : undefined,
  };
}

/** Normaliza texto para búsqueda (sin acentos, minúsculas). */
function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function buildSearchTerms(filters: PartFilters): string[] {
  const fromKeywords = filters.keywords ?? [];
  const fromQuery = filters.q
    ? filters.q.split(/[\s,]+/).filter((t) => t.length >= 3)
    : [];

  const phrases = [...fromKeywords, ...(filters.q ? [filters.q] : [])];

  return [...new Set([...phrases, ...fromQuery])]
    .map(normalizeText)
    .filter(Boolean);
}

function filterDemoParts(filters: PartFilters = {}): PartDTO[] {
  const terms = buildSearchTerms(filters);
  // Si hay búsqueda por texto/IA, no forzar categoría (Gemini a veces clasifica distinto).
  const applyCategory = Boolean(filters.category) && terms.length === 0;

  return demoParts.filter((part) => {
    if (part.isArchived) return false;
    if (part.moderationStatus === "rejected") return false;
    if (filters.seller) {
      const sid =
        typeof part.seller === "string" ? part.seller : part.seller._id;
      if (sid !== filters.seller) return false;
    }
    if (
      filters.brand &&
      normalizeText(part.brand) !== normalizeText(filters.brand)
    ) {
      return false;
    }
    if (
      filters.model &&
      !normalizeText(part.model).includes(normalizeText(filters.model))
    ) {
      return false;
    }
    if (applyCategory && part.category !== filters.category) {
      return false;
    }
    if (filters.year) {
      const year = Number(filters.year);
      const [from, to] = part.yearRange.split("-").map((y) => Number(y.trim()));
      if (!Number.isNaN(year) && !Number.isNaN(from) && !Number.isNaN(to)) {
        if (year < from || year > to) return false;
      } else if (!part.yearRange.includes(filters.year)) {
        return false;
      }
    }
    if (
      filters.location &&
      normalizeText(part.location) !== normalizeText(filters.location)
    ) {
      return false;
    }
    if (
      typeof filters.minPrice === "number" &&
      !Number.isNaN(filters.minPrice) &&
      part.price < filters.minPrice
    ) {
      return false;
    }
    if (
      typeof filters.maxPrice === "number" &&
      !Number.isNaN(filters.maxPrice) &&
      part.price > filters.maxPrice
    ) {
      return false;
    }

    if (terms.length === 0) return true;

    const haystack = normalizeText(
      [
        part.title,
        part.description,
        part.brand,
        part.model,
        part.category,
        part.partBrand ?? "",
        part.partCode ?? "",
      ].join(" "),
    );

    return terms.some((term) => haystack.includes(term));
  });
}

function sortParts(parts: PartDTO[], sort: PartSort = "relevancia"): PartDTO[] {
  const copy = [...parts];
  switch (sort) {
    case "precio_asc":
      return copy.sort((a, b) => a.price - b.price);
    case "precio_desc":
      return copy.sort((a, b) => b.price - a.price);
    case "recientes":
      return copy.sort((a, b) => {
        const da = a.createdAt ? Date.parse(a.createdAt) : 0;
        const db = b.createdAt ? Date.parse(b.createdAt) : 0;
        if (db !== da) return db - da;
        return b._id.localeCompare(a._id);
      });
    default:
      return copy;
  }
}

function paginateParts(
  parts: PartDTO[],
  page: number,
  pageSize: number,
): PaginatedParts {
  const total = parts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: parts.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

function resolveSellerInfo(sellerId: string): SellerInfo {
  const demoUser = findDemoUserById(sellerId);
  if (demoUser) {
    return serializeSeller({
      _id: demoUser.id,
      name: demoUser.name,
      phone: demoUser.phone,
      whatsappPhone: demoUser.whatsappPhone,
      storeName: demoUser.storeName,
      storeLogo: demoUser.storeLogo,
      storeDescription: demoUser.storeDescription,
      storeSpecializations: demoUser.storeSpecializations,
      storeSector: demoUser.storeSector,
      businessHours: demoUser.businessHours,
      city: demoUser.city,
      province: demoUser.province,
    });
  }
  return getDemoSeller();
}

async function ensureSellerExists(sellerId: string) {
  if (!mongoose.Types.ObjectId.isValid(sellerId)) return;
  await connectDB();
  const existing = await User.findById(sellerId);
  if (existing) return existing;

  if (sellerId === DEMO_SELLER_ID) {
    return User.create({
      _id: new mongoose.Types.ObjectId(DEMO_SELLER_ID),
      name: "Carlos Mendoza",
      email: "vendedor@autoescan.ec",
      passwordHash: await bcrypt.hash("Vendedor123!", 12),
      role: "vendedor",
      phone: "+593987654321",
      city: "Ambato",
      province: "Tungurahua",
      storeName: "Repuestos Ambato Center",
    });
  }
}

export async function getParts(
  filters: PartFilters = {},
): Promise<PaginatedParts> {
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(
    48,
    Math.max(1, Number(filters.limit) || CATALOG_PAGE_SIZE),
  );
  const sort: PartSort = filters.sort ?? "relevancia";

  if (!isDatabaseConfigured()) {
    const sorted = sortParts(filterDemoParts(filters), sort);
    return paginateParts(sorted, page, pageSize);
  }

  try {
    await connectDB();

    const query: Record<string, unknown> = {
      isArchived: { $ne: true },
      moderationStatus: { $ne: "rejected" },
    };
    const terms = buildSearchTerms(filters);

    if (filters.seller && mongoose.Types.ObjectId.isValid(filters.seller)) {
      query.seller = new mongoose.Types.ObjectId(filters.seller);
    }
    if (filters.brand) query.brand = new RegExp(`^${filters.brand}$`, "i");
    if (filters.model) query.model = new RegExp(filters.model, "i");
    if (filters.location) {
      const escaped = filters.location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.location = new RegExp(`^${escaped}$`, "i");
    }
    if (
      typeof filters.minPrice === "number" ||
      typeof filters.maxPrice === "number"
    ) {
      const price: Record<string, number> = {};
      if (typeof filters.minPrice === "number" && !Number.isNaN(filters.minPrice)) {
        price.$gte = filters.minPrice;
      }
      if (typeof filters.maxPrice === "number" && !Number.isNaN(filters.maxPrice)) {
        price.$lte = filters.maxPrice;
      }
      if (Object.keys(price).length > 0) query.price = price;
    }
    // Con búsqueda por IA/texto no forzar categoría (evita Motor vs Eléctrico).
    if (filters.category && terms.length === 0) {
      query.category = filters.category;
    }

    if (filters.year) {
      const year = Number(filters.year);
      if (!Number.isNaN(year)) {
        query.$expr = {
          $and: [
            {
              $lte: [
                {
                  $toInt: {
                    $arrayElemAt: [{ $split: ["$yearRange", "-"] }, 0],
                  },
                },
                year,
              ],
            },
            {
              $gte: [
                {
                  $toInt: {
                    $arrayElemAt: [{ $split: ["$yearRange", "-"] }, 1],
                  },
                },
                year,
              ],
            },
          ],
        };
      }
    }

    if (terms.length > 0) {
      const accentInsensitive = (term: string) =>
        term
          .replace(/a/g, "[aá]")
          .replace(/e/g, "[eé]")
          .replace(/i/g, "[ií]")
          .replace(/o/g, "[oó]")
          .replace(/u/g, "[uú]");

      query.$or = terms.flatMap((term) => {
        const pattern = accentInsensitive(
          term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        );
        const regex = new RegExp(pattern, "i");
        return [
          { title: regex },
          { description: regex },
          { brand: regex },
          { model: regex },
          { category: regex },
          { partBrand: regex },
          { partCode: regex },
        ];
      });
    }

    const mongoSort: Record<string, 1 | -1> =
      sort === "precio_asc"
        ? { price: 1 }
        : sort === "precio_desc"
          ? { price: -1 }
          : sort === "recientes"
            ? { createdAt: -1 }
            : { isFeatured: -1, createdAt: -1 };

    const parts = await Part.find(query)
      .populate("seller", SELLER_POPULATE)
      .sort(mongoSort)
      .lean();

    // Ocultar catálogo de tiendas pausadas/baneadas; priorizar aiPriority.
    const visible = parts.filter((p) => {
      const seller = p.seller as { storeStatus?: string } | null;
      if (!seller?.storeStatus) return true;
      return seller.storeStatus === "active" || seller.storeStatus === "pending";
    });

    if (sort === "relevancia") {
      visible.sort((a, b) => {
        const aPri = Boolean(
          (a.seller as { aiPriority?: boolean } | null)?.aiPriority,
        );
        const bPri = Boolean(
          (b.seller as { aiPriority?: boolean } | null)?.aiPriority,
        );
        if (aPri === bPri) return 0;
        return aPri ? -1 : 1;
      });
    }

    const serialized = visible.map((p) =>
      serializePart(p as Record<string, unknown>),
    );
    return paginateParts(serialized, page, pageSize);
  } catch (error) {
    console.error("Error al consultar MongoDB, usando datos demo:", error);
    const sorted = sortParts(filterDemoParts(filters), sort);
    return paginateParts(sorted, page, pageSize);
  }
}

export async function getPartById(id: string): Promise<PartDTO | null> {
  if (!id) return null;

  if (!isDatabaseConfigured()) {
    return demoParts.find((p) => p._id === id && !p.isArchived) ?? null;
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return demoParts.find((p) => p._id === id && !p.isArchived) ?? null;
    }
    await connectDB();
    const part = await Part.findById(id)
      .populate("seller", SELLER_POPULATE)
      .lean();
    if (!part || part.isArchived || part.moderationStatus === "rejected") {
      return null;
    }

    const seller = part.seller as { storeStatus?: string } | null;
    if (
      seller?.storeStatus &&
      seller.storeStatus !== "active" &&
      seller.storeStatus !== "pending"
    ) {
      return null;
    }

    return serializePart(part as Record<string, unknown>);
  } catch {
    return demoParts.find((p) => p._id === id && !p.isArchived) ?? null;
  }
}

export async function getPartsByIds(ids: string[]): Promise<PartDTO[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];

  if (!isDatabaseConfigured()) {
    const map = new Map(demoParts.map((p) => [p._id, p]));
    return unique.map((id) => map.get(id)).filter(Boolean) as PartDTO[];
  }

  try {
    await connectDB();
    const objectIds = unique.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const parts = await Part.find({
      _id: { $in: objectIds },
      isArchived: { $ne: true },
      moderationStatus: { $ne: "rejected" },
    })
      .populate("seller", SELLER_POPULATE)
      .lean();
    const map = new Map(
      parts.map((p) => [
        String(p._id),
        serializePart(p as Record<string, unknown>),
      ]),
    );
    // Incluir ids demo si Mongo no los tiene
    for (const id of unique) {
      if (!map.has(id)) {
        const demo = demoParts.find((p) => p._id === id);
        if (demo) map.set(id, demo);
      }
    }
    return unique.map((id) => map.get(id)).filter(Boolean) as PartDTO[];
  } catch {
    const map = new Map(demoParts.map((p) => [p._id, p]));
    return unique.map((id) => map.get(id)).filter(Boolean) as PartDTO[];
  }
}

export async function getRelatedParts(
  part: PartDTO,
  limit = 4,
): Promise<PartDTO[]> {
  const sellerId =
    typeof part.seller === "string" ? part.seller : part.seller._id;

  const [byVehicle, byStore] = await Promise.all([
    getParts({
      brand: part.brand,
      category: part.category,
      limit: limit + 8,
      page: 1,
      sort: "relevancia",
    }),
    getParts({
      seller: sellerId,
      limit: limit + 4,
      page: 1,
      sort: "relevancia",
    }),
  ]);

  const seen = new Set<string>([part._id]);
  const related: PartDTO[] = [];

  for (const candidate of [...byVehicle.items, ...byStore.items]) {
    if (seen.has(candidate._id)) continue;
    seen.add(candidate._id);
    related.push(candidate);
    if (related.length >= limit) break;
  }

  return related;
}

export async function getPublicSeller(
  sellerId: string,
): Promise<SellerInfo | null> {
  if (!sellerId) return null;

  if (!isDatabaseConfigured()) {
    const demo = findDemoUserById(sellerId);
    if (demo) return resolveSellerInfo(demo.id);
    const fromPart = demoParts.find((p) => {
      const sid = typeof p.seller === "string" ? p.seller : p.seller._id;
      return sid === sellerId;
    });
    if (fromPart && typeof fromPart.seller !== "string") {
      return fromPart.seller;
    }
    return sellerId === DEMO_SELLER_ID ? resolveSellerInfo(sellerId) : null;
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      const demo = findDemoUserById(sellerId);
      return demo ? resolveSellerInfo(demo.id) : null;
    }
    await connectDB();
    const seller = await User.findById(sellerId).lean();
    if (!seller || (seller.role !== "vendedor" && seller.role !== "admin")) {
      return null;
    }
    if (
      seller.storeStatus &&
      seller.storeStatus !== "active" &&
      seller.storeStatus !== "pending"
    ) {
      return null;
    }
    return serializeSeller(seller as Record<string, unknown>);
  } catch {
    return resolveSellerInfo(sellerId);
  }
}

export async function getSellerParts(sellerId: string): Promise<PartDTO[]> {
  if (!isDatabaseConfigured()) {
    return demoParts.filter((p) => {
      const sid = typeof p.seller === "string" ? p.seller : p.seller._id;
      return sid === sellerId;
    });
  }

  try {
    await connectDB();
    const parts = await Part.find({ seller: sellerId })
      .populate(
        "seller",
        "name phone whatsappPhone storeName storeLogo city province",
      )
      .sort({ isArchived: 1, updatedAt: -1 })
      .lean();
    return parts.map((p) => serializePart(p as Record<string, unknown>));
  } catch {
    return demoParts.filter((p) => {
      const sid = typeof p.seller === "string" ? p.seller : p.seller._id;
      return sid === sellerId;
    });
  }
}

export type UpdatePartInventoryData = {
  price?: number;
  stockQuantity?: number;
  images?: string[];
  partBrand?: string;
  partCode?: string;
  description?: string;
};

export async function updatePartInventory(
  id: string,
  data: UpdatePartInventoryData,
  sellerId: string,
): Promise<PartDTO | null> {
  const patch: UpdatePartInventoryData = { ...data };
  if (patch.partBrand !== undefined) {
    patch.partBrand = patch.partBrand.trim();
  }
  if (patch.partCode !== undefined) {
    patch.partCode = patch.partCode.trim().toUpperCase();
  }
  if (patch.description !== undefined) {
    patch.description = patch.description.trim();
  }

  if (!isDatabaseConfigured()) {
    const part = demoParts.find((p) => p._id === id);
    if (!part) return null;
    const sid = typeof part.seller === "string" ? part.seller : part.seller._id;
    if (sid !== sellerId) return null;
    return updateDemoPart(id, patch);
  }

  await connectDB();
  const updated = await Part.findOneAndUpdate(
    { _id: id, seller: sellerId },
    { $set: patch },
    { new: true },
  )
    .populate(
      "seller",
      "name phone whatsappPhone storeName storeLogo storeDescription storeSpecializations storeSector businessHours city province",
    )
    .lean();

  return updated ? serializePart(updated as Record<string, unknown>) : null;
}

export interface CreatePartInput {
  title: string;
  description?: string;
  brand: string;
  model: string;
  yearRange: string;
  category: string;
  partBrand?: string;
  partCode?: string;
  price: number;
  stockQuantity: number;
  images?: string[];
  location: string;
  sellerId?: string;
}

export async function createPart(input: CreatePartInput): Promise<PartDTO> {
  const sellerId = input.sellerId ?? DEMO_SELLER_ID;
  const partBrand = input.partBrand?.trim() ?? "";
  const partCode = input.partCode?.trim().toUpperCase() ?? "";

  if (!isDatabaseConfigured()) {
    return addDemoPart({
      title: input.title,
      description: input.description ?? "",
      brand: input.brand,
      model: input.model,
      yearRange: input.yearRange,
      category: input.category,
      partBrand,
      partCode,
      price: input.price,
      stockQuantity: input.stockQuantity,
      images: input.images?.length
        ? input.images
        : [
            "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
          ],
      location: input.location,
      seller: resolveSellerInfo(sellerId),
    });
  }

  await ensureSellerExists(sellerId);

  const created = await Part.create({
    title: input.title,
    description: input.description ?? "",
    brand: input.brand,
    model: input.model,
    yearRange: input.yearRange,
    category: input.category as Categoria,
    partBrand,
    partCode,
    price: input.price,
    stockQuantity: input.stockQuantity,
    images: input.images ?? [],
    location: input.location as SectorAmbato,
    seller: new mongoose.Types.ObjectId(sellerId),
  });

  const populated = await Part.findById(created._id)
    .populate(
      "seller",
      "name phone whatsappPhone storeName storeLogo storeDescription storeSpecializations storeSector businessHours city province",
    )
    .lean();

  return serializePart(populated as Record<string, unknown>);
}

export async function createManyParts(
  inputs: CreatePartInput[],
  sellerId: string,
): Promise<PartDTO[]> {
  const created: PartDTO[] = [];
  for (const input of inputs) {
    created.push(await createPart({ ...input, sellerId }));
  }
  return created;
}

export interface UpsertPartsResult {
  created: PartDTO[];
  updated: PartDTO[];
}

/** Crea o actualiza por código OEM (mismo vendedor). Sin código → siempre crea. */
export async function upsertPartsForSeller(
  inputs: CreatePartInput[],
  sellerId: string,
): Promise<UpsertPartsResult> {
  const created: PartDTO[] = [];
  const updated: PartDTO[] = [];

  for (const input of inputs) {
    const code = input.partCode?.trim().toUpperCase() ?? "";
    if (!code) {
      created.push(await createPart({ ...input, sellerId }));
      continue;
    }

    if (!isDatabaseConfigured()) {
      const existing = demoParts.find((p) => {
        const sid = typeof p.seller === "string" ? p.seller : p.seller._id;
        return (
          sid === sellerId &&
          (p.partCode ?? "").toUpperCase() === code &&
          !p.isArchived
        );
      });
      if (existing) {
        const next = await updatePart(
          existing._id,
          { ...input, partCode: code, sellerId },
          sellerId,
        );
        if (next) updated.push(next);
      } else {
        created.push(await createPart({ ...input, partCode: code, sellerId }));
      }
      continue;
    }

    await connectDB();
    const existing = await Part.findOne({
      seller: sellerId,
      partCode: code,
      isArchived: { $ne: true },
    }).lean();

    if (existing) {
      const next = await updatePart(
        String(existing._id),
        { ...input, partCode: code, sellerId },
        sellerId,
      );
      if (next) updated.push(next);
    } else {
      created.push(await createPart({ ...input, partCode: code, sellerId }));
    }
  }

  return { created, updated };
}

export type UpdatePartData = CreatePartInput & {
  isArchived?: boolean;
};

export async function updatePart(
  id: string,
  input: UpdatePartData,
  sellerId: string,
): Promise<PartDTO | null> {
  const partBrand = input.partBrand?.trim() ?? "";
  const partCode = input.partCode?.trim().toUpperCase() ?? "";
  const patch = {
    title: input.title.trim(),
    description: (input.description ?? "").trim(),
    brand: input.brand.trim(),
    model: input.model.trim(),
    yearRange: input.yearRange.trim(),
    category: input.category as Categoria,
    partBrand,
    partCode,
    price: input.price,
    stockQuantity: input.stockQuantity,
    images: (input.images ?? []).slice(0, 5),
    location: input.location as SectorAmbato,
    ...(input.isArchived !== undefined
      ? { isArchived: input.isArchived }
      : {}),
  };

  if (!isDatabaseConfigured()) {
    const part = demoParts.find((p) => p._id === id);
    if (!part) return null;
    const sid = typeof part.seller === "string" ? part.seller : part.seller._id;
    if (sid !== sellerId) return null;
    return updateDemoPart(id, patch);
  }

  await connectDB();
  const updated = await Part.findOneAndUpdate(
    { _id: id, seller: sellerId },
    { $set: patch },
    { new: true },
  )
    .populate("seller", SELLER_POPULATE)
    .lean();

  return updated ? serializePart(updated as Record<string, unknown>) : null;
}

export async function setPartArchived(
  id: string,
  sellerId: string,
  archived: boolean,
): Promise<PartDTO | null> {
  if (!isDatabaseConfigured()) {
    const part = demoParts.find((p) => p._id === id);
    if (!part) return null;
    const sid = typeof part.seller === "string" ? part.seller : part.seller._id;
    if (sid !== sellerId) return null;
    return updateDemoPart(id, { isArchived: archived });
  }

  await connectDB();
  const updated = await Part.findOneAndUpdate(
    { _id: id, seller: sellerId },
    { $set: { isArchived: archived } },
    { new: true },
  )
    .populate("seller", SELLER_POPULATE)
    .lean();

  return updated ? serializePart(updated as Record<string, unknown>) : null;
}

export async function deletePart(
  id: string,
  sellerId: string,
): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    const part = demoParts.find((p) => p._id === id);
    if (!part) return false;
    const sid = typeof part.seller === "string" ? part.seller : part.seller._id;
    if (sid !== sellerId) return false;
    return removeDemoPart(id);
  }

  await connectDB();
  const result = await Part.deleteOne({ _id: id, seller: sellerId });
  return result.deletedCount > 0;
}

export async function countFeaturedParts(sellerId: string): Promise<number> {
  const now = new Date();
  if (!isDatabaseConfigured()) {
    return demoParts.filter((p) => {
      const sid = typeof p.seller === "string" ? p.seller : p.seller._id;
      return sid === sellerId && !p.isArchived && p.isFeatured;
    }).length;
  }

  await connectDB();
  return Part.countDocuments({
    seller: sellerId,
    isArchived: { $ne: true },
    isFeatured: true,
    $or: [
      { featuredUntil: null },
      { featuredUntil: { $exists: false } },
      { featuredUntil: { $gt: now } },
    ],
  });
}

export async function setPartFeatured(
  id: string,
  sellerId: string,
  featured: boolean,
): Promise<PartDTO | null> {
  const until = new Date();
  until.setDate(until.getDate() + 30);

  if (!isDatabaseConfigured()) {
    const part = demoParts.find((p) => p._id === id);
    if (!part) return null;
    const sid = typeof part.seller === "string" ? part.seller : part.seller._id;
    if (sid !== sellerId) return null;
    return updateDemoPart(id, {
      isFeatured: featured,
    });
  }

  await connectDB();
  const updated = await Part.findOneAndUpdate(
    { _id: id, seller: sellerId },
    {
      $set: {
        isFeatured: featured,
        featuredUntil: featured ? until : null,
      },
    },
    { new: true },
  )
    .populate("seller", SELLER_POPULATE)
    .lean();

  return updated ? serializePart(updated as Record<string, unknown>) : null;
}

export async function duplicatePart(
  id: string,
  sellerId: string,
): Promise<PartDTO | null> {
  let source: PartDTO | null = null;

  if (!isDatabaseConfigured()) {
    const part = demoParts.find((p) => p._id === id);
    if (!part) return null;
    const sid = typeof part.seller === "string" ? part.seller : part.seller._id;
    if (sid !== sellerId) return null;
    source = part;
  } else {
    await connectDB();
    const doc = await Part.findOne({ _id: id, seller: sellerId }).lean();
    if (!doc) return null;
    source = serializePart(doc as Record<string, unknown>);
  }

  return createPart({
    title: `${source.title} (copia)`,
    description: source.description,
    brand: source.brand,
    model: source.model,
    yearRange: source.yearRange,
    category: source.category,
    partBrand: source.partBrand,
    partCode: source.partCode,
    price: source.price,
    stockQuantity: source.stockQuantity,
    images: source.images,
    location: source.location,
    sellerId,
  });
}
