/**
 * Contactos públicos configurables por env.
 * En producción define correos y WhatsApp reales.
 */

export function getSupportEmail(): string {
  return (
    process.env.AUTOESCAN_SUPPORT_EMAIL?.trim() ||
    process.env.AUTOESCAN_CONTACT_EMAIL?.trim() ||
    "hola@autoescan.ec"
  );
}

export function getPrivacyEmail(): string {
  return (
    process.env.AUTOESCAN_PRIVACY_EMAIL?.trim() || getSupportEmail()
  );
}

/** WhatsApp de soporte. Null si no está configurado (no usar número falso). */
export function getConfiguredSupportWhatsApp(): string | null {
  const value = process.env.AUTOESCAN_SUPPORT_WHATSAPP?.trim();
  return value || null;
}
