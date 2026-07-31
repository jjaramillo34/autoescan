import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { Payment } from "@/lib/models/Payment";
import { demoPayments, type AdminPaymentRow } from "@/lib/admin/demo-admin";
import {
  PLANS,
  UPSELLS,
  planMonthlyEquivalent,
  type PlanId,
} from "@/lib/plans";
import { getSellerProfile } from "@/lib/seller-profile";

export type PaymentType =
  | "subscription"
  | "ai_credits"
  | "upsell_destacado"
  | "upsell_ai"
  | "upsell_banner";

export type UpsellKey = keyof typeof UPSELLS;

const UPSELL_TO_PAYMENT: Record<UpsellKey, PaymentType> = {
  destacado: "upsell_destacado",
  aiPriority: "upsell_ai",
  bannerHome: "upsell_banner",
};

export interface SellerPaymentRow {
  id: string;
  amountUsd: number;
  type: string;
  status: string;
  description: string;
  createdAt: string;
}

export async function requestPlanUpgrade(
  sellerId: string,
  planId: PlanId,
): Promise<{ payment: SellerPaymentRow; waUrl: string }> {
  const plan = PLANS[planId];
  if (!plan) throw new Error("Plan no válido.");

  const profile = await getSellerProfile(sellerId);
  const storeName = profile?.storeName || profile?.name || "Tienda";
  const description = `Solicitud plan ${plan.name} — anual $${plan.priceUsdAnnual} (~$${planMonthlyEquivalent(plan)}/mes)`;

  const payment = await createPendingPayment({
    sellerId,
    storeName,
    amountUsd: plan.priceUsdAnnual,
    type: "subscription",
    description,
    meta: { planId },
  });

  return {
    payment,
    waUrl: buildBillingWhatsApp({
      storeName,
      description,
      amountUsd: plan.priceUsdAnnual,
    }),
  };
}

export async function requestUpsell(
  sellerId: string,
  upsellKey: UpsellKey,
): Promise<{ payment: SellerPaymentRow; waUrl: string }> {
  const upsell = UPSELLS[upsellKey];
  if (!upsell) throw new Error("Impulso no válido.");

  const profile = await getSellerProfile(sellerId);
  const storeName = profile?.storeName || profile?.name || "Tienda";
  const description = `Solicitud: ${upsell.name} (${upsell.periodLabel})`;

  const payment = await createPendingPayment({
    sellerId,
    storeName,
    amountUsd: upsell.priceUsd,
    type: UPSELL_TO_PAYMENT[upsellKey],
    description,
    meta: { upsellKey },
  });

  return {
    payment,
    waUrl: buildBillingWhatsApp({
      storeName,
      description,
      amountUsd: upsell.priceUsd,
    }),
  };
}

export async function getSellerPayments(
  sellerId: string,
): Promise<SellerPaymentRow[]> {
  if (!isDatabaseConfigured()) {
    const profile = await getSellerProfile(sellerId);
    const name = profile?.storeName || "";
    return demoPayments
      .filter((p) => !name || p.sellerName === name)
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        amountUsd: p.amountUsd,
        type: p.type,
        status: p.status,
        description: p.description,
        createdAt: p.createdAt,
      }));
  }

  await connectDB();
  const rows = await Payment.find({ seller: sellerId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return rows.map((p) => ({
    id: String(p._id),
    amountUsd: p.amountUsd,
    type: p.type,
    status: p.status,
    description: p.description || "",
    createdAt: p.createdAt
      ? new Date(p.createdAt as Date).toISOString()
      : new Date().toISOString(),
  }));
}

async function createPendingPayment(input: {
  sellerId: string;
  storeName: string;
  amountUsd: number;
  type: PaymentType;
  description: string;
  meta?: Record<string, unknown>;
}): Promise<SellerPaymentRow> {
  if (!isDatabaseConfigured()) {
    const row: AdminPaymentRow = {
      id: `pay-${Date.now()}`,
      sellerName: input.storeName,
      amountUsd: input.amountUsd,
      type: input.type,
      status: "pending",
      provider: "manual",
      description: input.description,
      createdAt: new Date().toISOString(),
    };
    demoPayments.unshift(row);
    return {
      id: row.id,
      amountUsd: row.amountUsd,
      type: row.type,
      status: row.status,
      description: row.description,
      createdAt: row.createdAt,
    };
  }

  await connectDB();
  const created = await Payment.create({
    seller: input.sellerId,
    amountUsd: input.amountUsd,
    type: input.type,
    status: "pending",
    provider: "manual",
    description: input.description,
    meta: input.meta ?? {},
  });

  return {
    id: String(created._id),
    amountUsd: created.amountUsd,
    type: created.type,
    status: created.status,
    description: created.description || "",
    createdAt: created.createdAt
      ? new Date(created.createdAt).toISOString()
      : new Date().toISOString(),
  };
}

export function getSupportWhatsAppPhone(): string {
  return (
    process.env.AUTOESCAN_SUPPORT_WHATSAPP?.trim() || "+593999999999"
  );
}

function buildBillingWhatsApp(input: {
  storeName: string;
  description: string;
  amountUsd: number;
}) {
  const phone = getSupportWhatsAppPhone();
  const message = `Hola AutoEscán, soy ${input.storeName}. Quiero contratar: ${input.description} por $${input.amountUsd.toFixed(2)}. ¿Me indican cómo pagar?`;
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("593") ? digits : `593${digits}`}?text=${encodeURIComponent(message)}`;
}
