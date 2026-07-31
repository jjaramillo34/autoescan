export const CATEGORIAS = [
  "Motor",
  "Suspensión",
  "Frenos",
  "Eléctrico",
  "Carrocería",
  "Transmisión",
  "Otro",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const SECTORES_AMBATO = [
  "Centro de Ambato",
  "Ficoa",
  "Huachi Chico",
  "Huachi Grande",
  "Atocha",
  "Miraflores",
  "La Merced",
  "Izamba",
] as const;

export type SectorAmbato = (typeof SECTORES_AMBATO)[number];

/** Especializaciones típicas de locales de repuestos. */
export const ESPECIALIZACIONES = [
  "Frenos",
  "Motor y sensores",
  "Suspensión",
  "Eléctrico",
  "Japoneses",
  "Coreanos",
  "Europeos",
  "Filtros y aceites",
  "Carrocería",
  "Transmisión",
  "Mayorista",
  "General",
] as const;

export type Especializacion = (typeof ESPECIALIZACIONES)[number];

export const MARCAS_COMUNES = [
  "Chevrolet",
  "Toyota",
  "Hyundai",
  "Kia",
  "Nissan",
  "Mazda",
  "Volkswagen",
  "Ford",
  "Suzuki",
  "Honda",
  "Great Wall",
  "Chery",
] as const;

/** Marcas frecuentes del fabricante del repuesto (no del vehículo). */
export const MARCAS_REPUESTO = [
  "OEM / Original",
  "ACDelco",
  "Bosch",
  "NGK",
  "Denso",
  "TRW",
  "Monroe",
  "KYB",
  "Gates",
  "Mann-Filter",
  "Mahle",
  "Valeo",
  "Philips",
  "Generic / Genérico",
  "Otro",
] as const;

export const USER_ROLES = ["comprador", "vendedor", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Vendedor demo para piloto local (sin autenticación aún). */
export const DEMO_SELLER_ID = "000000000000000000000001";

/** Máximo de fotos por producto en catálogo / inventario. */
export const MAX_PART_IMAGES = 5;

/** Productos por página en el catálogo público. */
export const CATALOG_PAGE_SIZE = 12;

/** Filas por página en el inventario del vendedor. */
export const INVENTORY_PAGE_SIZE = 10;
