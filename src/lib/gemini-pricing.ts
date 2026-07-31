/**
 * Precios Gemini API (pay-as-you-go) — referencia comercial.
 * Fuente: tarifas estándar por 1M tokens (Flash / multimodal).
 *
 * Nota: contextos >128k tokens duplican input/output.
 */

export const GEMINI_PRICE_PER_MILLION = {
  inputUsd: 0.3,
  outputUsd: 2.5,
  cachedInputUsd: 0.015,
} as const;

/** Estimación de tokens por tipo de request en AutoEscán. */
export const GEMINI_TOKEN_ESTIMATES = {
  /** Buscar por foto: prompt + imagen JPEG típica + JSON corto. */
  identifyPart: {
    label: "Buscar por foto (identify)",
    inputTokens: 1200, // ~200 prompt + ~1000 imagen
    outputTokens: 150,
  },
  /** Descripción de producto para el vendedor. */
  generateDescription: {
    label: "Descripción con IA",
    inputTokens: 280,
    outputTokens: 120,
  },
} as const;

export type GeminiRequestKind = keyof typeof GEMINI_TOKEN_ESTIMATES;

/** Mix realista del marketplace: más fotos de compradores que descripciones. */
export const GEMINI_USAGE_MIX: Record<GeminiRequestKind, number> = {
  identifyPart: 0.7,
  generateDescription: 0.3,
};

/** Margen objetivo sobre el costo Gemini al empaquetar créditos en el plan. */
export const AI_CREDIT_MARGIN = 0.1; // 10%

export function tokensToUsd(input: {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  longContext?: boolean;
}): number {
  const mult = input.longContext ? 2 : 1;
  const inputRate = GEMINI_PRICE_PER_MILLION.inputUsd * mult;
  const outputRate = GEMINI_PRICE_PER_MILLION.outputUsd * mult;
  const cached = input.cachedInputTokens ?? 0;

  return (
    (input.inputTokens / 1_000_000) * inputRate +
    (input.outputTokens / 1_000_000) * outputRate +
    (cached / 1_000_000) * GEMINI_PRICE_PER_MILLION.cachedInputUsd
  );
}

export function costForRequestKind(kind: GeminiRequestKind): number {
  const est = GEMINI_TOKEN_ESTIMATES[kind];
  return tokensToUsd({
    inputTokens: est.inputTokens,
    outputTokens: est.outputTokens,
  });
}

/** Costo promedio ponderado por request (sin margen). */
export function blendedGeminiCostPerRequest(): number {
  let total = 0;
  for (const kind of Object.keys(GEMINI_TOKEN_ESTIMATES) as GeminiRequestKind[]) {
    total += costForRequestKind(kind) * GEMINI_USAGE_MIX[kind];
  }
  return total;
}

/** Precio interno del crédito = costo Gemini × (1 + margen). */
export function creditSellPriceUsd(costPerRequest = blendedGeminiCostPerRequest()): number {
  return costPerRequest * (1 + AI_CREDIT_MARGIN);
}

/**
 * Cuántos créditos mensuales caben en un presupuesto de plan
 * cobrando costo Gemini + 10% de ganancia.
 */
export function creditsFromBudgetUsd(budgetUsd: number): number {
  const unit = creditSellPriceUsd();
  if (unit <= 0) return 0;
  return Math.max(0, Math.floor(budgetUsd / unit));
}

/** % del fee mensual del plan que destinamos a cupo IA (resto = marketplace). */
export const PLAN_AI_BUDGET_SHARE = 0.08;

export function planAiEconomics(input: {
  priceUsdAnnual: number;
  aiCreditsMonthly: number;
}) {
  const monthlyFee = input.priceUsdAnnual / 12;
  const costPer = blendedGeminiCostPerRequest();
  const sellPer = creditSellPriceUsd(costPer);
  const monthlyAiCost = input.aiCreditsMonthly * costPer;
  const monthlyAiRevenueEquiv = input.aiCreditsMonthly * sellPer;
  const monthlyMarginUsd = monthlyAiRevenueEquiv - monthlyAiCost;
  const shareOfPlan =
    monthlyFee > 0 ? (monthlyAiRevenueEquiv / monthlyFee) * 100 : 0;

  return {
    monthlyFee: Number(monthlyFee.toFixed(2)),
    costPerRequest: Number(costPer.toFixed(6)),
    creditSellPrice: Number(sellPer.toFixed(6)),
    monthlyAiCost: Number(monthlyAiCost.toFixed(4)),
    monthlyAiRevenueEquiv: Number(monthlyAiRevenueEquiv.toFixed(4)),
    monthlyMarginUsd: Number(monthlyMarginUsd.toFixed(4)),
    marginPercent: AI_CREDIT_MARGIN * 100,
    shareOfPlanPercent: Number(shareOfPlan.toFixed(1)),
    /** Créditos sugeridos si el 8% del fee mensual va a IA con 10% margen. */
    suggestedCredits: creditsFromBudgetUsd(monthlyFee * PLAN_AI_BUDGET_SHARE),
  };
}

export function getGeminiPricingSnapshot() {
  const costPer = blendedGeminiCostPerRequest();
  return {
    rates: GEMINI_PRICE_PER_MILLION,
    estimates: Object.entries(GEMINI_TOKEN_ESTIMATES).map(([kind, est]) => ({
      kind: kind as GeminiRequestKind,
      label: est.label,
      inputTokens: est.inputTokens,
      outputTokens: est.outputTokens,
      costUsd: Number(costForRequestKind(kind as GeminiRequestKind).toFixed(6)),
      mixPercent: Math.round(GEMINI_USAGE_MIX[kind as GeminiRequestKind] * 100),
    })),
    blendedCostPerRequest: Number(costPer.toFixed(6)),
    creditSellPrice: Number(creditSellPriceUsd(costPer).toFixed(6)),
    marginPercent: AI_CREDIT_MARGIN * 100,
    longContextNote:
      "Si el contexto supera 128k tokens, input y output se cobran al doble.",
  };
}
