/**
 * Control de contacto WhatsApp en catálogo público.
 *
 * Soft (default): WA abierto; tras el clic se sugiere crear cuenta.
 * Hard: solo usuarios logueados pueden abrir WA.
 *   Activar con NEXT_PUBLIC_WHATSAPP_REQUIRE_LOGIN=1
 */

export function isWhatsAppLoginRequired(): boolean {
  return process.env.NEXT_PUBLIC_WHATSAPP_REQUIRE_LOGIN === "1";
}

/** Soft prompt post-clic. Desactivar con NEXT_PUBLIC_WHATSAPP_SOFT_PROMPT=0 */
export function isWhatsAppSoftPromptEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WHATSAPP_SOFT_PROMPT !== "0";
}

export const WA_SOFT_PROMPT_DISMISS_KEY = "ae_wa_soft_prompt_until";

/** No volver a mostrar el soft prompt hasta esta fecha (ms). */
export function shouldShowWhatsAppSoftPrompt(): boolean {
  if (typeof window === "undefined") return false;
  if (!isWhatsAppSoftPromptEnabled()) return false;
  try {
    const until = Number(window.localStorage.getItem(WA_SOFT_PROMPT_DISMISS_KEY) || 0);
    return !until || Date.now() > until;
  } catch {
    return true;
  }
}

/** Silencia el soft prompt por 7 días. */
export function dismissWhatsAppSoftPrompt(days = 7) {
  if (typeof window === "undefined") return;
  try {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(WA_SOFT_PROMPT_DISMISS_KEY, String(until));
  } catch {
    /* ignore */
  }
}

export function loginUrlForWhatsApp(partId?: string) {
  const next = partId ? `/repuesto/${partId}` : "/";
  return `/iniciar-sesion?callbackUrl=${encodeURIComponent(next)}`;
}

export function registerUrlForWhatsApp(partId?: string) {
  const next = partId ? `/repuesto/${partId}` : "/guardados";
  return `/registro?callbackUrl=${encodeURIComponent(next)}`;
}
