import type { Metadata } from "next";
import { getAiControlData } from "@/lib/admin/metrics";
import { savePlatformSettingsAction } from "@/lib/admin/actions";
import { StatCard } from "@/components/admin/stat-card";
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
import {
  getGeminiPricingSnapshot,
  planAiEconomics,
} from "@/lib/gemini-pricing";
import { PLANS } from "@/lib/plans";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Control de IA" };

export default async function AdminIaPage() {
  const data = await getAiControlData();
  const pricing = getGeminiPricingSnapshot();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl tracking-wide">Control de IA</h2>
        <p className="text-sm text-muted-foreground">
          Contador Gemini, pricing real (tokens), margen 10% y créditos por plan.
        </p>
      </div>

      {data.aiAlert && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
          Costo IA &gt; {data.aiAlertPercent}% de ingresos este mes.
        </div>
      )}
      {data.globalBudget.hardStopped && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
          Presupuesto Gemini del mes agotado ($
          {data.globalBudget.spentUsd.toFixed(2)} / $
          {data.globalBudget.budgetUsd}). Búsquedas por foto bloqueadas.
        </div>
      )}
      {!data.globalBudget.hardStopped && data.globalBudget.softWarned && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          Presupuesto Gemini al {data.globalBudget.usagePercent}% ($
          {data.globalBudget.spentUsd.toFixed(2)} / $
          {data.globalBudget.budgetUsd}).
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Requests hoy" value={data.aiRequestsToday} />
        <StatCard label="Requests mes" value={data.aiRequestsMonth} />
        <StatCard
          label="Costo estimado mes"
          value={`$${data.geminiCostMonth.toFixed(3)}`}
        />
        <StatCard
          label="Presupuesto Gemini"
          value={`${data.globalBudget.usagePercent}%`}
          hint={`$${data.globalBudget.spentUsd} / $${data.globalBudget.budgetUsd}`}
          tone={
            data.globalBudget.hardStopped
              ? "danger"
              : data.globalBudget.softWarned
                ? "warning"
                : "default"
          }
        />
        <StatCard
          label="Ingresos mes"
          value={`$${data.revenueMonth.toFixed(0)}`}
          tone="success"
        />
      </section>

      <section className="space-y-3 rounded-xl border border-border/60 bg-card/60 p-4">
        <div>
          <h3 className="font-heading text-lg">Pricing Gemini (pay-as-you-go)</h3>
          <p className="text-xs text-muted-foreground">
            USD por 1M tokens · Input ${pricing.rates.inputUsd} · Output $
            {pricing.rates.outputUsd} · Caché ${pricing.rates.cachedInputUsd}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {pricing.longContextNote}
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request</TableHead>
                <TableHead className="text-right">Input tok.</TableHead>
                <TableHead className="text-right">Output tok.</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="text-right">Mix</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricing.estimates.map((e) => (
                <TableRow key={e.kind}>
                  <TableCell>{e.label}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {e.inputTokens.toLocaleString("es-EC")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {e.outputTokens.toLocaleString("es-EC")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ${e.costUsd.toFixed(5)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {e.mixPercent}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Costo blend / request"
            value={`$${pricing.blendedCostPerRequest}`}
            hint="70% foto · 30% descripción"
          />
          <StatCard
            label="Crédito con +10%"
            value={`$${pricing.creditSellPrice}`}
            hint="Costo Gemini × 1.10"
            tone="success"
          />
          <StatCard
            label="Margen IA"
            value={`${pricing.marginPercent}%`}
            hint="Sobre costo de tokens"
          />
        </div>

        <div>
          <h4 className="mb-2 font-heading text-base">
            Planes → cupo IA (8% del fee mensual)
          </h4>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Fee / mes</TableHead>
                  <TableHead className="text-right">Créditos</TableHead>
                  <TableHead className="text-right">Costo Gemini</TableHead>
                  <TableHead className="text-right">+10% margen</TableHead>
                  <TableHead className="text-right">% del plan</TableHead>
                  <TableHead className="text-right">Sugerido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(PLANS).map((plan) => {
                  const econ = planAiEconomics(plan);
                  return (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        ${econ.monthlyFee}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {plan.aiCreditsMonthly}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ${econ.monthlyAiCost}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600">
                        ${econ.monthlyMarginUsd}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {econ.shareOfPlanPercent}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {econ.suggestedCredits}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Con Flash a estos precios, la IA sale barata: el cupo generoso cabe
            en ~8% del plan y aún deja 10% sobre el costo de tokens. El resto del
            fee paga marketplace (catálogo, destacados, soporte).
          </p>
        </div>
      </section>

      <form
        action={savePlatformSettingsAction}
        className="grid gap-3 rounded-xl border border-border/60 bg-card/60 p-4 sm:grid-cols-2"
      >
        <input
          type="hidden"
          name="billingProvider"
          value={data.settings.billingProvider}
        />
        <input
          type="hidden"
          name="homeBannerText"
          value={data.settings.homeBannerText ?? ""}
        />
        <div className="space-y-1.5">
          <Label htmlFor="geminiCostPerRequest">Costo USD / request</Label>
          <Input
            id="geminiCostPerRequest"
            name="geminiCostPerRequest"
            type="number"
            step="0.00001"
            defaultValue={data.settings.geminiCostPerRequest}
          />
          <p className="text-xs text-muted-foreground">
            Referencia blend: ${pricing.blendedCostPerRequest}. Si en Mongo tienes
            un valor viejo (ej. 0.002), actualízalo aquí.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aiCostAlertPercent">Alerta si IA &gt; % ingresos</Label>
          <Input
            id="aiCostAlertPercent"
            name="aiCostAlertPercent"
            type="number"
            defaultValue={data.settings.aiCostAlertPercent}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aiRateLimitPerIpHour">Rate limit / IP / hora</Label>
          <Input
            id="aiRateLimitPerIpHour"
            name="aiRateLimitPerIpHour"
            type="number"
            defaultValue={data.settings.aiRateLimitPerIpHour}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="geminiMonthlyBudgetUsd">
            Presupuesto Gemini / mes (USD)
          </Label>
          <Input
            id="geminiMonthlyBudgetUsd"
            name="geminiMonthlyBudgetUsd"
            type="number"
            step="1"
            min="0"
            defaultValue={data.settings.geminiMonthlyBudgetUsd}
          />
          <p className="text-xs text-muted-foreground">
            Tope de la plataforma para búsquedas por foto. Default $30.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="geminiBudgetHardStop">
            Hard stop al llegar al presupuesto
          </Label>
          <select
            id="geminiBudgetHardStop"
            name="geminiBudgetHardStop"
            defaultValue={
              data.settings.geminiBudgetHardStop === false ? "false" : "true"
            }
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
          >
            <option value="true">Sí — bloquear fotos</option>
            <option value="false">No — solo alertar</option>
          </select>
        </div>
        <div className="flex items-end sm:col-span-2">
          <Button type="submit">Guardar límites</Button>
        </div>
      </form>

      <div>
        <h3 className="mb-2 font-heading text-lg">Créditos por vendedor</h3>
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tienda</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Usados</TableHead>
                <TableHead>Restantes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sellersCredits.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.storeName}</TableCell>
                  <TableCell>{s.planId}</TableCell>
                  <TableCell>
                    {s.used}/{s.included + s.extra}
                  </TableCell>
                  <TableCell>{s.remaining}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-heading text-lg">Últimos requests</h3>
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Pieza</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>OK</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentLogs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-sm">{l.dateKey}</TableCell>
                  <TableCell>{l.pieza || "—"}</TableCell>
                  <TableCell>${l.costUsd.toFixed(4)}</TableCell>
                  <TableCell className="font-mono text-xs">{l.ipHash}</TableCell>
                  <TableCell>{l.success ? "Sí" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
