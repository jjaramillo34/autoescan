import { contactPhone } from "@/lib/phone";
import type { PartDTO, SellerInfo } from "@/lib/types";

function normalizeEcuadorPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("593")) return digits;
  if (digits.startsWith("0") && digits.length === 10) {
    return `593${digits.slice(1)}`;
  }
  if (digits.length === 9) return `593${digits}`;
  return digits;
}

export function buildWhatsAppUrl(part: PartDTO): string {
  const seller =
    typeof part.seller === "string" ? null : (part.seller as SellerInfo);

  const phone = seller
    ? contactPhone(seller)
    : "+593987654321";
  const storeName = seller?.storeName || seller?.name || "vendedor";
  const code = part.partCode ? ` (código ${part.partCode})` : "";
  const message = `Hola ${storeName}, vi su publicación de ${part.title}${code} por $${part.price.toFixed(2)} en la app y deseo saber si aún lo tienen disponible.`;

  return `https://wa.me/${normalizeEcuadorPhone(phone)}?text=${encodeURIComponent(message)}`;
}

export function buildStoreWhatsAppUrl(input: {
  phone: string;
  storeName: string;
  message?: string;
}): string {
  const message =
    input.message ||
    `Hola ${input.storeName}, vi su anuncio destacado en AutoEscán y quiero consultar por repuestos disponibles.`;

  return `https://wa.me/${normalizeEcuadorPhone(input.phone)}?text=${encodeURIComponent(message)}`;
}

/** Recordatorio al propio vendedor (o a su bodega) por stock bajo. */
export function buildStockAlertWhatsAppUrl(input: {
  phone: string;
  storeName: string;
  items: { title: string; partCode?: string; stockQuantity: number }[];
}): string {
  const lines = input.items
    .slice(0, 8)
    .map(
      (i) =>
        `• ${i.title}${i.partCode ? ` (${i.partCode})` : ""} — ${i.stockQuantity} und.`,
    )
    .join("\n");
  const message = `Alerta de stock — ${input.storeName}\n\nProductos con pocas unidades:\n${lines}\n\nRevisa el inventario en AutoEscán.`;
  return `https://wa.me/${normalizeEcuadorPhone(input.phone)}?text=${encodeURIComponent(message)}`;
}
