/** Utilidades de teléfono seguras para cliente y servidor (sin mongoose). */

const ECUADOR_MOBILE = /^\+593\d{9}$/;

export function contactPhone(seller: {
  phone: string;
  whatsappPhone?: string | null;
}): string {
  const wa = seller.whatsappPhone?.trim();
  if (wa && ECUADOR_MOBILE.test(wa)) return wa;
  return seller.phone;
}

export function isValidEcuadorMobile(phone: string): boolean {
  return ECUADOR_MOBILE.test(phone.trim());
}
