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

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Control de IA" };

export default async function AdminIaPage() {
  const data = await getAiControlData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl tracking-wide">Control de IA</h2>
        <p className="text-sm text-muted-foreground">
          Contador Gemini, costo estimado, rate limits y créditos por plan.
        </p>
      </div>

      {data.aiAlert && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
          Costo IA &gt; {data.aiAlertPercent}% de ingresos este mes.
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Requests hoy" value={data.aiRequestsToday} />
        <StatCard label="Requests mes" value={data.aiRequestsMonth} />
        <StatCard
          label="Costo estimado mes"
          value={`$${data.geminiCostMonth.toFixed(3)}`}
        />
        <StatCard
          label="Ingresos mes"
          value={`$${data.revenueMonth.toFixed(0)}`}
          tone="success"
        />
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
            step="0.0001"
            defaultValue={data.settings.geminiCostPerRequest}
          />
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
        <div className="flex items-end">
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
