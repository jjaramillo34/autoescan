import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { SimulatePayButton } from "@/components/seller/simulate-pay-button";
import { Button } from "@/components/ui/button";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { Payment } from "@/lib/models/Payment";
import { demoPayments } from "@/lib/admin/demo-admin";
import { billingAllowSimulate, isStripeConfigured } from "@/lib/stripe-checkout";
import { requireSellerSession } from "@/lib/session";
import { getSupportWhatsAppPhone } from "@/lib/seller-billing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout" };

interface PageProps {
  params: Promise<{ paymentId: string }>;
  searchParams: Promise<{ ok?: string }>;
}

export default async function SellerCheckoutPage({
  params,
  searchParams,
}: PageProps) {
  const session = await requireSellerSession();
  if (!session) {
    redirect("/iniciar-sesion?callbackUrl=/vendedor/impulsos");
  }

  const { paymentId } = await params;
  const { ok } = await searchParams;

  let payment: {
    id: string;
    amountUsd: number;
    description: string;
    status: string;
    sellerId?: string;
  } | null = null;

  if (!isDatabaseConfigured()) {
    const row = demoPayments.find((p) => p.id === paymentId);
    if (row) {
      payment = {
        id: row.id,
        amountUsd: row.amountUsd,
        description: row.description,
        status: row.status,
      };
    }
  } else {
    await connectDB();
    const row = await Payment.findById(paymentId).lean();
    if (row && String(row.seller) === session.user.id) {
      payment = {
        id: String(row._id),
        amountUsd: row.amountUsd,
        description: row.description || "",
        status: row.status,
        sellerId: String(row.seller),
      };
    }
  }

  if (!payment) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-10">
        <h1 className="font-heading text-2xl">Pago no encontrado</h1>
        <Button asChild>
          <Link href="/vendedor/impulsos">Volver a impulsos</Link>
        </Button>
      </div>
    );
  }

  const paid = payment.status === "paid" || ok === "1";
  const support = getSupportWhatsAppPhone().replace(/\D/g, "");
  const wa = `https://wa.me/${support.startsWith("593") ? support : `593${support}`}?text=${encodeURIComponent(
    `Hola, quiero pagar ${payment.description} (ref ${payment.id}) por $${payment.amountUsd.toFixed(2)}.`,
  )}`;

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Checkout
        </p>
        <h1 className="font-heading text-3xl tracking-wide">
          {paid ? "Pago recibido" : "Confirmar pago"}
        </h1>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/60 p-5 space-y-3">
        <p className="font-medium">{payment.description}</p>
        <p className="font-heading text-3xl text-primary">
          ${payment.amountUsd.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground">Ref: {payment.id}</p>

        {paid ? (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
            <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
            <p>
              Gracias. Tu plan o impulso se activará al confirmar el cobro
              {isStripeConfigured() ? " (Stripe)" : " (admin / simulación)"}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isStripeConfigured()
                ? "Si cancelaste Stripe, puedes reintentar desde impulsos o pagar por WhatsApp."
                : "Stripe aún no está configurado. Coordina transferencia / Payphone por WhatsApp, o simula el pago en desarrollo."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="gap-1.5">
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  Pagar por WhatsApp
                </a>
              </Button>
              {billingAllowSimulate() && (
                <SimulatePayButton paymentId={payment.id} />
              )}
            </div>
          </div>
        )}
      </div>

      <Button asChild variant="outline">
        <Link href="/vendedor/impulsos">Volver a planes</Link>
      </Button>
    </div>
  );
}
