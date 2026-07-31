export const PLAN_IDS = ["basico", "pro", "empresa"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const STORE_STATUSES = ["pending", "active", "paused", "banned"] as const;
export type StoreStatus = (typeof STORE_STATUSES)[number];

export const BILLING_STATUSES = [
  "trial",
  "active",
  "past_due",
  "canceled",
] as const;
export type BillingStatus = (typeof BILLING_STATUSES)[number];

/** Ciclo de cobro principal para el mercado ecuatoriano. */
export const BILLING_PERIOD = "annual" as const;

export interface PlanDefinition {
  id: PlanId;
  name: string;
  /** Precio de lista cobrado por año (USD). */
  priceUsdAnnual: number;
  /** Créditos IA renovados cada mes dentro del año pagado. */
  aiCreditsMonthly: number;
  productLimit: number;
  featuredSlots: number;
  aiPriority: boolean;
  description: string;
}

/**
 * Precios anuales pensados para locales de Ambato/Tungurahua.
 * Equivalente mensual solo es referencia (~precio/12).
 */
export const PLANS: Record<PlanId, PlanDefinition> = {
  basico: {
    id: "basico",
    name: "Básico",
    priceUsdAnnual: 99,
    productLimit: 50,
    aiCreditsMonthly: 80,
    featuredSlots: 0,
    aiPriority: false,
    description:
      "Pago anual. Ideal para un local pequeño en Ambato (~$8.25/mes).",
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceUsdAnnual: 199,
    productLimit: 300,
    aiCreditsMonthly: 400,
    featuredSlots: 5,
    aiPriority: true,
    description:
      "Pago anual. Más visibilidad + IA (~$16.60/mes). El más recomendado.",
  },
  empresa: {
    id: "empresa",
    name: "Empresa",
    priceUsdAnnual: 399,
    productLimit: 2000,
    aiCreditsMonthly: 1500,
    featuredSlots: 20,
    aiPriority: true,
    description:
      "Pago anual. Multi-local / mayor inventario (~$33.25/mes).",
  },
};

/** Compat: algunos módulos usaban priceUsd como “recurring unit”. */
export function planRecurringUsd(plan: PlanDefinition): number {
  return plan.priceUsdAnnual;
}

export function planMonthlyEquivalent(plan: PlanDefinition): number {
  return Number((plan.priceUsdAnnual / 12).toFixed(2));
}

/** Costo estimado por request Gemini (USD) — ajustable en settings. */
export const DEFAULT_GEMINI_COST_PER_REQUEST = 0.002;

/** Alerta si costo IA supera este % de ingresos del periodo. */
export const DEFAULT_AI_COST_ALERT_PERCENT = 25;

/** Upsells: cobro puntual (no suscripción anual). */
export const UPSELLS = {
  destacado: {
    id: "destacado",
    name: "Destacado en catálogo",
    priceUsd: 15,
    periodLabel: "30 días",
    description: "Tu repuesto aparece primero en el catálogo por 30 días.",
  },
  aiPriority: {
    id: "ai_priority",
    name: "Prioridad en resultados IA",
    priceUsd: 25,
    periodLabel: "30 días",
    description: "Mayor peso cuando Gemini recomienda tu inventario.",
  },
  bannerHome: {
    id: "banner_home",
    name: "Banner en home",
    priceUsd: 40,
    periodLabel: "7 días",
    description:
      "Logo de tu local, mensaje y botones a WhatsApp + catálogo en la portada.",
  },
} as const;
