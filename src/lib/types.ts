import type { Categoria, SectorAmbato } from "@/lib/constants";

export interface SellerInfo {
  _id: string;
  name: string;
  phone: string;
  /** WhatsApp preferido; si falta, usar phone. */
  whatsappPhone?: string;
  storeName?: string | null;
  storeLogo?: string;
  storeDescription?: string;
  storeSpecializations?: string[];
  storeSector?: string;
  businessHours?: string;
  city?: string;
  province?: string;
}

export interface PartDTO {
  _id: string;
  title: string;
  description: string;
  /** Marca del vehículo (Chevrolet, Toyota…). */
  brand: string;
  model: string;
  yearRange: string;
  category: Categoria | string;
  /** Marca del fabricante del repuesto (Bosch, NGK…). */
  partBrand?: string;
  /** Código genérico / OEM / SKU del repuesto. */
  partCode?: string;
  price: number;
  stockQuantity: number;
  images: string[];
  location: SectorAmbato | string;
  seller: SellerInfo | string;
  isArchived?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type PartSort = "relevancia" | "precio_asc" | "precio_desc" | "recientes";

export interface PartFilters {
  brand?: string;
  model?: string;
  year?: string;
  category?: string;
  /** Sector de Ambato (ubicación del local). */
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  keywords?: string[];
  /** Filtra productos de un vendedor (banner / tienda). */
  seller?: string;
  page?: number;
  limit?: number;
  sort?: PartSort;
}

export interface PaginatedParts {
  items: PartDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IdentifyPartResult {
  pieza: string;
  categoria: string;
  keywords: string[];
  /** Confianza 0–100 estimada por el modelo. */
  confianza?: number;
  /** Alternativas si la identificación no es clara. */
  alternativas?: string[];
}

export type StockStatus = "disponible" | "ultimas" | "agotado";

export function getStockStatus(quantity: number): StockStatus {
  if (quantity <= 0) return "agotado";
  if (quantity <= 3) return "ultimas";
  return "disponible";
}
