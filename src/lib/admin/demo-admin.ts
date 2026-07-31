import {
  DEFAULT_AI_COST_ALERT_PERCENT,
  DEFAULT_GEMINI_COST_PER_REQUEST,
  DEFAULT_GEMINI_MONTHLY_BUDGET_USD,
  PLANS,
  type BillingStatus,
  type PlanId,
  type StoreStatus,
} from "@/lib/plans";
import { DEMO_SELLER_ID } from "@/lib/constants";

export interface AdminSellerRow {
  id: string;
  name: string;
  email: string;
  storeName: string;
  phone: string;
  storeStatus: StoreStatus;
  planId: PlanId;
  billingStatus: BillingStatus;
  currentPeriodEnd: string;
  productLimit: number;
  productCount: number;
  aiCreditsIncluded: number;
  aiCreditsUsed: number;
  aiCreditsExtra: number;
  aiPriority: boolean;
  featuredUntil?: string;
  revenueUsd: number;
  estimatedAiCostUsd: number;
}

export interface AdminPaymentRow {
  id: string;
  sellerName: string;
  amountUsd: number;
  type: string;
  status: string;
  provider: string;
  description: string;
  createdAt: string;
}

export interface AdminPartModeration {
  id: string;
  title: string;
  price: number;
  brand: string;
  model: string;
  storeName: string;
  moderationStatus: "pending" | "approved" | "rejected" | "reported";
  reportReason: string;
  moderationReason?: string;
  isFeatured: boolean;
  images: number;
}

const periodEnd = new Date();
periodEnd.setFullYear(periodEnd.getFullYear() + 1);

export let demoSellers: AdminSellerRow[] = [
  {
    id: DEMO_SELLER_ID,
    name: "Carlos Mendoza",
    email: "vendedor@autoescan.ec",
    storeName: "Repuestos Ambato Center",
    phone: "+593987654321",
    storeStatus: "active",
    planId: "pro",
    billingStatus: "active",
    currentPeriodEnd: periodEnd.toISOString(),
    productLimit: PLANS.pro.productLimit,
    productCount: 22,
    aiCreditsIncluded: PLANS.pro.aiCreditsMonthly,
    aiCreditsUsed: 128, // de la cuota mensual de IA
    aiCreditsExtra: 50,
    aiPriority: true,
    featuredUntil: periodEnd.toISOString(),
    revenueUsd: PLANS.pro.priceUsdAnnual,
    estimatedAiCostUsd: 128 * DEFAULT_GEMINI_COST_PER_REQUEST,
  },
  {
    id: "000000000000000000000002",
    name: "Ana Pérez",
    email: "ana@repuestosficoa.ec",
    storeName: "AutoPartes Ficoa",
    phone: "+593998877665",
    storeStatus: "pending",
    planId: "basico",
    billingStatus: "trial",
    currentPeriodEnd: periodEnd.toISOString(),
    productLimit: PLANS.basico.productLimit,
    productCount: 8,
    aiCreditsIncluded: PLANS.basico.aiCreditsMonthly,
    aiCreditsUsed: 12,
    aiCreditsExtra: 0,
    aiPriority: false,
    revenueUsd: 0,
    estimatedAiCostUsd: 12 * DEFAULT_GEMINI_COST_PER_REQUEST,
  },
  {
    id: "000000000000000000000003",
    name: "Luis Torres",
    email: "luis@huachi.ec",
    storeName: "Repuestos Huachi",
    phone: "+593991122334",
    storeStatus: "paused",
    planId: "basico",
    billingStatus: "past_due",
    currentPeriodEnd: new Date(Date.now() - 86400000 * 3).toISOString(),
    productLimit: PLANS.basico.productLimit,
    productCount: 15,
    aiCreditsIncluded: PLANS.basico.aiCreditsMonthly,
    aiCreditsUsed: 100,
    aiCreditsExtra: 0,
    aiPriority: false,
    revenueUsd: PLANS.basico.priceUsdAnnual,
    estimatedAiCostUsd: 100 * DEFAULT_GEMINI_COST_PER_REQUEST,
  },
];

export let demoPayments: AdminPaymentRow[] = [
  {
    id: "pay1",
    sellerName: "Repuestos Ambato Center",
    amountUsd: 199,
    type: "subscription",
    status: "paid",
    provider: "manual",
    description: "Plan Pro — anual 2026",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "pay2",
    sellerName: "Repuestos Ambato Center",
    amountUsd: 12,
    type: "upsell_ai",
    status: "paid",
    provider: "payphone",
    description: "Prioridad IA — 30 días",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "pay3",
    sellerName: "Repuestos Huachi",
    amountUsd: 99,
    type: "subscription",
    status: "failed",
    provider: "stripe",
    description: "Plan Básico anual — cobro fallido",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export let demoAiLogs: {
  id: string;
  dateKey: string;
  costUsd: number;
  success: boolean;
  pieza: string;
  ipHash: string;
}[] = Array.from({ length: 40 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (i % 10));
  return {
    id: `ai${i}`,
    dateKey: d.toISOString().slice(0, 10),
    costUsd: DEFAULT_GEMINI_COST_PER_REQUEST,
    success: i % 17 !== 0,
    pieza: i % 3 === 0 ? "Sensor de oxígeno" : i % 3 === 1 ? "Pastillas de freno" : "Amortiguador",
    ipHash: `ip${i % 8}`,
  };
});

export let demoSearches: { query: string; count: number }[] = [
  { query: "sonda lambda", count: 48 },
  { query: "sensor de oxigeno", count: 41 },
  { query: "pastillas freno", count: 33 },
  { query: "amortiguador", count: 27 },
  { query: "bujias", count: 19 },
];

export let demoBrands: { brand: string; model: string; count: number }[] = [
  { brand: "Chevrolet", model: "Aveo", count: 56 },
  { brand: "Toyota", model: "Yaris", count: 44 },
  { brand: "Nissan", model: "Versa", count: 38 },
  { brand: "Hyundai", model: "Accent", count: 31 },
  { brand: "Kia", model: "Rio", count: 22 },
];

export let demoWhatsappClicks = 186;
export let demoAiSearches = 210;

export let demoModeration: AdminPartModeration[] = [
  {
    id: "mod1",
    title: "Sensor O2 genérico sin foto clara",
    price: 9,
    brand: "Chevrolet",
    model: "Spark",
    storeName: "AutoPartes Ficoa",
    moderationStatus: "pending",
    reportReason: "",
    isFeatured: false,
    images: 0,
  },
  {
    id: "mod2",
    title: "Pastillas premium oro 24k",
    price: 999,
    brand: "Toyota",
    model: "Yaris",
    storeName: "Repuestos Huachi",
    moderationStatus: "reported",
    reportReason: "Precio absurdo / posible spam",
    isFeatured: false,
    images: 1,
  },
];

export let platformSettingsDemo = {
  geminiCostPerRequest: DEFAULT_GEMINI_COST_PER_REQUEST,
  aiCostAlertPercent: DEFAULT_AI_COST_ALERT_PERCENT,
  geminiMonthlyBudgetUsd: DEFAULT_GEMINI_MONTHLY_BUDGET_USD,
  geminiBudgetHardStop: true,
  aiRateLimitPerIpHour: 30,
  aiRateLimitPerSessionDay: 40,
  billingProvider: "manual" as const,
  homeBannerText:
    "Envíos en Tungurahua · Consulta stock y precios por WhatsApp hoy",
  homeBannerSellerId: DEMO_SELLER_ID,
  homeBannerUntil: periodEnd.toISOString(),
};

export function updateDemoSeller(
  id: string,
  patch: Partial<AdminSellerRow>,
): AdminSellerRow | null {
  const idx = demoSellers.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  demoSellers[idx] = { ...demoSellers[idx], ...patch };
  return demoSellers[idx];
}
