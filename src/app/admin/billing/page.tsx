import type { Metadata } from "next";
import {
  getAdminPayments,
  getAiControlData,
  getBillingCohorts,
} from "@/lib/admin/metrics";
import { savePlatformSettingsAction } from "@/lib/admin/actions";
import { PLANS, UPSELLS, planMonthlyEquivalent } from "@/lib/plans";
import { StatCard } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Billing" };

export default async function AdminBillingPage() {
  const [payments, ai, cohorts] = await Promise.all([
    getAdminPayments(),
    getAiControlData(),
    getBillingCohorts(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl tracking-wide">Billing</h2>
        <p className="text-sm text-muted-foreground">
          Cobro anual (mejor fit Ecuador). Upsells puntuales. Stripe / PayPhone /
          Paymentez. Sin pago → tienda pausada.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="font-heading text-lg">Cohortes de facturación</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Trial"
            value={cohorts.trial}
            hint={`${cohorts.trialsExpiring7d} vencen en 7 días`}
          />
          <StatCard
            label="Pagando (active)"
            value={cohorts.activePaid}
            hint={`Conversión trial→pago ${cohorts.trialToPaidPct}%`}
            tone="success"
          />
          <StatCard
            label="Churn / riesgo"
            value={`${cohorts.churnPct}%`}
            hint={`${cohorts.pastDue} past due · ${cohorts.canceled} cancelados`}
            tone={cohorts.churnPct >= 20 ? "warning" : "default"}
          />
          <StatCard
            label="Pagos pendientes"
            value={cohorts.pendingPayments}
            hint={`$${cohorts.revenuePendingUsd.toFixed(0)} · ${cohorts.paidPayments30d} cobrados (30d)`}
            tone={cohorts.pendingPayments > 0 ? "warning" : "default"}
          />
        </div>
        <ul className="flex flex-wrap gap-2 text-sm">
          {cohorts.byPlan.map((p) => (
            <li
              key={p.planId}
              className="rounded-md border border-border/50 bg-card/50 px-3 py-1.5"
            >
              <span className="text-muted-foreground">{p.name}</span>{" "}
              <span className="font-medium text-primary">{p.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {Object.values(PLANS).map((plan) => (
          <div
            key={plan.id}
            className="rounded-xl border border-border/60 bg-card/60 p-4"
          >
            <p className="font-heading text-xl">{plan.name}</p>
            <p className="text-2xl text-primary">${plan.priceUsdAnnual}/año</p>
            <p className="text-xs text-muted-foreground">
              ≈ ${planMonthlyEquivalent(plan)}/mes
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {plan.productLimit} productos · {plan.aiCreditsMonthly} créditos
              IA/mes
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {plan.description}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
        <h3 className="font-heading text-lg">Upsells (pago puntual)</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {Object.values(UPSELLS).map((u) => (
            <div key={u.id} className="rounded-lg border border-border/50 p-3">
              <p className="font-medium">{u.name}</p>
              <p className="text-primary">
                ${u.priceUsd}{" "}
                <span className="text-xs text-muted-foreground">
                  / {u.periodLabel}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{u.description}</p>
            </div>
          ))}
        </div>
      </section>

      <form action={savePlatformSettingsAction} className="space-y-3 rounded-xl border border-border/60 bg-card/60 p-4">
        <h3 className="font-heading text-lg">Proveedor de cobro</h3>
        <input
          type="hidden"
          name="geminiCostPerRequest"
          value={ai.settings.geminiCostPerRequest}
        />
        <input
          type="hidden"
          name="aiCostAlertPercent"
          value={ai.settings.aiCostAlertPercent}
        />
        <input
          type="hidden"
          name="aiRateLimitPerIpHour"
          value={ai.settings.aiRateLimitPerIpHour}
        />
        <input
          type="hidden"
          name="homeBannerText"
          value={ai.settings.homeBannerText ?? ""}
        />
        <div className="space-y-1.5 max-w-sm">
          <Label htmlFor="billingProvider">Gateway</Label>
          <Input
            id="billingProvider"
            name="billingProvider"
            defaultValue={ai.settings.billingProvider}
            placeholder="manual | stripe | payphone | paymentez"
          />
          <p className="text-xs text-muted-foreground">
            Integra webhooks en{" "}
            <code>/api/billing/webhook</code> (próximo). Si falla el cobro →
            storeStatus=paused.
          </p>
        </div>
        <Button type="submit">Guardar proveedor</Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tienda</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Proveedor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm">
                  {new Date(p.createdAt).toLocaleDateString("es-EC")}
                </TableCell>
                <TableCell>{p.sellerName}</TableCell>
                <TableCell className="text-sm">{p.type}</TableCell>
                <TableCell>${p.amountUsd.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge
                    variant={p.status === "paid" ? "secondary" : "outline"}
                  >
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{p.provider}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
