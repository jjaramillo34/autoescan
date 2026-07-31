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

  function requestPlan(planId: PlanId) {
    startTransition(async () => {
      const result = await requestPlanAction(planId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Solicitud registrada", {
        description: "Te abrimos WhatsApp con AutoEscán para coordinar el pago.",
      });
      window.open(result.waUrl, "_blank", "noopener,noreferrer");
    });
  }

  function requestUpsell(key: (typeof UPSELL_KEYS)[number]) {
    startTransition(async () => {
      const result = await requestUpsellAction(key);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Impulso solicitado", {
        description: "Coordina el pago por WhatsApp. El admin lo activará.",
      });
      window.open(result.waUrl, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-heading text-xl tracking-wide">Planes anuales</h2>
        <p className="text-sm text-muted-foreground">
          Cobro manual por ahora (transferencia / Payphone). Solicita y te
          contactamos por WhatsApp.
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
                    "Solicitar plan"
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
                  Solicitar por WhatsApp
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
