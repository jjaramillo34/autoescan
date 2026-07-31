export type WhatsAppTemplateId =
  | "disponible"
  | "precio"
  | "ubicacion"
  | "reserva"
  | "agotado"
  | "alternativo";

export interface WhatsAppTemplateDef {
  id: WhatsAppTemplateId;
  label: string;
  description: string;
  /** Placeholders: {titulo} {codigo} {precio} {marca} {modelo} {tienda} {sector} */
  body: string;
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplateDef[] = [
  {
    id: "disponible",
    label: "Sí, disponible",
    description: "Confirmar stock y cerrar la venta",
    body: "Hola, sí tenemos *{titulo}*{codigo_paren} disponible. Precio: ${precio}. Puede pasar a {tienda} ({sector}) o le reservamos. ¿A qué hora le queda bien?",
  },
  {
    id: "precio",
    label: "Cotización",
    description: "Enviar precio y compatibilidad",
    body: "Hola, el *{titulo}*{codigo_paren} para {marca} {modelo} está en ${precio}. Incluye IVA. ¿Lo necesita para hoy?",
  },
  {
    id: "ubicacion",
    label: "Ubicación / horario",
    description: "Cómo llegar al local",
    body: "Estamos en {tienda}, sector {sector} (Ambato). Horario habitual de atención. Cuando llegue mencione AutoEscán y el código{codigo_paren}.",
  },
  {
    id: "reserva",
    label: "Reservar",
    description: "Apartar mientras llega el cliente",
    body: "Le reservo el *{titulo}*{codigo_paren} por 2 horas. Precio ${precio}. Cuando esté cerca me avisa por aquí.",
  },
  {
    id: "agotado",
    label: "Agotado / llega",
    description: "Sin stock con fecha tentativa",
    body: "Por ahora el *{titulo}*{codigo_paren} está agotado. Puedo avisarle apenas llegue o cotizarle una alternativa compatible con {marca} {modelo}.",
  },
  {
    id: "alternativo",
    label: "Alternativa",
    description: "Ofrecer otra opción similar",
    body: "No tengo exactamente ese, pero tengo una alternativa compatible con {marca} {modelo}. ¿Le interesa que le pase foto y precio?",
  },
];

export interface TemplatePartContext {
  title?: string;
  partCode?: string;
  price?: number;
  brand?: string;
  model?: string;
  location?: string;
  storeName?: string;
}

export interface TemplateProductOption {
  id: string;
  title: string;
  partCode?: string;
  price: number;
  brand: string;
  model: string;
  location: string;
}

export function fillWhatsAppTemplate(
  template: WhatsAppTemplateDef,
  ctx: TemplatePartContext,
): string {
  const codigo = (ctx.partCode || "").trim();
  const precio =
    typeof ctx.price === "number" && Number.isFinite(ctx.price)
      ? ctx.price.toFixed(2)
      : "—";

  return template.body
    .replaceAll("{titulo}", ctx.title?.trim() || "repuesto")
    .replaceAll("{codigo_paren}", codigo ? ` (código ${codigo})` : "")
    .replaceAll("{codigo}", codigo || "—")
    .replaceAll("{precio}", precio)
    .replaceAll("{marca}", ctx.brand?.trim() || "su vehículo")
    .replaceAll("{modelo}", ctx.model?.trim() || "")
    .replaceAll("{tienda}", ctx.storeName?.trim() || "nuestro local")
    .replaceAll("{sector}", ctx.location?.trim() || "Ambato")
    .replace(/\s+/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}
