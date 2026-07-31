"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2, MessageCircle, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  requestPlanAction,
  requestUpsellAction,
} from "@/lib/actions/billing";
import {
  PLANS,
  UPSELLS,
  planMonthlyEquivalent,
  type PlanId,
} from "@/lib/plans";
import type { SellerPaymentRow } from "@/lib/seller-billing";
import { cn } from "@/lib/utils";

interface ImpulsosPanelProps {
  currentPlanId: PlanId;
  payments: SellerPaymentRow[];
}

const UPSELL_KEYS = ["destacado", "aiPriority", "bannerHome"] as const;

export function ImpulsosPanel({
  currentPlanId,
  payments,
}: ImpulsosPanelProps) {
  const [pending, startTransition] = useTransition();

  function goCheckout(
    result: {
      checkoutUrl?: string;
      waUrl: string;
      provider?: string;
    },
    label: string,
  ) {
    toast.success(label, {
      description:
        result.provider === "stripe"
          ? "Te llevamos a Stripe Checkout."
          : "Puedes pagar en línea (dev) o por WhatsApp.",
    });
    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }
    window.open(result.waUrl, "_blank", "noopener,noreferrer");
  }

  function requestPlan(planId: PlanId) {
    startTransition(async () => {
      const result = await requestPlanAction(planId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      goCheckout(result, "Solicitud registrada");
    });
  }

  function requestUpsell(key: (typeof UPSELL_KEYS)[number]) {
    startTransition(async () => {
      const result = await requestUpsellAction(key);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      goCheckout(result, "Impulso solicitado");
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-heading text-xl tracking-wide">Planes anuales</h2>
        <p className="text-sm text-muted-foreground">
          Checkout en línea (Stripe si está configurado) o WhatsApp / transferencia.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {(Object.values(PLANS) as (typeof PLANS)[PlanId][]).map((plan) => {
            const current = plan.id === currentPlanId;
            return (
              <article
                key={plan.id}
                className={cn(
                  "flex flex-col rounded-2xl border p-4",
                  current
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/60 bg-card/50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading text-lg tracking-wide">
                    {plan.name}
                  </h3>
                  {current && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                      <Check className="size-3.5" />
                      Actual
                    </span>
                  )}
                </div>
                <p className="mt-2 font-semibold text-primary">
                  ${plan.priceUsdAnnual}
                  <span className="text-sm font-normal text-muted-foreground">
                    /año
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  ~${planMonthlyEquivalent(plan)}/mes · {plan.productLimit}{" "}
                  productos · {plan.featuredSlots} destacados ·{" "}
                  {plan.aiCreditsMonthly} créditos IA/mes
                </p>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <Button
                  type="button"
                  className="mt-4"
                  variant={current ? "outline" : "default"}
                  disabled={pending || current}
                  onClick={() => requestPlan(plan.id)}
                >
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : current ? (
                    "Plan activo"
                  ) : (
                    "Pagar / solicitar"
                  )}
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl tracking-wide">Impulsos</h2>
        <p className="text-sm text-muted-foreground">
          Pagos puntuales para más visibilidad esta semana.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {UPSELL_KEYS.map((key) => {
            const u = UPSELLS[key];
            const Icon = key === "destacado" ? Star : Sparkles;
            return (
              <article
                key={key}
                className="flex flex-col rounded-2xl border border-border/60 bg-card/50 p-4"
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-primary" />
                  <h3 className="font-heading text-lg tracking-wide">
                    {u.name}
                  </h3>
                </div>
                <p className="mt-2 font-semibold text-primary">
                  ${u.priceUsd}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    · {u.periodLabel}
                  </span>
                </p>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">
                  {u.description}
                </p>
                <Button
                  type="button"
                  className="mt-4 gap-1.5"
                  disabled={pending}
                  onClick={() => requestUpsell(key)}
                >
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <MessageCircle className="size-4" />
                  )}
                  Pagar / solicitar
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      {payments.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-xl tracking-wide">
            Tus solicitudes
          </h2>
          <ul className="divide-y divide-border/50 rounded-xl border border-border/60">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString("es-EC")} ·{" "}
                    {p.type}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold">${p.amountUsd.toFixed(2)}</p>
                  <p
                    className={cn(
                      "text-xs capitalize",
                      p.status === "paid" && "text-emerald-600",
                      p.status === "pending" && "text-amber-600",
                      p.status === "failed" && "text-red-600",
                    )}
                  >
                    {p.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
